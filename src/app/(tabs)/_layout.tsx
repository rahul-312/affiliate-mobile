import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { colors } from '@/components/theme';

const TABS: { name: string; title: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'earnings', title: 'Earnings', icon: 'wallet-outline' },
  { name: 'payouts', title: 'Payouts', icon: 'cash-outline' },
  { name: 'account', title: 'Account', icon: 'person-circle-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            // Our tints are plain strings; narrow RN's wider ColorValue for the icon library's types.
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} color={typeof color === 'string' ? color : undefined} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
