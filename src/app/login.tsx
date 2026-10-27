import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner } from '@/components/ui';
import { spacing } from '@/components/theme';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';

/** Warm, editorial palette local to this screen; the rest of the app keeps the shared theme. */
const palette = {
  bg: '#f6f2ed',
  ink: '#161412',
  inkMuted: '#6f6860',
  inputBg: '#efe9e2',
  inputBorder: '#e5ddd3',
  rule: '#d9d1c7',
  sand1: '#ece2d5',
  sand2: '#e0d2bf',
  sand3: '#d3c1a8',
  shadow: '#d8cfc4',
};

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error && !('status' in err) ? err.message : errorMessage(err));
      setBusy(false);
    }
  };

  // There is no self-serve reset endpoint yet, so point people at support rather than faking one.
  const forgotPassword = () =>
    Alert.alert('Forgot password?', 'Contact the program team from the email you signed up with and they will reset it for you.');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Decor />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowRule} />
              <Text style={styles.eyebrow}>WELCOME</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              Sign in
            </Text>
            <Text style={styles.subtitle}>Continue to your account</Text>
          </View>

          {error ? <Banner tone="danger">{error}</Banner> : null}

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
          />

          <View style={styles.passwordBlock}>
            <LuxField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
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
            <Pressable accessibilityRole="link" onPress={forgotPassword} hitSlop={8} style={[styles.forgot, styles.link]}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
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
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaText}>SIGN IN</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  );
}

function LuxField({ label, trailing, ...input }: TextInputProps & { label: string; trailing?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={palette.inkMuted}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
        />
        {trailing}
      </View>
    </View>
  );
}

/** Stone and sand shapes standing in for photography; purely decorative and behind the form. */
function Decor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants">
      {/* leaf-shadow streaks, top right */}
      <View style={[styles.streak, { top: -40, right: 40, transform: [{ rotate: '35deg' }] }]} />
      <View style={[styles.streak, { top: 10, right: -10, width: 18, transform: [{ rotate: '28deg' }] }]} />
      <View style={[styles.streak, { top: 90, right: 90, height: 120, transform: [{ rotate: '42deg' }] }]} />
      {/* stone, top right */}
      <View style={styles.stoneTop} />
      <View style={styles.stoneTopFace} />
      {/* sand dunes, bottom */}
      <View style={[styles.dune, { backgroundColor: palette.sand1, bottom: -170, left: -120, width: 520, transform: [{ rotate: '-8deg' }] }]} />
      <View style={[styles.dune, { backgroundColor: palette.sand2, bottom: -210, left: -200, width: 460, transform: [{ rotate: '14deg' }] }]} />
      <View style={[styles.dune, { backgroundColor: palette.sand3, bottom: -250, right: -160, width: 420, transform: [{ rotate: '-12deg' }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: 200, gap: spacing.xl },

  hero: { gap: spacing.sm, marginBottom: spacing.xl },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eyebrowRule: { width: 28, height: 1, backgroundColor: palette.inkMuted },
  eyebrow: { fontSize: 11, letterSpacing: 3, color: palette.inkMuted },
  title: { fontFamily: serif, fontSize: 54, lineHeight: 62, color: palette.ink, letterSpacing: -0.5 },
  subtitle: { fontFamily: serif, fontSize: 17, color: palette.inkMuted },

  field: { gap: spacing.sm },
  label: { fontSize: 13, letterSpacing: 1, color: palette.ink },
  inputWrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.inputBorder,
    backgroundColor: palette.inputBg,
  },
  inputWrapFocused: { borderColor: palette.ink },
  input: { flex: 1, fontSize: 15, color: palette.ink, paddingVertical: spacing.md },

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
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 3 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  orRule: { flex: 1, height: 1, backgroundColor: palette.rule },
  orText: { fontSize: 12, letterSpacing: 3, color: palette.inkMuted },

  joinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  joinText: { fontSize: 14, color: palette.ink },

  streak: { position: 'absolute', width: 26, height: 200, borderRadius: 20, backgroundColor: palette.shadow, opacity: 0.35 },
  stoneTop: { position: 'absolute', top: 90, right: -50, width: 110, height: 140, borderRadius: 36, backgroundColor: palette.sand2, transform: [{ rotate: '-18deg' }] },
  stoneTopFace: { position: 'absolute', top: 100, right: -40, width: 70, height: 110, borderRadius: 28, backgroundColor: palette.sand1, transform: [{ rotate: '-18deg' }] },
  dune: { position: 'absolute', height: 320, borderRadius: 260 },
});
