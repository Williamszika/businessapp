import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

import { useAuth, useData } from '@/store';
import { font, useTheme } from '@/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IoniconName) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? name : (`${name}-outline` as IoniconName)} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const userId = useAuth((s) => s.user?.id);
  const unread = useData((s) => s.messages.filter((m) => !m.read && m.senderId !== userId).length);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.select({ ios: 88, android: 64, default: 64 }),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
        tabBarItemStyle: { paddingTop: 2 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="ventes" options={{ title: 'Ventes', tabBarIcon: tabIcon('cart') }} />
      <Tabs.Screen name="stock" options={{ title: 'Stock', tabBarIcon: tabIcon('cube') }} />
      <Tabs.Screen name="equipe" options={{ title: 'Équipe', tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon('chatbubble'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontFamily: font.semibold, fontSize: 10 },
        }}
      />
    </Tabs>
  );
}
