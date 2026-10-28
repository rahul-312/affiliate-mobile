import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { palette, serif } from '@/components/lux';
import { CardLabel, LuxButton, LuxCard, LuxDivider, LuxPill, LuxRow, LuxScreen, LuxText } from '@/components/luxApp';
import { spacing } from '@/components/theme';
import { apiRequest, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/money';
import type { User } from '@/lib/types';
import { useSession, useUser } from '@/lib/session';

export default function AccountScreen() {
  const user = useUser();
  const { signOut, setUser } = useSession();
  const [busy, setBusy] = useState(false);

  const updateStatus = async (action: 'pause' | 'resume') => {
    setBusy(true);
    try {
      setUser(await apiRequest<User>(`/me/${action}`, { method: 'POST', body: {} }));
    } catch (err) {
      Alert.alert('Something went wrong', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmPause = () =>
    Alert.alert(
      'Pause your account?',
      'Your referral link stops working and new sales won’t earn commission until you resume. Earnings you already have will still be paid.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pause', style: 'destructive', onPress: () => void updateStatus('pause') },
      ],
    );

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <LuxScreen eyebrow="ACCOUNT" title="Your account">
      <LuxCard>
        <View style={styles.profile}>
          <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
            <Text style={styles.avatarText}>{user.name.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{user.name}</Text>
            <LuxText>{user.email}</LuxText>
          </View>
        </View>
        <LuxDivider />
        <LuxRow>
          <LuxText>Application</LuxText>
          <LuxPill status={user.status} />
        </LuxRow>
        <LuxRow>
          <LuxText>Member since</LuxText>
          <LuxText muted={false}>{formatDate(user.createdAt)}</LuxText>
        </LuxRow>
      </LuxCard>

      <LuxCard>
        <CardLabel>Payout details</CardLabel>
        {user.status !== 'active' ? (
          <LuxText>You can add payout details once your application is approved.</LuxText>
        ) : user.payoutMethod ? (
          <>
            <Text style={styles.masked}>{user.payoutMethod.masked}</Text>
            <LuxText>Updated {formatDate(user.payoutMethod.updatedAt)}. Shown masked for your security.</LuxText>
            <LuxButton label="Change payout details" variant="secondary" onPress={() => router.push('/payout-details')} />
          </>
        ) : (
          <>
            <LuxText>Not added yet. We need a UPI ID or bank account to send your earnings.</LuxText>
            <LuxButton label="Add payout details" icon="arrow-forward" onPress={() => router.push('/payout-details')} />
          </>
        )}
      </LuxCard>

      {user.status === 'active' || (user.status === 'deactivated' && user.deactivatedBy === 'affiliate') ? (
        <LuxCard>
          <CardLabel>Taking a break?</CardLabel>
          {user.status === 'active' ? (
            <>
              <LuxText>Pause your account to switch off your referral link for a while. You can resume any time.</LuxText>
              <LuxButton label="Pause my account" variant="secondary" icon="pause-outline" busy={busy} onPress={confirmPause} />
            </>
          ) : (
            <>
              <LuxText>Your account is paused. Resume to switch your referral link back on.</LuxText>
              <LuxButton label="Resume my account" icon="play-outline" busy={busy} onPress={() => void updateStatus('resume')} />
            </>
          )}
        </LuxCard>
      ) : null}

      <LuxCard>
        <CardLabel>Program</CardLabel>
        <LuxButton label="How the program works" variant="link" icon="arrow-forward" onPress={() => router.push('/how-it-works')} />
      </LuxCard>

      <LuxButton label="Sign out" variant="secondary" icon="log-out-outline" onPress={confirmSignOut} />
    </LuxScreen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.sand2 },
  avatarText: { fontFamily: serif, fontSize: 24, color: palette.ink },
  name: { fontFamily: serif, fontSize: 22, color: palette.ink },
  masked: { fontSize: 16, fontWeight: '600', letterSpacing: 1, color: palette.ink },
});
