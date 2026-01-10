import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and return the Expo Push Token
 * This token is what you'd send to a backend server to target this device
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
    });
  }

  try {
    // Get the Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.log('No project ID found - using device token only');
      // Still works for local notifications
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('Expo Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.log('Error getting push token:', error);
    return null;
  }
}

/**
 * Schedule a local notification for a game reminder
 */
export async function scheduleGameReminder(
  gameId: string,
  title: string,
  body: string,
  triggerDate: Date
): Promise<string | null> {
  // Don't schedule if the date is in the past
  if (triggerDate <= new Date()) {
    console.log('Cannot schedule notification in the past');
    return null;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { gameId, type: 'game_reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log('Scheduled notification:', identifier);
    return identifier;
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule a reminder 1 hour before a game
 */
export async function scheduleGameReminderHourBefore(
  gameId: string,
  opponent: string,
  gameDate: Date,
  gameTime: string
): Promise<string | null> {
  const reminderDate = new Date(gameDate.getTime() - 60 * 60 * 1000); // 1 hour before

  return scheduleGameReminder(
    gameId,
    'Game in 1 Hour!',
    `Get ready! You're playing vs ${opponent} at ${gameTime}`,
    reminderDate
  );
}

/**
 * Schedule a reminder 1 day before a game
 */
export async function scheduleGameReminderDayBefore(
  gameId: string,
  opponent: string,
  gameDate: Date,
  gameTime: string
): Promise<string | null> {
  const reminderDate = new Date(gameDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before

  return scheduleGameReminder(
    gameId,
    'Game Tomorrow',
    `Reminder: You have a game vs ${opponent} tomorrow at ${gameTime}`,
    reminderDate
  );
}

/**
 * Cancel a scheduled notification by identifier
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all pending scheduled notifications
 */
export async function getPendingNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Send an immediate local notification (useful for testing)
 */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'Push notifications are working!',
      data: { type: 'test' },
    },
    trigger: null, // Sends immediately
  });
}

/**
 * Set the badge count on the app icon
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear the badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
