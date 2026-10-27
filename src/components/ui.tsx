import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from './theme';

/* ---------- layout ---------- */

interface ScreenProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Tabs draw their own header, so only stack screens need the top inset. */
  edges?: ('top' | 'bottom')[];
}

export function Screen({ children, refreshing, onRefresh, edges = [] }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export const Heading = ({ children }: { children: ReactNode }) => <Text style={styles.heading}>{children}</Text>;
export const Title = ({ children }: { children: ReactNode }) => <Text style={styles.title}>{children}</Text>;
export const Body = ({ children, muted }: { children: ReactNode; muted?: boolean }) => (
  <Text style={[styles.body, muted && styles.muted]}>{children}</Text>
);
export const Small = ({ children, muted = true }: { children: ReactNode; muted?: boolean }) => (
  <Text style={[styles.small, muted && styles.muted]}>{children}</Text>
);

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Small>{label}</Small>
    </View>
  );
}

/* ---------- controls ---------- */

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
}

export function Button({ label, onPress, variant = 'primary', disabled, busy, icon }: ButtonProps) {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        (pressed || inactive) && { opacity: inactive ? 0.5 : 0.85 },
      ]}
    >
      {busy ? <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.primary} /> : icon}
      <Text style={[styles.buttonText, variant === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string | null;
}

export function Field({ label, hint, error, style, ...input }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        accessibilityLabel={label}
        {...input}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Small>{hint}</Small> : null}
    </View>
  );
}

export function Chips<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- feedback ---------- */

type Tone = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  info: { bg: colors.infoBg, fg: colors.info },
  warning: { bg: colors.warningBg, fg: colors.warning },
  success: { bg: colors.successBg, fg: colors.success },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  neutral: { bg: colors.neutralBg, fg: colors.textMuted },
};

export function Banner({ tone, title, children, action }: { tone: Tone; title?: string; children?: ReactNode; action?: ReactNode }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]} accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}>
      {title ? <Text style={[styles.bannerTitle, { color: c.fg }]}>{title}</Text> : null}
      {children ? <Text style={[styles.body, { color: c.fg }]}>{children}</Text> : null}
      {action ? <View style={{ marginTop: spacing.sm }}>{action}</View> : null}
    </View>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  pending: 'warning',
  approved: 'info',
  processing: 'info',
  paid: 'success',
  rejected: 'danger',
  active: 'success',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  processing: 'Processing',
  paid: 'Paid',
  rejected: 'Rejected',
  active: 'Active',
};

export function StatusPill({ status }: { status: string }) {
  const c = toneColors[STATUS_TONES[status] ?? 'neutral'];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  center: { padding: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  heading: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  small: { fontSize: font.small, color: colors.text, lineHeight: 18 },
  muted: { color: colors.textMuted },
  button: { minHeight: 48, borderRadius: radius.sm, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonText: { fontSize: font.body, fontWeight: '600' },
  buttonTextPrimary: { color: colors.primaryText },
  buttonTextSecondary: { color: colors.primary },
  field: { gap: spacing.xs },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, fontSize: font.body, color: colors.text, backgroundColor: colors.surface },
  inputError: { borderColor: colors.danger },
  errorText: { fontSize: font.small, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.small, color: colors.text, fontWeight: '500' },
  chipTextSelected: { color: colors.primaryText },
  banner: { borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  bannerTitle: { fontSize: font.body, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  pillText: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
});
