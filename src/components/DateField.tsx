import { Platform } from 'react-native';
import { useState } from 'react';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import { formatDate, formatDayMonth } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { PickerField } from './Field';

export function DateField({
  label,
  value,
  onChange,
  error,
  yearUnknown,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  /** The day and month are known but the year isn't: show it empty and ask for it. */
  yearUnknown?: boolean;
}) {
  const { c } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const current = value ? DateTime.fromISO(value) : DateTime.local();
  const date = (current.isValid ? current : DateTime.local()).toJSDate();
  const set = (d?: Date) => {
    if (d) onChange(DateTime.fromJSDate(d).toISODate()!);
  };
  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (e, d) => e.type === 'set' && set(d),
      });
    } else setIosOpen((o) => !o);
  };
  return (
    <>
      <PickerField
        label={label}
        value={value ? (yearUnknown ? `${formatDayMonth(value)}, year?` : formatDate(value)) : ''}
        placeholder="Choose date"
        onPress={open}
        error={error}
        hint={
          yearUnknown
            ? 'The boarding pass doesn’t include the year. Tap to pick the full date.'
            : undefined
        }
        hintColor={c.warning}
      />
      {iosOpen && Platform.OS === 'ios' && (
        <DateTimePicker value={date} mode="date" display="inline" onChange={(_, d) => set(d)} />
      )}
    </>
  );
}
