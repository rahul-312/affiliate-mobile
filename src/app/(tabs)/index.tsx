import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Share, StyleSheet, Text, View } from 'react-native';
import { palette, serif } from '@/components/lux';
import {
  CardLabel,
  IconButton,
  LoadErrorCard,
  LuxButton,
  LuxCard,
  LuxDivider,
  LuxRow,
  LuxScreen,
  LuxText,
  StatusCard,
  tones,
} from '@/components/luxApp';
import { spacing } from '@/components/theme';
import { apiRequest, errorMessage } from '@/lib/api';
import { formatBps, formatPaise } from '@/lib/money';
import { useSession, useUser } from '@/lib/session';
import type { Summary, User } from '@/lib/types';
import { useAccountStatus } from '@/lib/useAccountStatus';
import { useApi } from '@/lib/useApi';

const SUBTITLES: Record<User['status'], string> = {
  pending: 'Thanks for applying! Here’s your current status and referral link.',
  active: 'Here’s your referral link and how your earnings are doing.',
  rejected: 'Here’s an update on your application.',
  deactivated: 'Your account is paused for now.',
};

/** "Fraud review." and "Fraud review" both read as one sentence. */
const asSentence = (text: string) => `${text.trim().replace(/[.!?]+$/, '')}.`;

function PausedStatus({ user, onChanged }: { user: User; onChanged: () => Promise<unknown> }) {
  const { busy, error, resume } = useAccountStatus(onChanged);

  if (user.deactivatedBy === 'affiliate') {
    return (
      <StatusCard
        tone="neutral"
        label="Paused"
        title="You’ve paused your account."
        action={<LuxButton label="Resume" icon="play-outline" compact busy={busy} onPress={resume} />}
      >
        {error ?? 'Your link is off and new sales won’t earn commission. Earnings you already have will still be paid. Resume whenever you’re ready.'}
      </StatusCard>
    );
  }
  return (
    <StatusCard tone="neutral" label="Account paused" title="The affiliate team has paused your account.">
      {`${error ? `${asSentence(error)} ` : ''}${user.deactivationReason ? `Reason: ${asSentence(user.deactivationReason)} ` : ''}Your approved earnings are kept but on hold until your account is reactivated.${
        error ? '' : ' Please contact the affiliate team.'
      }`}
    </StatusCard>
  );
}

function ApplicationStatus({ user, onChanged }: { user: User; onChanged: () => Promise<unknown> }) {
  if (user.status === 'deactivated') return <PausedStatus user={user} onChanged={onChanged} />;
  if (user.status === 'pending') {
    return (
      <StatusCard tone="warning" label="Application received" title="We’ve received your application.">
        We usually review applications within 1 business day. Pull down to refresh; your referral link activates as soon as you’re approved.
      </StatusCard>
    );
  }
  if (user.status === 'rejected') {
    return (
      <StatusCard tone="danger" label="Application update" title="Your application wasn’t approved." quiet>
        {user.rejectionReason ? `Reason: ${user.rejectionReason}` : 'Please contact the affiliate team for details.'}
      </StatusCard>
    );
  }
  return null;
}

function ReferralCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const active = Boolean(user.referralLinkActive && user.referralLink);
  const paused = user.status === 'deactivated';

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const copy = async () => {
    if (!active || !user.referralLink) return;
    await Clipboard.setStringAsync(user.referralLink);
    setCopied(true);
    AccessibilityInfo.announceForAccessibility('Link copied');
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!user.referralLink) return;
    await Share.share({ message: `Shop with my link and support my channel: ${user.referralLink}` });
  };

  return (
    <LuxCard>
      <CardLabel>Your referral link</CardLabel>
      <View style={styles.codeBox}>
        <View style={styles.codeText}>
          <Text style={[styles.code, !active && styles.codeInactive]}>{user.referralCode}</Text>
          <Text style={styles.codeSub} numberOfLines={1}>
            {active ? user.referralLink : paused ? 'Paused' : 'Activates after approval'}
          </Text>
        </View>
        <IconButton icon={copied ? 'checkmark' : 'copy-outline'} label={copied ? 'Copied' : 'Copy link'} onPress={copy} disabled={!active} />
      </View>
      <LuxDivider />
      {active && user.commissionRateBps ? (
        <LuxText>
          You earn <Text style={styles.rate}>{formatBps(user.commissionRateBps)}</Text> on every sale through your link.
        </LuxText>
      ) : null}
      {active ? (
        <LuxButton label="Share your link" icon="share-outline" onPress={share} />
      ) : paused ? (
        <LuxText>
          {user.deactivatedBy === 'affiliate'
            ? 'Your link is paused. Resume your account to share it again.'
            : 'Your link is paused while the affiliate team has your account on hold.'}
        </LuxText>
      ) : (
        <LuxText>You can share your link once the affiliate team approves your application.</LuxText>
      )}
    </LuxCard>
  );
}

function AtAGlance({ summary }: { summary: Summary }) {
  return (
    <LuxCard>
      <CardLabel>At a glance</CardLabel>
      <View>
        <LuxText>Available for next payout</LuxText>
        <Text style={styles.bigAmount}>{formatPaise(summary.availableForNextPayoutPaise)}</Text>
      </View>
      <LuxDivider />
      <LuxRow>
        <LuxText>Waiting for review</LuxText>
        <Text style={styles.amount}>{formatPaise(summary.pendingPaise)}</Text>
      </LuxRow>
      <LuxRow>
        <LuxText>Paid to you so far</LuxText>
        <Text style={styles.amount}>{formatPaise(summary.paidPaise)}</Text>
      </LuxRow>
      <LuxButton label="See all earnings" variant="link" icon="arrow-forward" onPress={() => router.navigate('/earnings')} />
    </LuxCard>
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

  // Status can change on other tabs (Account) or on the server; refresh the account and summary each time
  // Home comes back into focus. The first focus is skipped: both were just loaded on mount.
  const refreshSummary = summary.refresh;
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedBefore.current) {
        focusedBefore.current = true;
        return;
      }
      void Promise.all([refreshUser().catch(() => undefined), refreshSummary()]);
    }, [refreshUser, refreshSummary]),
  );

  const s = summary.data;
  const firstName = user.name.split(' ')[0];

  return (
    <LuxScreen
      eyebrow="HOME"
      title={`Hi ${firstName} 👋`}
      subtitle={SUBTITLES[user.status]}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <LoadErrorCard
        errors={[
          { label: 'Couldn’t refresh', title: 'Your account status didn’t update.', message: refreshError },
          { title: 'Your earnings summary didn’t load.', message: summary.error },
        ]}
      />
      <ApplicationStatus user={user} onChanged={summary.refresh} />

      {s?.needsPayoutDetails && !s.payoutsOnHold ? (
        <StatusCard
          tone="warning"
          label="Action needed"
          title={`You’ve earned ${formatPaise(s.approvedPaise)}`}
          action={<LuxButton label="Add payout details" icon="arrow-forward" compact onPress={() => router.push('/payout-details')} />}
        >
          Add your UPI ID or bank account so we can pay you.
        </StatusCard>
      ) : null}

      <ReferralCard user={user} />
      {(user.status === 'active' || user.status === 'deactivated') && s ? <AtAGlance summary={s} /> : null}
    </LuxScreen>
  );
}

const styles = StyleSheet.create({
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: palette.inputBg,
  },
  codeText: { flex: 1, gap: 2 },
  code: { fontFamily: serif, fontSize: 28, fontWeight: '700', letterSpacing: 2, color: palette.ink },
  codeInactive: { color: palette.inkMuted },
  codeSub: { fontSize: 13, color: palette.inkMuted },
  bigAmount: { fontFamily: serif, fontSize: 34, lineHeight: 42, color: tones.success.fg },
  amount: { fontSize: 15, fontWeight: '600', color: palette.ink },
  rate: { fontWeight: '700', color: palette.ink },
});
