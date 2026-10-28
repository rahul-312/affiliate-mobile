import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, serif } from '@/components/lux';
import { CardLabel, LoadErrorCard, LuxButton, LuxCard, LuxDivider, LuxLoading, LuxPill, LuxRow, LuxScreen, LuxText, tones } from '@/components/luxApp';
import { spacing } from '@/components/theme';
import { apiRequest } from '@/lib/api';
import { formatBps, formatDate, formatPaise } from '@/lib/money';
import type { Commission, Page, Summary } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const BALANCES: { key: keyof Summary; label: string; help: string }[] = [
  { key: 'pendingPaise', label: 'Pending', help: 'Recorded from a sale, awaiting review by the affiliate team' },
  { key: 'approvedPaise', label: 'Approved', help: 'Approved and eligible for payout' },
  { key: 'processingPaise', label: 'Processing', help: 'In a payout run the finance team is sending' },
  { key: 'paidPaise', label: 'Paid', help: 'Included in a payment confirmed with a reference' },
];

function AvailabilityNote({ summary }: { summary: Summary }) {
  if (summary.approvedPaise === 0) return <LuxText>Approved earnings will show here once the affiliate team reviews your sales.</LuxText>;
  if (summary.needsPayoutDetails) {
    return (
      <View style={{ gap: spacing.md }}>
        <LuxText muted={false}>Add your payout details to be included in the next payout run.</LuxText>
        <LuxButton label="Add payout details" icon="arrow-forward" compact onPress={() => router.push('/payout-details')} />
      </View>
    );
  }
  if (summary.belowMinimum) {
    return (
      <LuxText muted={false}>
        {formatPaise(summary.minPayoutPaise - summary.approvedPaise)} more in approved earnings to reach the {formatPaise(summary.minPayoutPaise)} minimum payout.
      </LuxText>
    );
  }
  return <LuxText>Paid out automatically in the next payout run.</LuxText>;
}

function CommissionRow({ commission }: { commission: Commission }) {
  return (
    <View style={styles.commission}>
      <LuxRow>
        <Text style={styles.commissionAmount}>{formatPaise(commission.amountPaise)}</Text>
        <LuxPill status={commission.status} />
      </LuxRow>
      <LuxText>
        {formatBps(commission.rateBps)} of a {formatPaise(commission.orderAmountPaise)} sale · {formatDate(commission.createdAt)}
      </LuxText>
      {commission.retryNote ? <LuxText muted={false}>⟳ {commission.retryNote}</LuxText> : null}
      {commission.rejectionReason ? <LuxText muted={false}>Reason: {commission.rejectionReason}</LuxText> : null}
    </View>
  );
}

export default function EarningsScreen() {
  const summary = useApi(() => apiRequest<Summary>('/me/summary'));
  const commissions = useApi(() => apiRequest<Page<Commission>>('/me/commissions?limit=100'));
  const refresh = useCallback(async () => {
    await Promise.all([summary.refresh(), commissions.refresh()]);
  }, [summary, commissions]);

  const s = summary.data;

  return (
    <LuxScreen
      eyebrow="EARNINGS"
      title="Your earnings"
      subtitle="Commissions from your link, from sale to payout."
      refreshing={summary.refreshing || commissions.refreshing}
      onRefresh={refresh}
    >
      <LoadErrorCard
        errors={[
          { title: 'Your balances didn’t load.', message: summary.error },
          { title: 'Your commissions didn’t load.', message: commissions.error },
        ]}
      />
      {summary.loading ? <LuxLoading /> : null}
      {s ? (
        <>
          <View style={styles.available}>
            <CardLabel color={tones.success.fg}>Available for next payout</CardLabel>
            <Text style={styles.availableAmount}>{formatPaise(s.availableForNextPayoutPaise)}</Text>
            <AvailabilityNote summary={s} />
          </View>
          <LuxCard>
            <CardLabel>Balances</CardLabel>
            {BALANCES.map(({ key, label, help }, index) => (
              <View key={key} style={{ gap: spacing.md }}>
                {index > 0 ? <LuxDivider /> : null}
                <LuxRow>
                  <View style={{ flex: 1, gap: 2 }}>
                    <LuxText muted={false} style={styles.balanceLabel}>
                      {label}
                    </LuxText>
                    <LuxText style={styles.help}>{help}</LuxText>
                  </View>
                  <Text style={styles.balance}>{formatPaise(s[key] as number)}</Text>
                </LuxRow>
              </View>
            ))}
          </LuxCard>
          <LuxText style={styles.help}>Payouts are sent automatically by our finance team in regular payout runs, so there’s nothing to request.</LuxText>
        </>
      ) : null}

      <LuxCard>
        <CardLabel>Commissions</CardLabel>
        {/* Announced in the card at the top; this just explains the empty list. */}
        {commissions.error ? <LuxText>Couldn’t load your commissions. Pull down to try again.</LuxText> : null}
        {commissions.loading ? <LuxLoading /> : null}
        {commissions.data && commissions.data.items.length === 0 ? <LuxText>No sales yet. Share your link to start earning.</LuxText> : null}
        {commissions.data?.items.map((c, index) => (
          <View key={c.id} style={{ gap: spacing.md }}>
            {index > 0 ? <LuxDivider /> : null}
            <CommissionRow commission={c} />
          </View>
        ))}
      </LuxCard>
    </LuxScreen>
  );
}

const styles = StyleSheet.create({
  available: { backgroundColor: tones.success.bg, borderRadius: 16, padding: spacing.xl - 4, gap: spacing.sm },
  availableAmount: { fontFamily: serif, fontSize: 40, lineHeight: 48, color: palette.ink },
  balanceLabel: { fontSize: 15 },
  help: { fontSize: 12, lineHeight: 17 },
  balance: { fontSize: 15, fontWeight: '600', color: palette.ink },
  commission: { gap: 4 },
  commissionAmount: { fontFamily: serif, fontSize: 19, color: palette.ink },
});
