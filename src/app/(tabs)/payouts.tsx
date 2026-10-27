import { StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '@/components/theme';
import { Banner, Body, Card, Divider, Loading, Row, Screen, Small } from '@/components/ui';
import { apiRequest } from '@/lib/api';
import { formatDate, formatPaise } from '@/lib/money';
import type { Payout } from '@/lib/types';
import { useApi } from '@/lib/useApi';

/** Only payments finance confirmed with a reference. A failed transfer never shows here. */
export default function PayoutsScreen() {
  const { data, error, loading, refreshing, refresh } = useApi(() => apiRequest<{ items: Payout[] }>('/me/payouts'));

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {loading ? <Loading /> : null}
      {data && data.items.length === 0 ? (
        <Card>
          <Body muted>No payouts yet. Once finance sends a payout run that includes your approved earnings, it will appear here with its payment reference.</Body>
        </Card>
      ) : null}
      {data && data.items.length > 0 ? (
        <Card>
          {data.items.map((payout, index) => (
            <View key={payout.batchId}>
              {index > 0 ? <Divider /> : null}
              <View style={styles.payout}>
                <Row>
                  <Text style={styles.amount}>{formatPaise(payout.amountPaise)}</Text>
                  <Small>{formatDate(payout.paidAt)}</Small>
                </Row>
                <Small>
                  {payout.batchNo} · {payout.commissionCount} commission(s)
                </Small>
                <Small muted={false}>Reference: {payout.paymentReference}</Small>
              </View>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  payout: { gap: 2, paddingVertical: spacing.xs },
  amount: { fontSize: font.title, fontWeight: '700', color: colors.success },
});
