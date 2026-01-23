import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTeamStore, useStoreHydrated } from '@/lib/store';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export const unstable_settings = {
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Custom dark theme for hockey app
const HockeyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0f172a',
    card: '#1e293b',
    text: '#ffffff',
    border: '#334155',
    primary: '#67e8f9',
  },
};

function AuthNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const isLoggedIn = useTeamStore((s) => s.isLoggedIn);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const logout = useTeamStore((s) => s.logout);
  const updateNotificationPreferences = useTeamStore((s) => s.updateNotificationPreferences);
  const addNotification = useTeamStore((s) => s.addNotification);
  const navigationRef = useNavigationContainerRef();
  const [isReady, setIsReady] = useState(false);
  const isHydrated = useStoreHydrated();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Check immediately and on interval until ready
    const checkReady = () => {
      if (navigationRef?.isReady() && !isReady) {
        console.log('Navigation is ready');
        setIsReady(true);
      }
    };

    checkReady();
    const interval = setInterval(checkReady, 100);

    return () => clearInterval(interval);
  }, [navigationRef, isReady]);

  // Validate login state on hydration - ensure logged in user actually exists
  // This prevents stale login state from persisting across builds
  useEffect(() => {
    if (!isHydrated) return;

    // Additional safety: if somehow isLoggedIn is true but no players exist, force logout
    if (isLoggedIn && players.length === 0) {
      console.log('No players exist but isLoggedIn is true, forcing logout');
      logout();
      return;
    }

    if (isLoggedIn && currentPlayerId) {
      // Check if the player still exists in the store
      const playerExists = players.some((p) => p.id === currentPlayerId);
      if (!playerExists) {
        console.log('Logged in player not found, forcing logout');
        logout();
      }
    } else if (isLoggedIn && !currentPlayerId) {
      // Logged in but no player ID - invalid state
      console.log('Invalid login state (no player ID), forcing logout');
      logout();
    }
  }, [isHydrated, isLoggedIn, currentPlayerId, players, logout]);

  // Hide splash screen once hydration is complete
  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  // Register for push notifications when logged in
  useEffect(() => {
    if (!isLoggedIn || !currentPlayerId) return;

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token && currentPlayerId) {
        // Save the push token to the player's preferences
        updateNotificationPreferences(currentPlayerId, { pushToken: token });
        console.log('Push token registered for player:', currentPlayerId);
      }
    });

    // Check for notification that opened the app (when app was completely closed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('App opened from notification:', response);
        const data = response.notification.request.content.data;
        if (data?.gameId && isReady) {
          router.push(`/game/${data.gameId}`);
        }
      }
    });

    // Listen for incoming notifications while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      const data = notification.request.content.data;
      const notificationType = data?.type as string;

      // Add to in-app notifications for game-related notifications
      if ((notificationType === 'game_reminder' || notificationType === 'game_invite') && data?.gameId) {
        addNotification({
          id: `notif-${Date.now()}`,
          type: notificationType as 'game_reminder' | 'game_invite',
          title: notification.request.content.title || (notificationType === 'game_invite' ? 'New Game Added!' : 'Game Reminder'),
          message: notification.request.content.body || '',
          gameId: data.gameId as string,
          toPlayerId: currentPlayerId,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    });

    // Listen for notification taps (when app is in background or foreground)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      // Navigate to game if it's a game notification
      if (data?.gameId) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          if (isReady) {
            router.push(`/game/${data.gameId}`);
          }
        }, 100);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isLoggedIn, currentPlayerId, isReady]);

  useEffect(() => {
    // Wait for navigation and hydration before making auth decisions
    if (!isReady || !isHydrated) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'create-team' || segments[0] === 'register';
    console.log('AUTH CHECK - isLoggedIn:', isLoggedIn, 'inAuthGroup:', inAuthGroup, 'segments:', segments);

    // Always redirect to login if not logged in and not in auth flow
    if (!isLoggedIn) {
      if (!inAuthGroup) {
        console.log('NOT LOGGED IN - redirecting to login');
        router.replace('/login');
      }
    } else if (inAuthGroup) {
      console.log('LOGGED IN - redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, segments, isReady, isHydrated, router]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="create-team" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="game/[id]"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="feature-request"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="report-bug"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={HockeyDarkTheme}>
      <AuthNavigator />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
