import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { spacing } from '@/components/theme';

/** Warm, editorial palette for the auth screens; the rest of the app keeps the shared theme. */
export const palette = {
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
  danger: '#a3321f',
  dangerBg: '#f3e1da',
  onInk: '#ffffff',
};

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

type LuxFieldProps = TextInputProps & {
  label: string;
  trailing?: ReactNode;
  hint?: string;
  error?: string | null;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function LuxField({ label, trailing, hint, error, ref, style, ...input }: LuxFieldProps) {
  const [focused, setFocused] = useState(false);
  const note = error ?? hint;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused, !!error && styles.inputWrapError]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={note ?? undefined}
          placeholderTextColor={palette.inkMuted}
          {...input}
          ref={ref}
          style={[styles.input, style]}
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
      {note ? <Text style={[styles.note, !!error && styles.noteError]}>{note}</Text> : null}
    </View>
  );
}

/** Pill choices in the same warm style as the fields. */
export function LuxChips<T extends string>({
  options,
  value,
  onChange,
  invalid,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  invalid?: boolean;
}) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [
              styles.chip,
              invalid && styles.inputWrapError,
              selected && styles.chipSelected,
              pressed && !selected && { opacity: 0.75 },
            ]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Error banner in the warm palette; the shared Banner's cool reds clash with it. */
export function LuxErrorBanner({ children }: { children: ReactNode }) {
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.bannerText}>{children}</Text>
    </View>
  );
}

/** Stone and sand shapes standing in for photography; purely decorative and behind the form. */
export function Decor() {
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
  inputWrapError: { borderColor: palette.danger },
  input: { flex: 1, fontSize: 15, color: palette.ink, paddingVertical: spacing.md },
  note: { fontSize: 12, color: palette.inkMuted },
  noteError: { color: palette.danger },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.inputBorder,
    backgroundColor: palette.inputBg,
  },
  chipSelected: { backgroundColor: palette.ink, borderColor: palette.ink },
  chipText: { fontSize: 14, color: palette.ink },
  chipTextSelected: { color: palette.onInk },

  banner: { padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: palette.danger, backgroundColor: palette.dangerBg },
  bannerText: { fontSize: 14, lineHeight: 20, color: palette.danger },

  streak: { position: 'absolute', width: 26, height: 200, borderRadius: 20, backgroundColor: palette.shadow, opacity: 0.35 },
  stoneTop: { position: 'absolute', top: 90, right: -50, width: 110, height: 140, borderRadius: 36, backgroundColor: palette.sand2, transform: [{ rotate: '-18deg' }] },
  stoneTopFace: { position: 'absolute', top: 100, right: -40, width: 70, height: 110, borderRadius: 28, backgroundColor: palette.sand1, transform: [{ rotate: '-18deg' }] },
  dune: { position: 'absolute', height: 320, borderRadius: 260 },
});
