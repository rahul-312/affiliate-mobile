import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, serif } from '@/components/lux';
import { spacing } from '@/components/theme';

/** Signed-in counterpart to lux.tsx: the same warm palette, laid out for dashboards rather than forms. */

export const surface = '#fcfaf7';

/** Status colours tuned to sit on the warm palette; the shared theme's cool tones clash with it. */
export const tones = {
  success: { fg: '#4b7337', bg: '#eceee3', dot: '#5f8f45' },
  warning: { fg: '#85570f', bg: '#f4e9d5', dot: '#c48a2c' },
  danger: { fg: palette.danger, bg: palette.dangerBg, dot: palette.danger },
  neutral: { fg: palette.inkMuted, bg: palette.inputBg, dot: palette.inkMuted },
} as const;
export type Tone = keyof typeof tones;

type IconName = ComponentProps<typeof Ionicons>['name'];

/* ---------- layout ---------- */

interface LuxScreenProps {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Top-right control beside the eyebrow, e.g. a settings button. */
  action?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Tab screens have no header, so they need the top inset; stack screens with a header don't. */
  edges?: ('top' | 'bottom')[];
}

export function LuxScreen({ children, eyebrow, title, subtitle, action, refreshing, onRefresh, edges = ['top'] }: LuxScreenProps) {
  return (
    <View style={styles.root}>
      <LeafShadows />
      <SafeAreaView style={styles.flex} edges={edges}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          // iOS: scroll a focused field into view above the keyboard (Android resizes the window itself).
          automaticallyAdjustKeyboardInsets
          refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={palette.ink} colors={[palette.ink]} /> : undefined}
        >
          <View style={styles.column}>
            {eyebrow || action ? (
              <View style={styles.topRow}>
                {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : <View />}
                {action}
              </View>
            ) : null}
            {title ? (
              <View style={styles.hero}>
                <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
                  {title}
                </Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Soft diagonal shadows, top right, standing in for the leaf-shadow photography. Purely decorative. */
function LeafShadows() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants">
      <View style={[styles.streak, { top: -60, right: 30, transform: [{ rotate: '35deg' }] }]} />
      <View style={[styles.streak, { top: -20, right: -20, width: 16, transform: [{ rotate: '28deg' }] }]} />
      <View style={[styles.streak, { top: 40, right: 100, height: 110, transform: [{ rotate: '42deg' }] }]} />
    </View>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return (
    <View style={styles.eyebrowRow}>
      <View style={styles.eyebrowRule} />
      <Text style={styles.eyebrow}>{children}</Text>
    </View>
  );
}

export function LuxCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small spaced capitals that open a card. */
export const CardLabel = ({ children, color }: { children: string; color?: string }) => (
  <Text style={[styles.cardLabel, color ? { color } : null]}>{children}</Text>
);

export const CardTitle = ({ children }: { children: ReactNode }) => <Text style={styles.cardTitle}>{children}</Text>;

export const LuxText = ({ children, muted = true, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.text, muted && styles.muted, style]}>{children}</Text>
);

export function LuxRow({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export const LuxDivider = () => <View style={styles.divider} />;

export function LuxLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={palette.ink} />
      <LuxText>{label}</LuxText>
    </View>
  );
}

/* ---------- controls ---------- */

interface LuxButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  icon?: IconName;
  busy?: boolean;
  disabled?: boolean;
  /** Shrink to the label instead of filling the row. */
  compact?: boolean;
}

export function LuxButton({ label, onPress, variant = 'primary', icon, busy, disabled, compact }: LuxButtonProps) {
  const inactive = disabled || busy;
  const fg = variant === 'primary' ? palette.onInk : palette.ink;
  if (variant === 'link') {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} disabled={inactive} hitSlop={8} style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.6 }]}>
        <View style={styles.linkUnderline}>
          <Text style={styles.linkText}>{label}</Text>
        </View>
        {icon ? <Ionicons name={icon} size={16} color={palette.ink} /> : null}
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        compact && styles.buttonCompact,
        (pressed || inactive) && { opacity: inactive ? 0.55 : 0.85 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
          {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

/** Round white button holding a single icon, like the settings and copy controls. */
export function IconButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, disabled && { opacity: 0.5 }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color={palette.ink} />
    </Pressable>
  );
}

/* ---------- feedback ---------- */

/**
 * A tinted card with a status dot, used for application status and things that need the affiliate's attention.
 * Danger cards are announced when they appear, like LuxErrorBanner, so the body is plain text only.
 * Pass `quiet` for a standing status that isn't news, such as a rejected application.
 */
