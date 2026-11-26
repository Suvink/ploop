import { render } from '@testing-library/react-native';
import { DateTime } from 'luxon';
import { generateDemoFlights } from '@/lib/demo';

const mockBase = generateDemoFlights(DateTime.local());
const mockFlights = [
  ...mockBase.slice(0, 6),
  { ...mockBase[0], id: 'dupe-1' },
  { ...mockBase[0], id: 'dupe-2', yearUnknown: true },
  {
    ...mockBase[1],
    id: 'unk',
    fromIata: 'ZZZ',
    toIata: 'QQQ',
    airlineIata: null,
    flightNumber: null,
  },
  { ...mockBase[2], id: 'future', date: DateTime.local().plus({ days: 20 }).toISODate()! },
  { ...mockBase[3], id: 'ret', fromIata: mockBase[3].toIata, toIata: mockBase[3].fromIata },
  { ...mockBase[4], id: 'xx', airlineIata: 'XX' },
];
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@/hooks/useFlights', () => ({
  useFlights: () => ({ flights: mockFlights, loaded: true }),
  useFlight: (id: string) => ({
    flight: mockFlights.find((f) => f.id === id) ?? mockFlights[0],
    loaded: true,
  }),
}));
jest.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      ...jest.requireActual('@/lib/settings').DEFAULT_SETTINGS,
      passportName: 'Ada L',
      homeAirport: 'CMB',
    },
    loaded: true,
    update: jest.fn(),
  }),
}));
jest.mock('@/db/repo', () => ({ getAllFlights: async () => [] }));
jest.mock('@/db/backupIo', () => ({}));
jest.mock('expo-router', () => {
  const S = () => null;
  S.Screen = () => null;
  return {
    router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
    Stack: S,
    useLocalSearchParams: () => ({ id: mockFlights[3].id, template: 'passport' }),
    useFocusEffect: jest.fn(),
  };
});
jest.mock('@expo/vector-icons/Feather', () => {
  const F = () => null;
  F.font = {};
  return F;
});
jest.mock('react-native-worklets', () => ({ scheduleOnRN: jest.fn() }));
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const id = (v: unknown) => v;
  const A = { View: RN.View, FlatList: RN.FlatList, createAnimatedComponent: id };
  return {
    __esModule: true,
    default: A,
    ...A,
    Easing: { out: id, in: id, inOut: id },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (f: () => unknown) => f(),
    useAnimatedProps: (f: () => unknown) => f(),
    useAnimatedScrollHandler: () => undefined,
    interpolate: (_v: number, _i: number[], o: number[]) => o[1] ?? o[0],
    withTiming: id,
    withDelay: (_d: number, v: unknown) => v,
    withRepeat: id,
    withSequence: id,
    withSpring: id,
    cancelAnimation: () => {},
  };
});

const screens: [string, () => unknown][] = [
  ['home', () => require('../../app/(tabs)/index').default],
  ['flights', () => require('../../app/(tabs)/flights').default],
  ['passport', () => require('../../app/(tabs)/passport').default],
  ['share', () => require('../../app/(tabs)/share').default],
  ['flight', () => require('../../app/flight/[id]').default],
  ['story', () => require('../../app/story/[template]').default],
  ['settings', () => require('../../app/settings').default],
];

it.each(screens)('%s has no duplicate keys', async (_n, get) => {
  const errors: string[] = [];
  const spy = jest
    .spyOn(console, 'error')
    .mockImplementation((...a) => errors.push(a.map(String).join(' ')));
  const C = get() as React.ComponentType;
  await render(<C />);
  spy.mockRestore();
  const dup = errors.filter((e) => /same key|unique "key"|key prop/i.test(e));
  if (dup.length) console.log(dup.map((d) => d.slice(0, 900)).join('\n----\n'));
  expect(dup).toEqual([]);
});
