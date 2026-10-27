import { router } from 'expo-router';
import { useState } from 'react';
import { Banner, Body, Button, Chips, Field, Screen, Small } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { PromotionChannel } from '@/lib/types';
import { isEmail, isHttpUrl } from '@/lib/validation';

const CHANNELS: { value: PromotionChannel; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'website', label: 'Blog / website' },
  { value: 'messaging', label: 'WhatsApp / Telegram' },
  { value: 'other', label: 'Other' },
];

/**
 * Deliberately short: no payment details here. Those are asked for after
 * approval, once the affiliate actually has something to be paid.
 */
export default function SignUpScreen() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [channel, setChannel] = useState<PromotionChannel | null>(null);
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: name.trim().length < 2 ? 'Enter your name' : null,
    email: !isEmail(email) ? 'Enter a valid email' : null,
    password: password.length < 8 ? 'Use at least 8 characters' : null,
    channel: !channel ? 'Choose where you will promote' : null,
    url: url.trim() && !isHttpUrl(url) ? 'Use a full link starting with https://' : null,
  };
  const valid = Object.values(errors).every((e) => e === null);
  const show = (message: string | null) => (submitted ? message : null);

  const submit = async () => {
    setSubmitted(true);
    if (!valid || !channel) return;
    setBusy(true);
    setError(null);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        promotionChannel: channel,
        ...(url.trim() ? { promotionUrl: url.trim() } : {}),
      });
      // The session guard moves us into the app, where Home shows "application received".
    } catch (err) {
      setError(err instanceof Error && !('status' in err) ? err.message : errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Body muted>Tell us a little about yourself. We review applications within one business day.</Body>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" maxLength={100} error={show(errors.name)} />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={254}
        error={show(errors.email)}
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={72}
        hint="At least 8 characters"
        error={show(errors.password)}
      />
      <Small muted={false}>Where will you promote us?</Small>
      <Chips options={CHANNELS} value={channel} onChange={setChannel} />
      {show(errors.channel) ? <Small>{errors.channel}</Small> : null}
      <Field
        label="Profile or site link (optional)"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://instagram.com/yourname"
        maxLength={500}
        hint="Helps us review your application faster"
        error={show(errors.url)}
      />
      <Button label="Submit application" onPress={submit} busy={busy} />
      <Button label="I already have an account" variant="ghost" onPress={() => router.replace('/login')} />
    </Screen>
  );
}
