import { router } from 'expo-router';
import { Alert } from 'react-native';
import { Body, Button, Card, Divider, Row, Screen, Small, StatusPill, Title } from '@/components/ui';
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
    <Screen>
      <Card>
        <Title>{user.name}</Title>
        <Small>{user.email}</Small>
        <Row>
          <Body muted>Application</Body>
          <StatusPill status={user.status} />
        </Row>
        <Small>Member since {formatDate(user.createdAt)}</Small>
      </Card>

      <Card>
        <Title>Payout details</Title>
        {user.status !== 'active' ? (
          <Small>You can add payout details once your application is approved.</Small>
        ) : user.payoutMethod ? (
          <>
            <Body>{user.payoutMethod.masked}</Body>
            <Small>Updated {formatDate(user.payoutMethod.updatedAt)}. Shown masked for your security.</Small>
            <Divider />
            <Button label="Change payout details" variant="secondary" onPress={() => router.push('/payout-details')} />
          </>
        ) : (
          <>
            <Small>Not added yet. We need a UPI ID or bank account to send your earnings.</Small>
            <Button label="Add payout details" onPress={() => router.push('/payout-details')} />
          </>
        )}
      </Card>

      <Button label="Sign out" variant="ghost" onPress={confirmSignOut} />
    </Screen>
  );
}
