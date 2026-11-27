import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { SettingsProvider, useSettings } from '@/hooks/useSettings';
import { getAllFlights } from '@/db/repo';
import { initialMemberSince } from '@/lib/settings';
import { DateTime } from 'luxon';
import { ThemeProvider, useDisplayFont, useTheme } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { iconFont } from '@/components/Icon';
import { palette } from '@/theme/colors';
import { Body } from '@/components/Text';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { DialogHost } from '@/components/Dialog';
import { startAds } from '@/ads/adCache';

SplashScreen.preventAutoHideAsync().catch(() => {});

const APP_FONTS = {
  'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  'Fredoka-SemiBold': require('../assets/fonts/Fredoka-SemiBold.ttf'),
};

function AppStack({ onReady }: { onReady: () => void }) {
  const { c, scheme } = useTheme();
  const display = useDisplayFont();
  const { loaded, settings, update } = useSettings();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.background).catch(() => {});
  }, [c.background]);
  useEffect(() => {
    if (!loaded) return;
    onReady();
    // After the splash, so Google's consent form (where required) shows over the app.
    startAds();
  }, [loaded, onReady]);

  // Remember the first launch for "Member since" on the passport.
  useEffect(() => {
    if (!loaded || settings.memberSince) return;
    getAllFlights()
      .then((fs) =>
        update(
          'memberSince',
          initialMemberSince(
            DateTime.local().toISODate()!,
            fs.map((f) => f.createdAt),
          ),
        ),
      )
      .catch(() => {});
  }, [loaded, settings.memberSince, update]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.text,
          headerTitleStyle: { fontFamily: display.semibold, fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add/index"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="add/scan" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="add/review" options={{ title: 'Review Flights' }} />
        <Stack.Screen name="add/manual" options={{ title: 'Add Flight' }} />
        <Stack.Screen name="flight/[id]" options={{ title: '' }} />
        <Stack.Screen name="story/[template]" options={{ title: 'Story' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="legal/[doc]" options={{ title: '' }} />
      </Stack>
    </>
  );
}

function MigrationGate({ children, onError }: { children: React.ReactNode; onError: () => void }) {
  const { success, error } = useMigrations(db, migrations);
  useEffect(() => {
    if (error) onError();
  }, [error, onError]);
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#13162B',
        }}
      >
        <Body color="#ECE6DC">Couldn’t open your flight log: {error.message}</Body>
      </View>
    );
  }
  if (!success) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  // Fonts are embedded natively by the expo-font config plugin, and also registered here at runtime
  // under the same family names. Belt and braces: if the native copy isn't picked up, the display
  // fonts (and so Ploop mode) would silently fall back to the system font.
  const [fontsLoaded] = useFonts({ ...iconFont, ...APP_FONTS });
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  // The animated preloader starts exactly like the native splash, so swap them as soon as it's drawn.
  const hideNative = useCallback(() => SplashScreen.hideAsync().catch(() => {}), []);
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.navy }}>
      <MigrationGate onError={markReady}>
        <SettingsProvider>
          <ThemeProvider>
            <ToastProvider>
              <AppStack onReady={markReady} />
              <DialogHost />
            </ToastProvider>
          </ThemeProvider>
        </SettingsProvider>
      </MigrationGate>
      <AnimatedSplash ready={ready} onLayout={hideNative} />
    </GestureHandlerRootView>
  );
}
