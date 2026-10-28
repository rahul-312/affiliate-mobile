import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Decor, LuxErrorBanner, LuxField, LuxNote, palette, serif } from '@/components/lux';
import { spacing } from '@/components/theme';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';

const RESET_HELP = 'Contact the program team from the email you signed up with and they will reset it for you.';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  // State updates land a render later, so two taps in one frame would both see busy=false.
  const inFlight = useRef(false);

  // Best effort: re-hide a shown password when the app backgrounds. The OS may snapshot the
  // app switcher before this re-render is drawn, so it is not a guarantee.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setShowPassword(false);
    });
    return () => sub.remove();
  }, []);

  const submit = async () => {
    if (inFlight.current) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    inFlight.current = true;
    setShowPassword(false);
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error && !('status' in err) ? err.message : errorMessage(err));
      setBusy(false);
      inFlight.current = false;
    }
  };

  const toggleResetHelp = () => {
    const next = !showResetHelp;
    setShowResetHelp(next);
    if (next) AccessibilityInfo.announceForAccessibility(RESET_HELP);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  return (
    // Decor sits outside the safe area so the shapes run to the screen edges.
    <View style={styles.root}>
      <Decor />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} hitSlop={12} style={styles.back}>
              <Ionicons name="chevron-back" size={24} color={palette.ink} />
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowRule} />
                <Text style={styles.eyebrow}>WELCOME</Text>
              </View>
              <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
                Sign in
              </Text>
              <Text style={styles.subtitle}>Continue to your account</Text>
            </View>

            {error ? <LuxErrorBanner>{error}</LuxErrorBanner> : null}

            <LuxField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={styles.passwordBlock}>
              <LuxField
                ref={passwordRef}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                // The OS only suppresses these while the text is hidden; keep them off when it's shown.
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={submit}
                trailing={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={12}
                  >
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={palette.ink} />
                  </Pressable>
                }
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showResetHelp }}
                onPress={toggleResetHelp}
                hitSlop={8}
                style={[styles.forgot, styles.link]}
              >
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
              {/* No self-serve reset endpoint yet; inline help works on web too, unlike Alert. */}
              {showResetHelp ? <LuxNote>{RESET_HELP}</LuxNote> : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: busy, busy }}
              onPress={submit}
              disabled={busy}
              style={({ pressed }) => [styles.cta, (pressed || busy) && { opacity: busy ? 0.7 : 0.88 }]}
            >
              {busy ? (
                <ActivityIndicator color={palette.onInk} />
              ) : (
                <>
                  <Text style={styles.ctaText}>SIGN IN</Text>
                  <Ionicons name="arrow-forward" size={18} color={palette.onInk} />
                </>
              )}
            </Pressable>

            <View style={styles.orRow}>
              <View style={styles.orRule} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orRule} />
            </View>

            <Pressable accessibilityRole="link" onPress={() => router.replace('/signup')} style={styles.joinRow} hitSlop={8}>
              <Text style={styles.joinText}>New here?</Text>
              <View style={styles.link}>
                <Text style={styles.linkText}>Apply to join</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={palette.ink} />
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 140, gap: spacing.xl },
  back: { alignSelf: 'flex-start', marginLeft: -spacing.sm, marginBottom: spacing.lg },

  hero: { gap: spacing.sm, marginBottom: spacing.xl },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eyebrowRule: { width: 28, height: 1, backgroundColor: palette.inkMuted },
  eyebrow: { fontSize: 11, letterSpacing: 3, color: palette.inkMuted },
  title: { fontFamily: serif, fontSize: 54, lineHeight: 62, color: palette.ink, letterSpacing: -0.5 },
  subtitle: { fontFamily: serif, fontSize: 17, color: palette.inkMuted },

  passwordBlock: { gap: spacing.md },
  forgot: { alignSelf: 'flex-end' },
  // A border instead of textDecorationLine: native underlines cut through descenders like g and p.
  link: { borderBottomWidth: 1, borderBottomColor: palette.ink, paddingBottom: 3 },
  linkText: { fontSize: 14, color: palette.ink },

  cta: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  ctaText: { color: palette.onInk, fontSize: 13, fontWeight: '600', letterSpacing: 3 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  orRule: { flex: 1, height: 1, backgroundColor: palette.rule },
  orText: { fontSize: 12, letterSpacing: 3, color: palette.inkMuted },

  joinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  joinText: { fontSize: 14, color: palette.ink },
});
