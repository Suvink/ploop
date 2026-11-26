import { render } from '@testing-library/react-native';
import { DateTime } from 'luxon';
import { generateDemoFlights } from '@/lib/demo';

const mockFlights = generateDemoFlights(DateTime.local());
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
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
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
jest.mock('@expo/vector-icons/Feather', () => {
  const F = () => null;
  F.font = {};
  return F;
});
jest.mock('react-native-worklets', () => ({ scheduleOnRN: jest.fn() }));

const { renderRouter } = require('expo-router/testing-library');
const mockReanimatedStub = () => {
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
};
jest.doMock('react-native-reanimated', mockReanimatedStub);
jest.doMock('react-native-worklets', () => ({ scheduleOnRN: jest.fn() }));
import { act } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({ useMigrations: () => ({ success: true }) }));
jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: async () => {},
  hideAsync: async () => {},
}));
jest.mock('expo-system-ui', () => ({ setBackgroundColorAsync: async () => {} }));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: jest.requireActual('react-native').View,
}));
jest.mock('@/components/AnimatedSplash', () => ({ AnimatedSplash: () => null }));
jest.mock('@/components/WorldMap', () => ({ WorldMap: () => null }));
jest.mock('@/components/PassportBook', () => ({ PassportBook: () => null }));
jest.mock('@/components/LoopTheLoop', () => ({ LoopTheLoop: () => null }));
jest.mock('expo-font', () => ({ useFonts: () => [true] }));

it('navigating the real app produces no duplicate keys', async () => {
  const errors: string[] = [];
  const spy = jest
    .spyOn(console, 'error')
    .mockImplementation((...a) => errors.push(a.map(String).join(' ')));
  renderRouter('./app', { initialUrl: '/' });
  await act(async () => {});
  for (const url of [
    '/flights',
    '/passport',
    '/share',
    `/flight/${mockFlights[2].id}`,
    '/story/map',
    '/story/flight',
    '/settings',
    '/add',
    '/add/manual',
    '/',
  ]) {
    await act(async () => router.push(url as never));
  }
  spy.mockRestore();
  const dup = errors.filter((e) => /same key|unique "key"|key prop/i.test(e));
  console.log(`errors: ${errors.length}\n` + errors.map((d) => d.slice(0, 700)).join('\n----\n'));
  expect(dup).toEqual([]);
});