export function StatusCard({
  tone,
  label,
  title,
  children,
  action,
  quiet,
}: {
  tone: Tone;
  label: string;
  title: string;
  children?: string;
  action?: ReactNode;
  quiet?: boolean;
}) {
  const c = tones[tone];
  useEffect(() => {
    if (tone === 'danger' && !quiet) AccessibilityInfo.announceForAccessibility(children ? `${title} ${children}` : title);
  }, [tone, quiet, title, children]);
  return (
    <View style={[styles.statusCard, { backgroundColor: c.bg }]} accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}>
      <View style={styles.statusLabelRow}>
        <View style={[styles.dot, { backgroundColor: c.dot }]} />
        <CardLabel color={c.fg}>{label}</CardLabel>
      </View>
      <View style={styles.statusBody}>
        <CardTitle>{title}</CardTitle>
        {children ? <LuxText>{children}</LuxText> : null}
        {action ? <View style={{ marginTop: spacing.sm }}>{action}</View> : null}
      </View>
    </View>
  );
}

/**
 * Every load error on a screen in one card. Separate cards would each announce, and on iOS the
 * second announcement cuts off the first. Identical messages (e.g. offline) are shown once.
 */
export function LoadErrorCard({ errors }: { errors: { label?: string; title: string; message: string | null }[] }) {
  const failed = errors.filter((e) => e.message);
  const [first] = failed;
  if (!first) return null;
  const single = failed.length === 1;
  const messages = [...new Set(failed.map((e) => e.message))];
  return (
    <StatusCard
      tone="danger"
      label={single ? (first.label ?? 'Couldn’t load') : 'Couldn’t load'}
      title={single ? first.title : 'Some details didn’t load.'}
    >
      {messages.join('\n')}
    </StatusCard>
  );
}

const STATUS: Record<string, { tone: Tone; label: string }> = {
  pending: { tone: 'warning', label: 'Pending review' },
  approved: { tone: 'success', label: 'Approved' },
  processing: { tone: 'neutral', label: 'Processing' },
  paid: { tone: 'success', label: 'Paid' },
  rejected: { tone: 'danger', label: 'Rejected' },
  active: { tone: 'success', label: 'Active' },
  deactivated: { tone: 'neutral', label: 'Paused' },
};

export function LuxPill({ status }: { status: string }) {
  const { tone, label } = STATUS[status] ?? { tone: 'neutral', label: status };
  const c = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.pillText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  column: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  hero: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontFamily: serif, fontSize: 40, lineHeight: 48, color: palette.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, lineHeight: 22, color: palette.inkMuted },

  streak: { position: 'absolute', width: 26, height: 200, borderRadius: 20, backgroundColor: palette.shadow, opacity: 0.3 },

  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eyebrowRule: { width: 28, height: 1, backgroundColor: palette.inkMuted },
  eyebrow: { fontSize: 11, letterSpacing: 3, color: palette.inkMuted },

  card: { backgroundColor: surface, borderRadius: 16, borderWidth: 1, borderColor: palette.inputBorder, padding: spacing.xl - 4, gap: spacing.md },
  cardLabel: { fontSize: 11, letterSpacing: 2, color: palette.inkMuted, textTransform: 'uppercase' },
  cardTitle: { fontFamily: serif, fontSize: 20, lineHeight: 26, color: palette.ink },
  text: { fontSize: 14, lineHeight: 21, color: palette.ink },
  muted: { color: palette.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  divider: { height: 1, backgroundColor: palette.inputBorder },
  loading: { padding: spacing.xxl, alignItems: 'center', gap: spacing.sm },

  button: { minHeight: 50, borderRadius: 999, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  buttonPrimary: { backgroundColor: palette.ink },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.ink },
  buttonCompact: { alignSelf: 'flex-start', minHeight: 44 },
  buttonText: { fontSize: 14, fontWeight: '600' },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', minHeight: 32 },
  // A border instead of textDecorationLine: native underlines cut through descenders like g and p.
  linkUnderline: { borderBottomWidth: 1, borderBottomColor: palette.ink, paddingBottom: 2 },
  linkText: { fontSize: 14, color: palette.ink },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface,
    borderWidth: 1,
    borderColor: palette.inputBorder,
  },

  statusCard: { borderRadius: 16, padding: spacing.xl - 4, gap: spacing.sm },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusBody: { gap: spacing.sm, paddingLeft: 10 + spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },
});
