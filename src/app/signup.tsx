import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Decor, LuxChips, LuxField, palette, serif } from '@/components/lux';
import { spacing } from '@/components/theme';
import { Banner } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { PromotionChannel } from '@/lib/types';
import { isEmail, isHttpUrl } from '@/lib/validation';

const CHANNELS: { value: PromotionChannel; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'website', label: 'Blog / website' },
  { value: 'messaging', label: 'WhatsApp / Telegram' },
  { value: 'other', label: 'Other' },
];

/**
 * Deliberately short: no payment details here. Those are asked for after
 * approval, once the affiliate actually has something to be paid.
 */
export default function SignUpScreen() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [channel, setChannel] = useState<PromotionChannel | null>(null);
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: name.trim().length < 2 ? 'Enter your name' : null,
    email: !isEmail(email) ? 'Enter a valid email' : null,
    password: password.length < 8 ? 'Use at least 8 characters' : null,
    channel: !channel ? 'Choose where you will promote' : null,
    url: url.trim() && !isHttpUrl(url) ? 'Use a full link starting with https://' : null,
  };
  const valid = Object.values(errors).every((e) => e === null);
  const show = (message: string | null) => (submitted ? message : null);

  const submit = async () => {
    setSubmitted(true);
    if (!valid || !channel) return;
    setBusy(true);
    setError(null);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        promotionChannel: channel,
        ...(url.trim() ? { promotionUrl: url.trim() } : {}),
      });
      // The session guard moves us into the app, where Home shows "application received".
    } catch (err) {
      setError(err instanceof Error && !('status' in err) ? err.message : errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Decor />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
              onPress={() => router.replace('/login')}
              hitSlop={12}
              style={styles.back}
            >
              <Ionicons name="arrow-back" size={20} color={palette.ink} />
            </Pressable>
            <Text style={styles.step}>APPLICATION</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowRule} />
              <Text style={styles.eyebrow}>JOIN THE PROGRAM</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              Apply to join
            </Text>
            <Text style={styles.subtitle}>Tell us a little about yourself. We review every application within one business day.</Text>
          </View>

          {error ? <Banner tone="danger">{error}</Banner> : null}

          <Section index="01" title="About you">
            <LuxField
              label="Full name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textContentType="name"
              maxLength={100}
              returnKeyType="next"
              error={show(errors.name)}
            />
            <LuxField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={254}
              returnKeyType="next"
              error={show(errors.email)}
            />
            <LuxField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={72}
              hint="At least 8 characters"
              error={show(errors.password)}
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
          </Section>

          <Section index="02" title="Your audience">
            <View style={styles.field}>
              <Text style={styles.label}>Where will you promote us?</Text>
              <LuxChips options={CHANNELS} value={channel} onChange={setChannel} invalid={!!show(errors.channel)} />
              {show(errors.channel) ? <Text style={styles.error}>{errors.channel}</Text> : null}
            </View>
            <LuxField
              label="Profile or site link (optional)"
              placeholder="https://instagram.com/yourname"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={500}
              returnKeyType="go"
              onSubmitEditing={submit}
              hint="Helps us review your application faster"
              error={show(errors.url)}
            />
          </Section>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit application"
              accessibilityState={{ disabled: busy, busy }}
              onPress={submit}
              disabled={busy}
              style={({ pressed }) => [styles.cta, (pressed || busy) && { opacity: busy ? 0.7 : 0.88 }]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>SUBMIT APPLICATION</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>
            <Text style={styles.fineprint}>No payment details needed now. We'll ask for those once you're approved.</Text>
          </View>

          <View style={styles.orRow}>
            <View style={styles.orRule} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orRule} />
          </View>

          <Pressable accessibilityRole="link" onPress={() => router.replace('/login')} style={styles.joinRow} hitSlop={8}>
            <Text style={styles.joinText}>Already a member?</Text>
            <View style={styles.link}>
              <Text style={styles.linkText}>Sign in</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={palette.ink} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionIndex}>{index}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionRule} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 200, gap: spacing.xl },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.inputBorder,
    backgroundColor: palette.inputBg,
  },
  step: { fontSize: 11, letterSpacing: 3, color: palette.inkMuted },

  hero: { gap: spacing.sm, marginTop: spacing.md },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eyebrowRule: { width: 28, height: 1, backgroundColor: palette.inkMuted },
  eyebrow: { fontSize: 11, letterSpacing: 3, color: palette.inkMuted },
  title: { fontFamily: serif, fontSize: 46, lineHeight: 54, color: palette.ink, letterSpacing: -0.5 },
  subtitle: { fontFamily: serif, fontSize: 16, lineHeight: 23, color: palette.inkMuted },

  section: { gap: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  sectionIndex: { fontFamily: serif, fontSize: 14, color: palette.inkMuted },
  sectionTitle: { fontFamily: serif, fontSize: 20, color: palette.ink },
  sectionRule: { flex: 1, height: 1, backgroundColor: palette.rule, alignSelf: 'center' },

  field: { gap: spacing.sm },
  label: { fontSize: 13, letterSpacing: 1, color: palette.ink },
  error: { fontSize: 12, color: palette.danger },

  actions: { gap: spacing.md, marginTop: spacing.sm },
  cta: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 3 },
  fineprint: { fontSize: 12, lineHeight: 17, color: palette.inkMuted, textAlign: 'center' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  orRule: { flex: 1, height: 1, backgroundColor: palette.rule },
  orText: { fontSize: 12, letterSpacing: 3, color: palette.inkMuted },

  joinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  joinText: { fontSize: 14, color: palette.ink },
  // A border instead of textDecorationLine: native underlines cut through descenders like g and p.
  link: { borderBottomWidth: 1, borderBottomColor: palette.ink, paddingBottom: 3 },
  linkText: { fontSize: 14, color: palette.ink },
});
