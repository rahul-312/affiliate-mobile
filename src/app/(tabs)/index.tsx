import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '@/components/theme';
import { Banner, Body, Button, Card, Row, Screen, Small, Title } from '@/components/ui';
import { apiRequest, errorMessage } from '@/lib/api';
import { formatPaise } from '@/lib/money';
import { useSession, useUser } from '@/lib/session';
import type { Summary, User } from '@/lib/types';
import { useApi } from '@/lib/useApi';

function ApplicationStatus({ user }: { user: User }) {
  if (user.status === 'pending') {
    return (
      <Banner tone="info" title="We've received your application">
        We usually review applications within 1 business day. Pull down to refresh; your referral link activates as soon as you’re approved.
      </Banner>
    );
  }
  if (user.status === 'rejected') {
    return (
      <Banner tone="danger" title="Your application wasn't approved">
        {user.rejectionReason ? `Reason: ${user.rejectionReason}` : 'Please contact the affiliate team for details.'}
      </Banner>
    );
  }
  return null;
}

function ReferralCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);
  const active = Boolean(user.referralLinkActive && user.referralLink);

  const copy = async () => {
    if (!user.referralLink) return;
    await Clipboard.setStringAsync(user.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!user.referralLink) return;
    await Share.share({ message: `Shop with my link and support my channel: ${user.referralLink}` });
  };

  return (
    <Card>
      <Title>Your referral link</Title>
      <View style={[styles.codeBox, !active && styles.codeBoxInactive]}>
        <Text style={[styles.code, !active && styles.inactiveText]}>{user.referralCode}</Text>
        <Text style={[styles.link, !active && styles.inactiveText]} numberOfLines={1}>
          {active ? user.referralLink : 'Activates after approval'}
        </Text>
      </View>
      {active ? (
        <Row>
          <View style={{ flex: 1 }}>
            <Button
              label={copied ? 'Copied!' : 'Copy link'}
              variant="secondary"
              onPress={copy}
              icon={<Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.primary} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Share" onPress={share} icon={<Ionicons name="share-social-outline" size={18} color={colors.primaryText} />} />
          </View>
        </Row>
      ) : (
        <Small>You can share your link once the affiliate team approves your application.</Small>
      )}
    </Card>
  );
}

export default function HomeScreen() {
  const user = useUser();
  const { refreshUser } = useSession();
  const summary = useApi(() => apiRequest<Summary>('/me/summary'));
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await Promise.all([refreshUser(), summary.refresh()]);
    } catch (err) {
      setRefreshError(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, summary]);

  const s = summary.data;
  const firstName = user.name.split(' ')[0];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text style={styles.greeting}>Hi {firstName} 👋</Text>
      {refreshError ? <Banner tone="danger">{refreshError}</Banner> : null}
      <ApplicationStatus user={user} />

      {s?.needsPayoutDetails ? (
        <Banner
          tone="warning"
          title={`You've earned ${formatPaise(s.approvedPaise)}`}
          action={<Button label="Add payout details" onPress={() => router.push('/payout-details')} />}
        >
          Add your UPI ID or bank account so we can pay you.
        </Banner>
      ) : null}

      <ReferralCard user={user} />

      {user.status === 'active' && s ? (
        <Card>
          <Title>At a glance</Title>
          <Row>
            <Body muted>Available for next payout</Body>
            <Text style={styles.amount}>{formatPaise(s.availableForNextPayoutPaise)}</Text>
          </Row>
          <Row>
            <Body muted>Waiting for review</Body>
            <Text style={styles.amountSmall}>{formatPaise(s.pendingPaise)}</Text>
          </Row>
          <Row>
            <Body muted>Paid to you so far</Body>
            <Text style={styles.amountSmall}>{formatPaise(s.paidPaise)}</Text>
          </Row>
          <Button label="See all earnings" variant="ghost" onPress={() => router.push('/earnings')} />
        </Card>
      ) : null}
      {summary.error ? <Banner tone="danger">{summary.error}</Banner> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  codeBox: { backgroundColor: colors.infoBg, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  codeBoxInactive: { backgroundColor: colors.neutralBg },
  code: { fontSize: font.heading, fontWeight: '800', letterSpacing: 2, color: colors.info },
  link: { fontSize: font.small, color: colors.info },
  inactiveText: { color: colors.textMuted },
  amount: { fontSize: font.title, fontWeight: '800', color: colors.success },
  amountSmall: { fontSize: font.body, fontWeight: '700', color: colors.text },
});
