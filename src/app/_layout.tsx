import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useTeamStore } from '@/lib/store';
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
  const updateNotificationPreferences = useTeamStore((s) => s.updateNotificationPreferences);
  const addNotification = useTeamStore((s) => s.addNotification);
  const navigationRef = useNavigationContainerRef();
  const [isReady, setIsReady] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (navigationRef?.isReady()) {
      setIsReady(true);
    }
  }, [navigationRef]);

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

    // Listen for incoming notifications while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // Could add to in-app notifications here
      const data = notification.request.content.data;
      if (data?.type === 'game_reminder' && data?.gameId) {
        addNotification({
          id: `notif-${Date.now()}`,
          type: 'game_reminder',
          title: notification.request.content.title || 'Game Reminder',
          message: notification.request.content.body || '',
          gameId: data.gameId as string,
          toPlayerId: currentPlayerId,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      // Navigate to game if it's a game notification
      if (data?.gameId && isReady) {
        router.push(`/game/${data.gameId}`);
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
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, segments, isReady, router]);

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
