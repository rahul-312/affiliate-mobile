import { StyleSheet, Text, View } from 'react-native';
import { palette, serif } from '@/components/lux';
import { LuxCard, LuxDivider, LuxLoading, LuxRow, LuxScreen, LuxText, StatusCard } from '@/components/luxApp';
import { spacing } from '@/components/theme';
import { apiRequest } from '@/lib/api';
import { formatDate, formatPaise } from '@/lib/money';
import type { Payout } from '@/lib/types';
import { useApi } from '@/lib/useApi';

/** Only payments finance confirmed with a reference. A failed transfer never shows here. */
export default function PayoutsScreen() {
  const { data, error, loading, refreshing, refresh } = useApi(() => apiRequest<{ items: Payout[] }>('/me/payouts'));

  return (
    <LuxScreen eyebrow="PAYOUTS" title="Payouts" subtitle="Payments our finance team has sent you." refreshing={refreshing} onRefresh={refresh}>
      {error ? (
        <StatusCard tone="danger" label="Couldn’t load" title="Your payouts didn’t load.">
          {error}
        </StatusCard>
      ) : null}
      {loading ? <LuxLoading /> : null}
      {data && data.items.length === 0 ? (
        <LuxCard>
          <LuxText>No payouts yet. Once finance sends a payout run that includes your approved earnings, it will appear here with its payment reference.</LuxText>
        </LuxCard>
      ) : null}
      {data && data.items.length > 0 ? (
        <LuxCard>
          {data.items.map((payout, index) => (
            <View key={payout.batchId} style={{ gap: spacing.md }}>
              {index > 0 ? <LuxDivider /> : null}
              <View style={styles.payout}>
                <LuxRow>
                  <Text style={styles.amount}>{formatPaise(payout.amountPaise)}</Text>
                  <LuxText>{formatDate(payout.paidAt)}</LuxText>
                </LuxRow>
                <LuxText>
                  {payout.batchNo} · {payout.commissionCount} commission(s)
                </LuxText>
                <LuxText muted={false}>Reference: {payout.paymentReference}</LuxText>
              </View>
            </View>
          ))}
        </LuxCard>
      ) : null}
    </LuxScreen>
  );
}

const styles = StyleSheet.create({
  payout: { gap: 4 },
  amount: { fontFamily: serif, fontSize: 22, color: palette.ink },
});
