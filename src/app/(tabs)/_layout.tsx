import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Calendar, Users, MessageSquare, DollarSign, MoreHorizontal, Shield, ImageIcon } from 'lucide-react-native';
import { useTeamStore } from '@/lib/store';

export default function TabLayout() {
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players) ?? [];
  const notifications = useTeamStore((s) => s.notifications) ?? [];
  const getUnreadChatCount = useTeamStore((s) => s.getUnreadChatCount);

  // Derive admin status from reactive state
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isAdminUser = currentPlayer?.roles?.includes('admin') ?? false;

  // Count unread notifications for current player
  const unreadNotificationCount = notifications.filter(
    (n) => n.toPlayerId === currentPlayerId && !n.read
  ).length;

  // Count unread chat messages
  const unreadChatCount = currentPlayerId ? getUnreadChatCount(currentPlayerId) : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#67e8f9',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(103, 232, 249, 0.15)' : 'transparent',
                borderRadius: 10,
                padding: 6,
              }}
            >
              <Calendar size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: 'Roster',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(103, 232, 249, 0.15)' : 'transparent',
                borderRadius: 10,
                padding: 6,
              }}
            >
              <Users size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(103, 232, 249, 0.15)' : 'transparent',
                borderRadius: 10,
                padding: 6,
                position: 'relative',
              }}
            >
              <MessageSquare size={22} color={color} />
              {unreadChatCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#ef4444',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: 'Photos',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(103, 232, 249, 0.15)' : 'transparent',
                borderRadius: 10,
                padding: 6,
              }}
            >
              <ImageIcon size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                borderRadius: 10,
                padding: 6,
              }}
            >
              <DollarSign size={22} color={focused ? '#22c55e' : color} />
            </View>
          ),
          tabBarActiveTintColor: '#22c55e',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdminUser ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                borderRadius: 10,
                padding: 6,
              }}
            >
              <Shield size={22} color={focused ? '#a78bfa' : color} />
            </View>
          ),
          tabBarActiveTintColor: '#a78bfa',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(103, 232, 249, 0.15)' : 'transparent',
                borderRadius: 10,
                padding: 6,
                position: 'relative',
              }}
            >
              <MoreHorizontal size={22} color={color} />
              {unreadNotificationCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#ef4444',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null, // Hide this tab
        }}
      />
    </Tabs>
  );
}
