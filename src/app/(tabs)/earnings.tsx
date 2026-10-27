import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '@/components/theme';
import { Banner, Body, Button, Card, Divider, Loading, Row, Screen, Small, StatusPill, Title } from '@/components/ui';
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
  if (summary.approvedPaise === 0) return <Small>Approved earnings will show here once the affiliate team reviews your sales.</Small>;
  if (summary.needsPayoutDetails) {
    return (
      <View style={{ gap: spacing.sm }}>
        <Small muted={false}>Add your payout details to be included in the next payout run.</Small>
        <Button label="Add payout details" variant="secondary" onPress={() => router.push('/payout-details')} />
      </View>
    );
  }
  if (summary.belowMinimum) {
    return <Small muted={false}>{formatPaise(summary.minPayoutPaise - summary.approvedPaise)} more in approved earnings to reach the {formatPaise(summary.minPayoutPaise)} minimum payout.</Small>;
  }
  return <Small>Paid out automatically in the next payout run.</Small>;
}

function CommissionRow({ commission }: { commission: Commission }) {
  return (
    <View style={styles.commission}>
      <Row>
        <Text style={styles.commissionAmount}>{formatPaise(commission.amountPaise)}</Text>
        <StatusPill status={commission.status} />
      </Row>
      <Small>
        {formatBps(commission.rateBps)} of a {formatPaise(commission.orderAmountPaise)} sale · {formatDate(commission.createdAt)}
      </Small>
      {commission.retryNote ? <Small muted={false}>⟳ {commission.retryNote}</Small> : null}
      {commission.rejectionReason ? <Small muted={false}>Reason: {commission.rejectionReason}</Small> : null}
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
    <Screen refreshing={summary.refreshing || commissions.refreshing} onRefresh={refresh}>
      {summary.error ? <Banner tone="danger">{summary.error}</Banner> : null}
      {summary.loading ? <Loading /> : null}
      {s ? (
        <>
          <Card style={styles.available}>
            <Small>Available for next payout</Small>
            <Text style={styles.availableAmount}>{formatPaise(s.availableForNextPayoutPaise)}</Text>
            <AvailabilityNote summary={s} />
          </Card>
          <Card>
            {BALANCES.map(({ key, label, help }, index) => (
              <View key={key}>
                {index > 0 ? <Divider /> : null}
                <Row>
                  <View style={{ flex: 1 }}>
                    <Body>{label}</Body>
                    <Small>{help}</Small>
                  </View>
                  <Text style={styles.balance}>{formatPaise(s[key] as number)}</Text>
                </Row>
              </View>
            ))}
          </Card>
          <Small>Payouts are sent automatically by our finance team in regular payout runs, so there’s nothing to request.</Small>
        </>
      ) : null}

      <Card>
        <Title>Commissions</Title>
        {commissions.error ? <Banner tone="danger">{commissions.error}</Banner> : null}
        {commissions.loading ? <Loading /> : null}
        {commissions.data && commissions.data.items.length === 0 ? <Body muted>No sales yet. Share your link to start earning.</Body> : null}
        {commissions.data?.items.map((c, index) => (
          <View key={c.id}>
            {index > 0 ? <Divider /> : null}
            <CommissionRow commission={c} />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  available: { backgroundColor: colors.successBg, borderColor: colors.successBg },
  availableAmount: { fontSize: font.hero, fontWeight: '800', color: colors.success },
  balance: { fontSize: font.body, fontWeight: '700', color: colors.text },
  commission: { gap: 2, paddingVertical: spacing.xs },
  commissionAmount: { fontSize: font.body, fontWeight: '700', color: colors.text },
});
