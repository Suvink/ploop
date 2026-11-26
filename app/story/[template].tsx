import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useFlights } from '@/hooks/useFlights';
import { useStats, useToday } from '@/hooks/useStats';
import { STORY_THEME_LABELS, STORY_THEME_ORDER, type StoryThemeName } from '@/theme/storyThemes';
import { storyThemes } from '@/theme/storyThemes';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { formatShortDate } from '@/lib/format';
import { Screen } from '@/components/Screen';
import { Body } from '@/components/Text';
import { Button } from '@/components/Button';
import { ChipRow } from '@/components/Chip';
import { Section } from '@/components/Section';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { isTemplate, ScaledStory, StoryRenderer, TEMPLATES } from '@/stories/StoryRenderer';
import { captureStory, saveToGallery, shareImage } from '@/stories/exportStory';
import type { StoryOptions } from '@/stories/common';

function ThemeSwatch({
  name,
  selected,
  onPress,
}: {
  name: StoryThemeName;
  selected: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const t = storyThemes[name];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${STORY_THEME_LABELS[name]} theme`}
      onPress={onPress}
      style={{ alignItems: 'center', gap: 6 }}
    >
      <View
        style={[
          styles.swatch,
          {
            backgroundColor: t.background,
            borderColor: selected ? c.selected : c.border,
            borderWidth: selected ? 3 : 1,
          },
        ]}
      >
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: t.accent }} />
      </View>
      <Body variant="caption" muted={!selected}>
        {STORY_THEME_LABELS[name]}
      </Body>
    </Pressable>
  );
}

export default function StoryScreen() {
  const params = useLocalSearchParams<{ template: string; flightId?: string }>();
  const template = isTemplate(params.template) ? params.template : 'passport';
  const { width } = useWindowDimensions();
  const { c } = useTheme();
  const toast = useToast();
  const { flights } = useFlights();
  const today = useToday();
  const { stats: allStats } = useStats(undefined);
  const canvasRef = useRef<ComponentRef<typeof View>>(null);
  const past = useMemo(
    () => [...flights].filter((f) => f.date <= today).reverse(),
    [flights, today],
  );
  const [opts, setOpts] = useState<StoryOptions>({
    theme: 'paper',
    hideExactDates: false,
    flightId: params.flightId ?? undefined,
  });
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const selectedFlightId = opts.flightId ?? past[0]?.id ?? flights[0]?.id;
  const effective: StoryOptions = { ...opts, flightId: selectedFlightId };
  const title = TEMPLATES.find((t) => t.name === template)?.title ?? 'Story';

  const run = async (kind: 'save' | 'share') => {
    setBusy(kind);
    try {
      const uri = await captureStory(canvasRef);
      if (kind === 'save') {
        const r = await saveToGallery(uri);
        toast(r === 'saved' ? 'Saved to Photos' : 'Allow photo access to save stories');
      } else {
        await shareImage(uri);
      }
    } catch (e) {
      toast(
        `Couldn’t ${kind === 'save' ? 'save' : 'share'}: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setBusy(null);
    }
  };

  if (flights.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
        <EmptyState
          title="Nothing to share yet"
          body="Add a flight first, then come back to make a story."
        />
      </Screen>
    );
  }

  const previewWidth = Math.min(width - space.xl * 2, 320);
  const yearOptions = [
    { value: 0, label: 'All time' },
    ...allStats.years.map((y) => ({ value: y, label: String(y) })),
  ];

  return (
    <Screen>
      <Stack.Screen options={{ title: `${title} Story` }} />
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.preview, { borderColor: c.border }]}>
          <ScaledStory width={previewWidth}>
            <StoryRenderer template={template} options={effective} canvasRef={canvasRef} />
          </ScaledStory>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Save"
          icon="download"
          onPress={() => run('save')}
          loading={busy === 'save'}
          disabled={!!busy}
          style={{ flex: 1 }}
        />
        <Button
          label="Share"
          icon="share-2"
          variant="primary"
          onPress={() => run('share')}
          loading={busy === 'share'}
          disabled={!!busy}
          style={{ flex: 1 }}
        />
      </View>

      {template === 'flight' && (
        <Section title="Flight">
          <FlatList
            horizontal
            data={past.length ? past : flights}
            keyExtractor={(f) => f.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.sm }}
            renderItem={({ item }) => {
              const sel = item.id === selectedFlightId;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sel }}
                  accessibilityLabel={`${item.fromIata} to ${item.toIata}, ${formatShortDate(item.date)}`}
                  onPress={() => setOpts((o) => ({ ...o, flightId: item.id }))}
                  style={[
                    styles.flightChip,
                    {
                      borderColor: sel ? c.selected : c.border,
                      backgroundColor: sel ? c.selected : 'transparent',
                    },
                  ]}
                >
                  <Body variant="strong" color={sel ? c.onSelected : c.text}>
                    {item.fromIata} → {item.toIata}
                  </Body>
                  <Body variant="caption" color={sel ? c.onSelected : c.textMuted}>
                    {formatShortDate(item.date)} {item.date.slice(0, 4)}
                  </Body>
                </Pressable>
              );
            }}
          />
        </Section>
      )}

      {template !== 'flight' && (
        <Section title="Year">
          <ChipRow
            options={yearOptions}
            value={opts.year ?? 0}
            onChange={(y) => setOpts((o) => ({ ...o, year: y === 0 ? undefined : y }))}
          />
        </Section>
      )}

      <Section title="Theme">
        <View accessibilityRole="radiogroup" style={styles.themes}>
          {STORY_THEME_ORDER.map((t) => (
            <ThemeSwatch
              key={t}
              name={t}
              selected={opts.theme === t}
              onPress={() => setOpts((o) => ({ ...o, theme: t }))}
            />
          ))}
        </View>
      </Section>

      <View style={styles.toggle}>
        <View style={{ flex: 1 }}>
          <Body variant="label">Hide exact dates</Body>
          <Body variant="caption" muted>
            Shows month and year only
          </Body>
        </View>
        <Switch
          accessibilityLabel="Hide exact dates"
          value={opts.hideExactDates}
          onValueChange={(b) => setOpts((o) => ({ ...o, hideExactDates: b }))}
          trackColor={{ true: c.primary, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  themes: { flexDirection: 'row', gap: space.xl },
  swatch: {
    width: 64,
    height: 96,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightChip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', marginTop: space.section, gap: space.lg },
});
