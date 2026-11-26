import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { insertFlights } from '@/db/repo';
import { duplicateAsReturn, emptyForm } from '@/lib/flightForm';
import { useFlights } from '@/hooks/useFlights';
import { Screen } from '@/components/Screen';
import { FlightForm } from '@/components/FlightForm';
import { useToast } from '@/components/Toast';

export default function ManualScreen() {
  const { returnOf } = useLocalSearchParams<{ returnOf?: string }>();
  const { flights, loaded } = useFlights();
  const toast = useToast();
  const initial = useMemo(() => {
    const src = returnOf ? flights.find((f) => f.id === returnOf) : undefined;
    return src ? duplicateAsReturn(src) : emptyForm('');
  }, [returnOf, flights]);

  if (returnOf && !loaded) return <Screen>{null}</Screen>;

  return (
    <Screen>
      <FlightForm
        key={returnOf ?? 'new'}
        initial={initial}
        submitLabel="Save flight"
        onSubmit={async (fields) => {
          await insertFlights([fields], 'manual');
          toast('Flight saved');
          router.back();
        }}
      />
    </Screen>
  );
}
