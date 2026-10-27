import { router } from 'expo-router';
import { useState } from 'react';
import { Banner, Body, Button, Chips, Field, Screen, Small } from '@/components/ui';
import { apiRequest, errorMessage } from '@/lib/api';
import { useSession, useUser } from '@/lib/session';
import type { PayoutMethodInput, User } from '@/lib/types';
import { isAccountName, isAccountNumber, isIfsc, isUpiId } from '@/lib/validation';

type MethodType = PayoutMethodInput['type'];

const METHODS: { value: MethodType; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank account' },
];

/**
 * Full details are sent once over HTTPS, stored encrypted on the server and
 * never shown again: the app only ever receives the masked form.
 */
export default function PayoutDetailsScreen() {
  const user = useUser();
  const { setUser } = useSession();
  const [type, setType] = useState<MethodType>(user.payoutMethod?.type ?? 'upi');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmNumber, setConfirmNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user.status !== 'active') {
    return (
      <Screen edges={['bottom']}>
        <Banner tone="info">You can add payout details once your application is approved.</Banner>
      </Screen>
    );
  }

  const errors =
    type === 'upi'
      ? { upiId: isUpiId(upiId) ? null : 'Enter a valid UPI ID, e.g. name@okhdfc' }
      : {
          accountName: isAccountName(accountName) ? null : 'Enter the name on the account',
          accountNumber: isAccountNumber(accountNumber) ? null : 'Account numbers are 9 to 18 digits',
          confirmNumber: confirmNumber.trim() === accountNumber.trim() ? null : "Account numbers don't match",
          ifsc: isIfsc(ifsc) ? null : 'Enter a valid IFSC, e.g. HDFC0001234',
        };
  const valid = Object.values(errors).every((e) => e === null);
  const show = (message: string | null | undefined) => (submitted ? (message ?? null) : null);

  const save = async () => {
    setSubmitted(true);
    if (!valid) return;
    const body: PayoutMethodInput =
      type === 'upi'
        ? { type, upiId: upiId.trim().toLowerCase() }
        : { type, accountName: accountName.trim(), accountNumber: accountNumber.trim(), ifsc: ifsc.trim().toUpperCase() };
    setBusy(true);
    setError(null);
    try {
      setUser(await apiRequest<User>('/me/payout-method', { method: 'PUT', body }));
      router.back();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      {user.payoutMethod ? <Body muted>Currently: {user.payoutMethod.masked}. Saving replaces it.</Body> : null}
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Chips options={METHODS} value={type} onChange={setType} />

      {type === 'upi' ? (
        <Field
          label="UPI ID"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="name@okhdfc"
          maxLength={320}
          error={show(errors.upiId)}
        />
      ) : (
        <>
          <Field label="Account holder name" value={accountName} onChangeText={setAccountName} autoComplete="name" maxLength={100} error={show(errors.accountName)} />
          <Field
            label="Account number"
            value={accountNumber}
            onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={18}
            error={show(errors.accountNumber)}
          />
          <Field
            label="Confirm account number"
            value={confirmNumber}
            onChangeText={(v) => setConfirmNumber(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={18}
            error={show(errors.confirmNumber)}
          />
          <Field
            label="IFSC"
            value={ifsc}
            onChangeText={(v) => setIfsc(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={11}
            placeholder="HDFC0001234"
            error={show(errors.ifsc)}
          />
        </>
      )}

      <Small>Your details are encrypted and only used by our finance team to send your payouts. We’ll only ever show them masked.</Small>
      <Button label="Save payout details" onPress={save} busy={busy} />
    </Screen>
  );
}
