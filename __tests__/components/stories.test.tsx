import { render, screen } from '@testing-library/react-native';
import { DateTime } from 'luxon';
import { generateDemoFlights } from '@/lib/demo';
import { computeStats } from '@/lib/stats';
import { buildMapData } from '@/lib/mapData';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { countries, getAirport } from '@/data/refdata';
import { storyThemes, STORY_THEME_ORDER } from '@/theme/storyThemes';
import { PassportStory } from '@/stories/PassportStory';
import { MapStory } from '@/stories/MapStory';
import { FlightStory } from '@/stories/FlightStory';
import { PassportBook } from '@/components/PassportBook';

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...a: unknown[]) => void, ...a: unknown[]) => fn(...a),
}));
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const pass = (c: unknown) => c;
  const Animated = { View: RN.View, FlatList: RN.FlatList, createAnimatedComponent: pass };
  const id = (v: unknown) => v;
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    Easing: { out: id, in: id, inOut: id, cubic: 0, quad: 0, sin: 0, linear: 0 },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (f: () => unknown) => f(),
    useAnimatedProps: (f: () => unknown) => f(),
    useAnimatedScrollHandler: () => undefined,
    interpolate: (_v: number, _i: number[], out: number[]) => out[1] ?? out[0],
    withTiming: id,
    withDelay: (_d: number, v: unknown) => v,
    withRepeat: id,
    withSequence: id,
    withSpring: id,
    cancelAnimation: () => {},
  };
});
jest.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { ...jest.requireActual('@/lib/settings').DEFAULT_SETTINGS },
    loaded: true,
    update: jest.fn(),
  }),
}));
jest.mock('@expo/vector-icons/Feather', () => {
  const Feather = () => null;
  Feather.font = {};
  return Feather;
});

let mockErrors: string[] = [];
beforeEach(() => {
  mockErrors = [];
  jest
    .spyOn(console, 'error')
    .mockImplementation((...a) => mockErrors.push(a.map(String).join(' ')));
});
afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
  const keyErrors = mockErrors.filter((e) => /same key|unique "key"|key prop/i.test(e));
  if (keyErrors.length) console.log(keyErrors.map((e) => e.slice(0, 600)).join('\n---\n'));
  expect(keyErrors).toEqual([]);
});

const today = DateTime.fromISO('2026-11-26');
const flights = generateDemoFlights(today);
const stats = computeStats(flights, getAirport, countries, {}, today.toISODate()!);
const map = buildMapData(flights, getAirport, {}, today.toISODate()!);
const settings = { ...DEFAULT_SETTINGS, passportName: 'Ada Lovelace' };

describe.each(STORY_THEME_ORDER)('stories render (%s)', (name) => {
  const theme = storyThemes[name];
  const options = { theme: name, hideExactDates: false };

  it('passport story shows the holder name', async () => {
    await render(
      <PassportStory stats={stats} settings={settings} theme={theme} options={options} />,
    );
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
  });

  it('map story', async () => {
    await render(
      <MapStory stats={stats} map={map} settings={settings} theme={theme} options={options} />,
    );
    expect(screen.getByText('Where I flew')).toBeTruthy();
  });

  it('flight story, including a flight without a year', async () => {
    const f = { ...flights[flights.length - 1], yearUnknown: true };
    await render(<FlightStory flight={f} settings={settings} theme={theme} options={options} />);
    expect(screen.getByText(f.fromIata)).toBeTruthy();
  });
});

it('passport book renders cover, data page and visa pages', async () => {
  await render(
    <PassportBook stats={stats} settings={settings} map={map} yearLabel="All time" gutter={24} />,
  );
  expect(screen.getByText('Ada Lovelace')).toBeTruthy();
  expect(screen.getByText('P · PLP · ALL TIME')).toBeTruthy();
  expect(screen.getByText(/^P<PLPADA<LOVELACE<</)).toBeTruthy();
});

describe('easter eggs', () => {
  it('flight 404 cannot be found', async () => {
    const f = { ...flights[flights.length - 1], flightNumber: '404' };
    const theme = storyThemes.paper;
    await render(
      <FlightStory
        flight={f}
        settings={settings}
        theme={theme}
        options={{ theme: 'paper', hideExactDates: false }}
      />,
    );
    expect(screen.getByText('Flight not found')).toBeTruthy();
    expect(screen.getByText('DESTINATION: LOST')).toBeTruthy();
  });

  it('The Loop adds a Cloud Nine stamp and a secret code-line tag', async () => {
    await render(
      <PassportBook
        stats={stats}
        settings={{ ...settings, loopFoundOn: '2026-11-26' }}
        map={map}
        yearLabel="All time"
        gutter={24}
      />,
    );
    expect(screen.getByLabelText('Cloud Nine, found 26 Nov 2026')).toBeTruthy();
    expect(screen.getByText(/<<LOOPDELOOP<<$/)).toBeTruthy();
  });

  it('no Cloud Nine before The Loop is found', async () => {
    await render(
      <PassportBook stats={stats} settings={settings} map={map} yearLabel="All time" gutter={24} />,
    );
    expect(screen.queryByLabelText(/Cloud Nine/)).toBeNull();
  });
});
