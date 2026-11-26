import { act, render } from '@testing-library/react-native';
import { DateTime } from 'luxon';
import { DialogHost, showDialog } from '@/components/Dialog';
import { showExplainer } from '@/components/Explainer';
import { explainDays, explainEarth } from '@/lib/funFacts';
import { computeStats } from '@/lib/stats';
import { generateDemoFlights } from '@/lib/demo';
import { countries, getAirport } from '@/data/refdata';
import { showFlightActions } from '@/components/flightActions';
import { FunIllustration } from '@/components/FunIllustration';

jest.mock('@/db/repo', () => ({}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ settings: jest.requireActual('@/lib/settings').DEFAULT_SETTINGS }),
}));
jest.mock('@expo/vector-icons/Feather', () => {
  const F = () => null;
  F.font = {};
  return F;
});

it('dialogs render without key warnings', async () => {
  const errors: string[] = [];
  const spy = jest
    .spyOn(console, 'error')
    .mockImplementation((...a) => errors.push(a.map(String).join(' ')));
  const today = DateTime.local();
  const flights = generateDemoFlights(today);
  const stats = computeStats(flights, getAirport, countries, {}, today.toISODate()!);
  await render(<DialogHost />);
  await act(async () => {
    showExplainer(explainEarth(stats, 'km'), 'globe', <FunIllustration kind="earth" />);
    for (const k of ['moon', 'days', 'longest', 'night'] as const)
      showExplainer(
        explainEarth(stats, 'km'),
        'globe',
        <FunIllustration kind={k} progress={0.3} />,
      );
    showExplainer(explainDays(stats), 'sunrise');
    showFlightActions(flights[0]);
    showDialog({ title: 'x', buttons: [{ text: 'A' }, { text: 'B' }, { text: 'C' }] });
  });
  spy.mockRestore();
  expect(errors.filter((e) => /key/i.test(e))).toEqual([]);
});
