import { useMemo } from 'react';
import { View } from 'react-native';
import { useFlights } from '@/hooks/useFlights';
import { useSettings } from '@/hooks/useSettings';
import { useStats, useToday } from '@/hooks/useStats';
import { buildMapData } from '@/lib/mapData';
import { getAirport } from '@/data/refdata';
import { storyThemes } from '@/theme/storyThemes';
import { canvasDp, type CanvasRef, type StoryOptions } from './common';
import { PassportStory } from './PassportStory';
import { MapStory } from './MapStory';
import { FlightStory } from './FlightStory';

export type TemplateName = 'passport' | 'map' | 'flight';
export const TEMPLATES: { name: TemplateName; title: string; body: string }[] = [
  {
    name: 'passport',
    title: 'Passport',
    body: 'Your miles, stamps and favourite airlines in one bold card',
  },
  { name: 'map', title: 'Map', body: 'Every route you’ve flown, drawn across the globe' },
  { name: 'flight', title: 'Flight', body: 'A boarding-pass card to show off your latest trip' },
];

export function isTemplate(t: string | undefined): t is TemplateName {
  return t === 'passport' || t === 'map' || t === 'flight';
}

export function StoryRenderer({
  template,
  options,
  canvasRef,
}: {
  template: TemplateName;
  options: StoryOptions;
  canvasRef?: CanvasRef;
}) {
  const { settings } = useSettings();
  const { flights } = useFlights();
  const today = useToday();
  const { stats } = useStats(options.year);
  const theme = storyThemes[options.theme];
  const map = useMemo(
    () => buildMapData(flights, getAirport, { year: options.year }, today),
    [flights, options.year, today],
  );

  if (template === 'passport')
    return (
      <PassportStory
        ref={canvasRef}
        stats={stats}
        settings={settings}
        theme={theme}
        options={options}
      />
    );
  if (template === 'map')
    return (
      <MapStory
        ref={canvasRef}
        stats={stats}
        map={map}
        settings={settings}
        theme={theme}
        options={options}
      />
    );
  const flight =
    (options.flightId
      ? flights.find((f) => f.id === options.flightId)
      : [...flights].reverse().find((f) => f.date <= today)) ?? null;
  return (
    <FlightStory
      ref={canvasRef}
      flight={flight}
      settings={settings}
      theme={theme}
      options={options}
    />
  );
}

/** Renders the full-size canvas scaled down to `width` for previews. */
export function ScaledStory({ width, children }: { width: number; children: React.ReactNode }) {
  const { w, h } = canvasDp();
  const scale = width / w;
  const height = h * scale;
  return (
    <View style={{ width, height, overflow: 'hidden' }} pointerEvents="none">
      <View
        style={{
          width: w,
          height: h,
          transform: [{ translateX: (width - w) / 2 }, { translateY: (height - h) / 2 }, { scale }],
        }}
      >
        {children}
      </View>
    </View>
  );
}
