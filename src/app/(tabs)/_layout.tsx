import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { palette } from '@/components/lux';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'earnings', title: 'Earnings', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'payouts', title: 'Payouts', icon: 'cash-outline', activeIcon: 'cash' },
  { name: 'account', title: 'Account', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Each screen draws its own editorial header.
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.inkMuted,
        tabBarStyle: { backgroundColor: palette.bg, borderTopColor: palette.inputBorder },
        tabBarLabelStyle: { fontSize: 11 },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            // Our tints are plain strings; narrow RN's wider ColorValue for the icon library's types.
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.activeIcon : tab.icon} color={typeof color === 'string' ? color : undefined} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
