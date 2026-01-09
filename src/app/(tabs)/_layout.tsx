import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Calendar, Users, Camera, MoreHorizontal, Shield } from 'lucide-react-native';
import { useTeamStore } from '@/lib/store';

export default function TabLayout() {
  const isAdmin = useTeamStore((s) => s.isAdmin);

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
          fontSize: 11,
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
              <Camera size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin() ? undefined : null,
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
              }}
            >
              <MoreHorizontal size={22} color={color} />
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
