import { fireEvent, render, screen } from '@testing-library/react-native';
import { Segmented } from '@/components/Segmented';
import { Stamp } from '@/components/Stamp';
import { FlightRow } from '@/components/FlightRow';
import { DEFAULT_SETTINGS } from '@/lib/settings';

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

describe('components', () => {
  it('Segmented selects an option', async () => {
    const onChange = jest.fn();
    await render(
      <Segmented
        accessibilityLabel="Cabin"
        options={[
          { value: 'economy', label: 'Economy' },
          { value: 'business', label: 'Business' },
        ]}
        value="economy"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Economy' }).props.accessibilityState.checked).toBe(
      true,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Business' }));
    expect(onChange).toHaveBeenCalledWith('business');
  });

  it('Stamp has a readable label', async () => {
    await render(<Stamp code="LK" firstDate="2023-03-01" />);
    expect(screen.getByLabelText('Sri Lanka, first visited 1 Mar 2023')).toBeTruthy();
  });

  it('Stamp hides exact dates when asked', async () => {
    await render(<Stamp code="AE" firstDate="2023-03-01" hideExactDates />);
    expect(screen.getByLabelText('United Arab Emirates, first visited Mar 2023')).toBeTruthy();
  });

  it('FlightRow shows the route, cities and distance', async () => {
    const onPress = jest.fn();
    await render(
      <FlightRow
        flight={{
          id: '1',
          date: '2025-03-01',
          fromIata: 'CMB',
          toIata: 'DXB',
          airlineIata: 'UL',
          flightNumber: '225',
          depLocal: null,
          arrLocal: null,
          arrDayOffset: null,
          durationMin: null,
          seat: null,
          cabin: null,
          aircraftType: null,
          registration: null,
          notes: null,
          yearUnknown: false,
          source: 'manual',
          createdAt: '',
          updatedAt: '',
        }}
        onPress={onPress}
      />,
    );
    expect(screen.getByText('CMB')).toBeTruthy();
    expect(screen.getByText('DXB')).toBeTruthy();
    expect(screen.getByText(/UL 225/)).toBeTruthy();
    expect(screen.getByText(/3,2\d\d km/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
    expect(DEFAULT_SETTINGS.distanceUnit).toBe('km');
  });
});
