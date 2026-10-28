import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { palette, serif } from '@/components/lux';
import { CardLabel, LuxButton, LuxCard, LuxLoading, LuxScreen, LuxText, StatusCard, tones } from '@/components/luxApp';
import { spacing } from '@/components/theme';
import { apiRequest } from '@/lib/api';
import { formatBps, formatPaise } from '@/lib/money';
import type { Program } from '@/lib/types';
import { useApi } from '@/lib/useApi';

/** The program terms for signed-in affiliates; like the welcome pitch, every number comes from GET /program. */
export default function HowItWorksScreen() {
  const { data: program, error, loading, refreshing, refresh } = useApi(() => apiRequest<Program>('/program'));

  return (
    <LuxScreen edges={['bottom']} eyebrow="START SHARING" title="How it works" refreshing={refreshing} onRefresh={refresh}>
      {loading ? <LuxLoading label="Loading program details…" /> : null}
      {error ? (
        <StatusCard tone="danger" label="Couldn’t load" title="The program details didn’t load." action={<LuxButton label="Try again" variant="secondary" compact onPress={refresh} />}>
          {error}
        </StatusCard>
      ) : null}

      {program ? (
        <>
          <View style={styles.stats}>
            <LuxCard style={styles.stat}>
              <Text style={styles.statValue}>{formatBps(program.rateBps)}</Text>
              <LuxText>commission on every sale</LuxText>
            </LuxCard>
            <LuxCard style={styles.stat}>
              <Text style={styles.statValue}>{formatPaise(program.minPayoutPaise)}</Text>
              <LuxText>minimum payout</LuxText>
            </LuxCard>
          </View>

          <LuxCard>
            <CardLabel>Step by step</CardLabel>
            {program.steps.map((step, index) => (
              <View key={`${index}-${step}`} style={styles.listRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <LuxText muted={false} style={styles.listText}>
                  {step}
                </LuxText>
              </View>
            ))}
          </LuxCard>

          <LuxCard>
            <CardLabel>What counts as a sale</CardLabel>
            {program.qualifyingRules.map((rule, index) => (
              <View key={`${index}-${rule}`} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={20} color={tones.success.dot} />
                <LuxText muted={false} style={styles.listText}>
                  {rule}
                </LuxText>
              </View>
            ))}
          </LuxCard>

          <LuxCard>
            <CardLabel>Getting paid</CardLabel>
            <LuxText muted={false}>
              {program.payoutSchedule}. Payouts are sent automatically once your approved earnings reach {formatPaise(program.minPayoutPaise)}, with no requests or paperwork.
            </LuxText>
          </LuxCard>
        </>
      ) : null}
    </LuxScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, gap: spacing.xs },
  statValue: { fontFamily: serif, fontSize: 26, color: palette.ink },
  listRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  listText: { flex: 1 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.sand2, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: serif, fontSize: 13, color: palette.ink },
});
