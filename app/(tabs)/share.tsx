import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useFlights } from '@/hooks/useFlights';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { Body, Display } from '@/components/Text';
import { Divider } from '@/components/Divider';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import { TEMPLATES } from '@/stories/StoryRenderer';
import { TemplatePreview } from '@/stories/TemplatePreview';
import { useToday } from '@/hooks/useStats';
import { AdSlot } from '@/ads/AdSlot';

export default function ShareScreen() {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { flights, loaded } = useFlights();
  const thumb = Math.min(110, Math.round((width - space.xl * 2) * 0.3));
  const today = useToday();
  const latest = [...flights].reverse().find((f) => f.date <= today) ?? flights[flights.length - 1];

  return (
    <Screen top tab>
      <Display size="lg" accessibilityRole="header">
        Share
      </Display>
      <Body muted style={{ marginTop: space.xs, marginBottom: space.xl }}>
        Your travels, ready for the spotlight. Turn every mile into a story worth posting.
      </Body>
      {loaded && flights.length === 0 ? (
        <EmptyState
          title="Nothing to share yet"
          body="Add a flight and your stories will appear here."
          action="Add a flight"
          onAction={() => router.push('/add')}
        />
      ) : (
        <View>
          <Divider />
          {TEMPLATES.map((t) => (
            <View key={t.name}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t.title} story. ${t.body}`}
                onPress={() =>
                  router.push({ pathname: '/story/[template]', params: { template: t.name } })
                }
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <View style={[styles.thumb, { borderColor: c.border }]}>
                  <TemplatePreview
                    template={t.name}
                    theme={t.name === 'map' ? 'midnight' : t.name === 'flight' ? 'sunset' : 'paper'}
                    width={thumb}
                    route={latest ? [latest.fromIata, latest.toIata] : undefined}
                    flights={flights.length}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Display size="sm">{t.title}</Display>
                  <Body muted>{t.body}</Body>
                </View>
                <Icon name="chevron-right" color={c.textMuted} />
              </Pressable>
              <Divider />
            </View>
          ))}
        </View>
      )}
      <AdSlot style={{ marginTop: space.section }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg },
  thumb: { borderWidth: 1, borderRadius: radius.sm, overflow: 'hidden' },
});
