import { useCallback, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firstBoardingPass } from '@/lib/scan';
import { setPendingScan } from '@/state/scanStore';
import { saveScannedPass, savedMessage } from '@/scan/saveScan';
import { BARCODE_TYPES, barcodeStrings, describeBarcode } from '@/scan/decode';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Body, Display } from '@/components/Text';
import { Button, IconButton } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';

const OVERLAY_TEXT = '#FFFFFF';

function PermissionGate({ onRequest, denied }: { onRequest: () => void; denied: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.gate, { backgroundColor: c.background, paddingTop: insets.top + space.xl }]}
    >
      <IconButton icon="x" label="Close" onPress={() => router.back()} />
      <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
        <Display size="lg">Scan your boarding pass</Display>
        <Body muted>
          Ploop needs the camera to read the barcode on your pass. Scanning happens on your phone —
          no image is saved, and nothing is sent anywhere. Your name and booking reference are never
          stored.
        </Body>
        {denied ? (
          <>
            <Body color={c.warning}>Camera access is turned off for Ploop.</Body>
            <Button
              label="Open settings"
              variant="primary"
              icon="settings"
              onPress={() => Linking.openSettings()}
            />
          </>
        ) : (
          <Button label="Allow camera" variant="primary" icon="camera" onPress={onRequest} />
        )}
        <Button
          label="Enter manually instead"
          variant="ghost"
          onPress={() => router.replace('/add/manual')}
        />
      </View>
    </View>
  );
}

export default function ScanScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [active, setActive] = useState(true);
  const handled = useRef(false);
  const lastRejected = useRef<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      handled.current = false;
      setCaptured(null);
      setActive(true);
      return () => setActive(false);
    }, []),
  );

  const onScanned = useCallback(
    (r: BarcodeScanningResult) => {
      if (handled.current) return;
      const pass = firstBoardingPass(barcodeStrings(r));
      if (!pass) {
        if (__DEV__) console.log('[scan] camera rejected', describeBarcode(r));
        if (lastRejected.current !== r.data) {
          lastRejected.current = r.data;
          toast('That code isn’t a boarding pass');
        }
        return;
      }
      handled.current = true;
      setActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCaptured(pass.legs.map((l) => `${l.from} → ${l.to}`).join('  ·  '));
      const started = Date.now();
      saveScannedPass(pass)
        .then(async (r) => {
          // Let the "got it" confirmation show for a moment before leaving the camera.
          await new Promise((res) => setTimeout(res, Math.max(0, 900 - (Date.now() - started))));
          if (r.kind === 'review') {
            setPendingScan(pass);
            router.replace('/add/review');
            return;
          }
          toast(r.kind === 'saved' ? savedMessage(r) : 'That flight is already in your log');
          router.dismissTo('/flights');
        })
        .catch((e) => {
          toast(`Couldn’t save: ${e instanceof Error ? e.message : String(e)}`);
          setPendingScan(pass);
          router.replace('/add/review');
        });
    },
    [toast],
  );

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  if (!permission.granted) {
    return (
      <PermissionGate denied={!permission.canAskAgain} onRequest={() => requestPermission()} />
    );
  }

  return (
    <View style={styles.root}>
      {active && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
          onBarcodeScanned={onScanned}
        />
      )}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <IconButton
          icon="x"
          label="Close scanner"
          color={OVERLAY_TEXT}
          onPress={() => router.back()}
        />
        <IconButton
          icon={torch ? 'zap-off' : 'zap'}
          label={torch ? 'Turn torch off' : 'Turn torch on'}
          color={OVERLAY_TEXT}
          onPress={() => setTorch((t) => !t)}
        />
      </View>
      <View style={styles.center} pointerEvents="none">
        <View style={[styles.frame, captured ? { borderColor: c.success } : null]} />
        {captured ? (
          <View
            style={[styles.got, { backgroundColor: c.success }]}
            accessibilityLiveRegion="polite"
          >
            <Icon name="check" size={20} color={OVERLAY_TEXT} />
            <Body variant="strong" color={OVERLAY_TEXT}>
              Got it · {captured}
            </Body>
          </View>
        ) : (
          <Body color={OVERLAY_TEXT} style={styles.hint}>
            Fit the barcode inside the frame
          </Body>
        )}
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.xl }]}>
        <Button
          label="Enter manually"
          variant="ghost"
          color={OVERLAY_TEXT}
          onPress={() => router.replace('/add/manual')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  gate: { flex: 1, paddingHorizontal: space.xl },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
  },
  frame: {
    width: '82%',
    aspectRatio: 1.6,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  got: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
  },
  hint: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
});
