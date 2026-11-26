import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import privacy from '../../docs/privacy-policy.md';
import terms from '../../docs/terms.md';
import { parseMarkdown, type Inline } from '@/legal/markdown';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { Body, Display } from '@/components/Text';
import { Divider } from '@/components/Divider';

const DOCS = {
  privacy: { title: 'Privacy Policy', md: privacy },
  terms: { title: 'Terms and Conditions', md: terms },
} as const;

function Rich({ parts, muted }: { parts: Inline[]; muted?: boolean }) {
  return (
    <Body muted={muted}>
      {parts.map((p, i) =>
        p.bold ? (
          <Body key={i} variant="strong">
            {p.text}
          </Body>
        ) : (
          p.text
        ),
      )}
    </Body>
  );
}

/** Bundled privacy policy and terms, readable offline (same text as docs/ in the repo). */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { c } = useTheme();
  const entry = doc === 'terms' ? DOCS.terms : DOCS.privacy;
  const blocks = useMemo(() => parseMarkdown(entry.md), [entry.md]);

  return (
    <Screen>
      <Stack.Screen options={{ title: entry.title }} />
      {blocks.map((b, i) => {
        const key = `${b.kind}-${i}`;
        switch (b.kind) {
          case 'h1':
            return null; // shown as the screen title
          case 'h2':
            return (
              <Display key={key} size="sm" style={{ marginTop: space.xl, marginBottom: space.sm }}>
                {b.text}
              </Display>
            );
          case 'li':
            return (
              <View key={key} style={styles.li}>
                <Body color={c.accentText}>•</Body>
                <View style={{ flex: 1 }}>
                  <Rich parts={b.parts} />
                </View>
              </View>
            );
          case 'row':
            // Header row of the permissions table is skipped; the rest read as label / reason.
            if (b.cells[0]?.[0]?.text === 'Permission') return null;
            return (
              <View key={key}>
                <View style={styles.row}>
                  <Body variant="strong" style={{ width: '38%' }}>
                    {b.cells[0]?.map((p) => p.text).join('')}
                  </Body>
                  <View style={{ flex: 1 }}>
                    <Rich parts={b.cells[1] ?? []} muted />
                  </View>
                </View>
                <Divider />
              </View>
            );
          default:
            return (
              <View key={key} style={{ marginBottom: space.md }}>
                <Rich parts={b.parts} />
              </View>
            );
        }
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  li: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
});
