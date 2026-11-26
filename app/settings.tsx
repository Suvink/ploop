import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { DateTime } from 'luxon';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { getAirport } from '@/data/refdata';
import { exportJson, importJson, pickBackupText } from '@/db/backupIo';
import { applyImport, getAllFlights } from '@/db/repo';
import { BackupFormatError } from '@/lib/backup';
import { generateDemoFlights } from '@/lib/demo';
import type { ThemePref } from '@/lib/settings';
import { appVersion } from '@/lib/version';
import { TAGLINE } from '@/lib/brand';
import { Screen } from '@/components/Screen';
import { Body, Display } from '@/components/Text';
import { Segmented } from '@/components/Segmented';
import { Section } from '@/components/Section';
import { Divider } from '@/components/Divider';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { AirportPicker } from '@/components/AirportPicker';
import { useToast } from '@/components/Toast';
import { showDialog } from '@/components/Dialog';

function Row({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `: ${value}` : ''}`}
        onPress={onPress}
        style={styles.row}
      >
        <Body style={{ flex: 1 }}>{label}</Body>
        {value ? <Body muted>{value}</Body> : null}
        <Icon name="chevron-right" size={18} color={c.textMuted} />
      </Pressable>
      <Divider />
    </>
  );
}

function PloopPreview() {
  const { c } = useTheme();
  return (
    <View
      style={[styles.preview, { borderColor: c.border }]}
      accessibilityLabel="Display font preview"
    >
      <Display size="md" bold>
        168,240 km
      </Display>
      <Display size="sm" muted>
        CMB → DXB
      </Display>
    </View>
  );
}

export default function SettingsScreen() {
  const { c } = useTheme();
  const toast = useToast();
  const { settings, update } = useSettings();
  const [pickHome, setPickHome] = useState(false);
  const [name, setName] = useState(settings.passportName);
  const [busy, setBusy] = useState<string | null>(null);
  const home = settings.homeAirport ? getAirport(settings.homeAirport) : undefined;

  const doExport = async () => {
    setBusy('export');
    try {
      await exportJson();
    } catch (e) {
      toast(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const doImport = async (mode: 'merge' | 'replace') => {
    let text: string | null;
    try {
      text = await pickBackupText();
    } catch (e) {
      toast(`Couldn’t open the file: ${String(e)}`);
      return;
    }
    if (!text) return;
    setBusy('import');
    try {
      const r = await importJson(text, mode);
      const lines = [`Added: ${r.added}`, `Updated: ${r.updated}`, `Skipped: ${r.skipped}`];
      if (r.errors.length) lines.push(`Errors: ${r.errors.length}`, ...r.errors.slice(0, 5));
      showDialog({ icon: 'check-circle', title: 'Import complete', message: lines.join('\n') });
    } catch (e) {
      showDialog({
        icon: 'alert-triangle',
        title: 'Import failed',
        message: e instanceof BackupFormatError ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  const chooseImport = () =>
    showDialog({
      icon: 'download',
      title: 'Import backup',
      message:
        'Merge keeps your current flights and adds or updates from the file. Replace deletes your current flights first.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: () => doImport('replace') },
        { text: 'Merge', style: 'primary', onPress: () => doImport('merge') },
      ],
    });

  return (
    <Screen>
      <Section title="Appearance">
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Body variant="strong">Ploop mode</Body>
            <Body variant="caption" muted>
              Rounder, bubblier titles and numbers everywhere: in the app, your passport and your
              stories.
            </Body>
          </View>
          <Switch
            accessibilityLabel="Ploop mode"
            value={settings.ploopMode}
            onValueChange={(b) => {
              update('ploopMode', b).catch((e) => toast(`Couldn’t save: ${String(e)}`));
              toast(b ? 'Ploop mode on: hello, bubbly titles!' : 'Ploop mode off');
            }}
            trackColor={{ true: c.primary, false: c.border }}
            thumbColor={c.surface}
          />
        </View>
        <PloopPreview />
        <View style={{ marginTop: space.lg }}>
          <Segmented<ThemePref>
            accessibilityLabel="Theme"
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={settings.theme}
            onChange={(t) => update('theme', t)}
          />
        </View>
      </Section>

      <Section title="Passport">
        <Divider />
        <Row
          label="Home airport"
          value={home ? `${home.iata} · ${home.city}` : (settings.homeAirport ?? 'Not set')}
          onPress={() => setPickHome(true)}
        />
        <View style={styles.row}>
          <Body style={{ flex: 1 }}>Name on passport</Body>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              update('passportName', t.trim());
            }}
            placeholder="Optional"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Name on passport"
            maxLength={40}
            style={[styles.inlineInput, { color: c.text }]}
          />
        </View>
        <Divider />
        <View style={[styles.row, { gap: space.lg }]}>
          <Body style={{ flex: 1 }}>Distance unit</Body>
          <View style={{ width: 160 }}>
            <Segmented
              accessibilityLabel="Distance unit"
              options={[
                { value: 'km', label: 'km' },
                { value: 'mi', label: 'mi' },
              ]}
              value={settings.distanceUnit}
              onChange={(u) => update('distanceUnit', u)}
            />
          </View>
        </View>
        <Divider />
      </Section>

      <Section title="Your data">
        <Body variant="caption" muted style={{ marginBottom: space.md }}>
          Ploop has no account and never goes online. Your flights live only on this phone — export
          a backup now and then.
        </Body>
        <View style={{ gap: space.md }}>
          <Button
            label="Export backup (JSON)"
            icon="upload"
            onPress={doExport}
            loading={busy === 'export'}
          />
          <Button
            label="Import backup"
            icon="download"
            onPress={chooseImport}
            loading={busy === 'import'}
          />
          {__DEV__ && (
            <Button
              label="Load demo data (dev)"
              variant="ghost"
              onPress={async () => {
                const have = new Set((await getAllFlights()).map((f) => f.id));
                const demo = generateDemoFlights(DateTime.local()).filter((f) => !have.has(f.id));
                await applyImport(demo, [], 'merge', {});
                toast('Demo flights added');
              }}
            />
          )}
        </View>
      </Section>

      <Section title="About">
        <Body variant="strong">Ploop</Body>
        <Body muted style={{ fontStyle: 'italic' }}>
          {TAGLINE}
        </Body>
        <Body muted>Version {appVersion()}</Body>
        <Body variant="caption" muted style={{ marginTop: space.sm }}>
          Airport data: OurAirports (public domain). Airline data: OpenFlights, under the Open
          Database License (ODbL). Map outlines: Natural Earth (public domain) via world-atlas. Time
          zones from geo-tz. Fonts: Plus Jakarta Sans, Inter and Fredoka, under the SIL Open Font
          License 1.1. Icons: Feather (MIT).
        </Body>
        <View style={{ marginTop: space.lg }}>
          <Divider />
          <Row
            label="Privacy Policy"
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })}
          />
          <Row
            label="Terms and Conditions"
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })}
          />
        </View>
      </Section>

      <AirportPicker
        visible={pickHome}
        title="Home airport"
        onClose={() => setPickHome(false)}
        onSelect={(iata) => update('homeAirport', iata)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: space.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  preview: {
    marginTop: space.lg,
    padding: space.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    gap: 4,
  },
  inlineInput: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 48,
  },
});
