import { router, useNavigation } from 'expo-router';
import { useState } from 'react';
import { LuxChips, LuxErrorBanner, LuxField } from '@/components/lux';
import { IconButton, LuxButton, LuxScreen, LuxText, StatusCard } from '@/components/luxApp';
import { apiRequest, errorMessage } from '@/lib/api';
import { canManagePayouts } from '@/lib/account';
import { useSession, useUser } from '@/lib/session';
import type { PayoutMethodInput, User } from '@/lib/types';
import { isAccountName, isAccountNumber, isIfsc, isUpiId } from '@/lib/validation';

type MethodType = PayoutMethodInput['type'];

const METHODS: { value: MethodType; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank account' },
];

/** Masked fields look like passwords to iOS Password AutoFill and Android autofill; keep account numbers out of password managers. */
const NO_AUTOFILL = { textContentType: 'none', autoComplete: 'off', importantForAutofill: 'no' } as const;

/** Falls back to Home when the modal was opened directly (a deep link or a web refresh) and there's nothing behind it. */
const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** The modal has no header bar, so this is the way out on Android and web, where there's no swipe to dismiss. */
const CloseButton = ({ disabled }: { disabled?: boolean }) => <IconButton icon="close" label="Close" onPress={close} disabled={disabled} />;

/**
 * Full details are sent once over HTTPS, stored encrypted on the server and
 * never shown again: the app only ever receives the masked form.
 */
export default function PayoutDetailsScreen() {
  const user = useUser();
  const { setUser } = useSession();
  const navigation = useNavigation();
  const [type, setType] = useState<MethodType>(user.payoutMethod?.type ?? 'upi');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmNumber, setConfirmNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable while active or self-paused; locked while the affiliate team has paused the account.
  if (!canManagePayouts(user)) {
    const pausedByTeam = user.status === 'deactivated';
    return (
      <LuxScreen edges={['top', 'bottom']} eyebrow="PAYOUTS" title="Payout details" action={<CloseButton />}>
        <StatusCard
          tone="neutral"
          label={pausedByTeam ? 'Paused' : 'Not yet'}
          title={pausedByTeam ? 'Your account is paused.' : 'Available after approval.'}
        >
          {pausedByTeam
            ? 'Payout details can’t be changed while the affiliate team has paused your account. Please contact them.'
            : 'You can add payout details once your application is approved.'}
        </StatusCard>
      </LuxScreen>
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
      // The modal may already be gone (swiped down mid-save); going back again would leave the tabs.
      if (navigation.isFocused()) close();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <LuxScreen
      edges={['top', 'bottom']}
      eyebrow="PAYOUTS"
      title="Payout details"
      action={<CloseButton disabled={busy} />}
      subtitle={user.payoutMethod ? `Currently: ${user.payoutMethod.masked}. Saving replaces it.` : 'Where should we send your earnings?'}
    >
      {error ? <LuxErrorBanner>{error}</LuxErrorBanner> : null}
      <LuxChips options={METHODS} value={type} onChange={setType} />

      {type === 'upi' ? (
        <LuxField
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
          <LuxField label="Account holder name" value={accountName} onChangeText={setAccountName} autoComplete="name" maxLength={100} error={show(errors.accountName)} />
          <LuxField
            label="Account number"
            value={accountNumber}
            onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            secureTextEntry
            {...NO_AUTOFILL}
            maxLength={18}
            error={show(errors.accountNumber)}
          />
          <LuxField
            label="Confirm account number"
            value={confirmNumber}
            onChangeText={(v) => setConfirmNumber(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            secureTextEntry
            {...NO_AUTOFILL}
            maxLength={18}
            error={show(errors.confirmNumber)}
          />
          <LuxField
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

      <LuxText>Your details are encrypted and only used by our finance team to send your payouts. We’ll only ever show them masked.</LuxText>
      <LuxButton label="Save payout details" icon="arrow-forward" onPress={save} busy={busy} />
    </LuxScreen>
  );
}
