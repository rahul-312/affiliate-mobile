import { router } from 'expo-router';
import { useState } from 'react';
import { Banner, Button, Field, Screen } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error && !('status' in err) ? err.message : errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" onSubmitEditing={submit} />
      <Button label="Sign in" onPress={submit} busy={busy} />
      <Button label="New here? Apply to join" variant="ghost" onPress={() => router.replace('/signup')} />
    </Screen>
  );
}
