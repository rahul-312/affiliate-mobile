import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Body, Button, Card, Loading, Screen, Small, Title } from '@/components/ui';
import { colors, font, spacing } from '@/components/theme';
import { apiRequest } from '@/lib/api';
import { formatBps, formatPaise } from '@/lib/money';
import type { Program } from '@/lib/types';
import { useApi } from '@/lib/useApi';

/** The pitch: every number here comes from GET /program, so it always matches the real terms. */
export default function WelcomeScreen() {
  const { data: program, error, loading, refreshing, refresh } = useApi(() => apiRequest<Program>('/program'));

  return (
    <Screen edges={['top', 'bottom']} refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.hero}>
        <Text style={styles.brand}>{program?.name ?? 'Affiliate Hub'}</Text>
        <Text style={styles.headline}>{program?.headline ?? 'Earn by sharing products you love'}</Text>
      </View>

      {loading ? <Loading label="Loading program details… (first load can take ~30s)" /> : null}
      {error ? <Banner tone="danger" title="Couldn't load the program" action={<Button label="Try again" variant="secondary" onPress={refresh} />}>{error}</Banner> : null}

      {program ? (
        <>
          <View style={styles.stats}>
            <Card style={styles.stat}>
              <Text style={styles.statValue}>{formatBps(program.rateBps)}</Text>
              <Small>standard rate · yours is confirmed at approval</Small>
            </Card>
            <Card style={styles.stat}>
              <Text style={styles.statValue}>{formatPaise(program.minPayoutPaise)}</Text>
              <Small>minimum payout</Small>
            </Card>
          </View>

          <Card>
            <Title>How it works</Title>
            {program.steps.map((step, index) => (
              <View key={step} style={styles.listRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Body>{step}</Body>
              </View>
            ))}
          </Card>

          <Card>
            <Title>What counts as a sale</Title>
            {program.qualifyingRules.map((rule) => (
              <View key={rule} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Body>{rule}</Body>
              </View>
            ))}
          </Card>

          <Card>
            <Title>Getting paid</Title>
            <Body>{program.payoutSchedule}. Payouts are sent automatically once your approved earnings reach {formatPaise(program.minPayoutPaise)}, with no requests or paperwork.</Body>
          </Card>
        </>
      ) : null}

      <View style={styles.actions}>
        <Button label="Apply now, it takes a minute" onPress={() => router.push('/signup')} />
        <Button label="I already have an account" variant="secondary" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  brand: { fontSize: font.small, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  headline: { fontSize: font.hero, fontWeight: '800', color: colors.text, lineHeight: 38 },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1 },
  statValue: { fontSize: font.heading, fontWeight: '800', color: colors.primary },
  listRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', paddingRight: spacing.xl },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.info, fontWeight: '700', fontSize: font.small },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
