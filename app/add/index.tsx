import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Body, Display } from '@/components/Text';
import { Icon, type IconName } from '@/components/Icon';
import { Divider } from '@/components/Divider';
import { Button } from '@/components/Button';
import { scanScreenshot } from '@/scan/decode';
import { setPendingScan } from '@/state/scanStore';
import { saveScannedPass, savedMessage } from '@/scan/saveScan';
import { useToast } from '@/components/Toast';

function Option({
  icon,
  title,
  body,
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={body}
      onPress={onPress}
      style={({ pressed }) => [styles.option, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[styles.iconWrap, { borderColor: c.border }]}>
        <Icon name={icon} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Body variant="strong">{title}</Body>
        <Body variant="caption" muted>
          {body}
        </Body>
      </View>
      <Icon name="chevron-right" size={18} color={c.textMuted} />
    </Pressable>
  );
}

export default function AddSheet() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const toast = useToast();

  const fromScreenshot = async () => {
    setProblem(null);
    setBusy(true);
    const r = await scanScreenshot();
    if (r.kind === 'found') {
      try {
        const saved = await saveScannedPass(r.pass);
        if (saved.kind === 'review') {
          setPendingScan(r.pass);
          router.replace('/add/review');
        } else {
          toast(
            saved.kind === 'saved' ? savedMessage(saved) : 'That flight is already in your log',
          );
          router.dismissTo('/flights');
        }
      } catch (e) {
        setProblem(`Couldn’t save: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(false);
    if (r.kind === 'none') {
      setProblem(
        'Couldn’t find a boarding pass barcode. Try a sharper screenshot or enter it manually.',
      );
    } else if (r.kind === 'error') {
      setProblem(
        `Couldn’t read that image (${r.message}). Try another screenshot or enter it manually.`,
      );
    }
  };

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        accessibilityLabel="Close"
        accessibilityRole="button"
        onPress={() => router.back()}
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: c.surface, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.border }]} />
        <Display size="sm" accessibilityRole="header" style={{ marginBottom: space.sm }}>
          Add a Flight
        </Display>
        <Option
          icon="maximize"
          title="Scan Boarding Pass"
          body="Use the camera on a paper or on-screen pass"
          onPress={() => router.replace('/add/scan')}
        />
        <Divider />
        <Option
          icon="image"
          title="From Screenshot"
          body="Pick a boarding pass image from your photos"
          onPress={fromScreenshot}
        />
        <Divider />
        <Option
          icon="edit-3"
          title="Enter Manually"
          body="Type in the route and details"
          onPress={() => router.replace('/add/manual')}
        />
        {busy && (
          <ActivityIndicator
            color={c.text}
            style={{ marginTop: space.lg }}
            accessibilityLabel="Reading image"
          />
        )}
        {problem && (
          <View style={{ marginTop: space.lg, gap: space.md }} accessibilityLiveRegion="polite">
            <Body color={c.warning}>{problem}</Body>
            <Button label="Enter manually" onPress={() => router.replace('/add/manual')} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: space.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
    minHeight: 64,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
