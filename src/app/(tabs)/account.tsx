import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { palette, serif } from '@/components/lux';
import { CardLabel, LuxButton, LuxCard, LuxDivider, LuxPill, LuxRow, LuxScreen, LuxText } from '@/components/luxApp';
import { spacing } from '@/components/theme';
import { formatDate } from '@/lib/money';
import { useSession, useUser } from '@/lib/session';

export default function AccountScreen() {
  const user = useUser();
  const { signOut } = useSession();

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
