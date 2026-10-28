import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { palette } from '@/components/lux';
import { colors } from '@/components/theme';
import { SessionProvider, useSession } from '@/lib/session';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  );
}

/** Signed-in stack screens draw their own serif title, so the header keeps only the back control. */
const luxHeader = {
  headerTitle: '',
  headerTintColor: palette.ink,
  headerStyle: { backgroundColor: palette.bg },
  headerShadowVisible: false,
  // iOS would otherwise label the back button with the previous route's name, "(tabs)".
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: palette.bg },
};

/**
 * Two protected areas: the public pitch and sign-in screens, and the signed-in
 * app. Guards are a navigation convenience only; the API authorises every call.
 */
function RootNavigator() {
  const { user, isLoading } = useSession();
  const signedIn = Boolean(user);

  useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerTintColor: colors.primary, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="payout-details" options={{ headerShown: false, contentStyle: { backgroundColor: palette.bg }, title: 'Payout details', presentation: 'modal' }} />
        <Stack.Screen name="how-it-works" options={{ ...luxHeader, title: 'How it works' }} />
      </Stack.Protected>
    </Stack>
  );
}
