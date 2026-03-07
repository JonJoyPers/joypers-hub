import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and save token to Supabase.
 * Call once after user logs in.
 */
export async function registerForPushNotifications(employeeId) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const token = tokenData.data;

  // Save token to Supabase
  if (isSupabaseConfigured() && employeeId) {
    await savePushToken(employeeId, token);
  }

  return token;
}

/**
 * Save push token to Supabase (upsert by token).
 */
async function savePushToken(employeeId, token) {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        employee_id: employeeId,
        token,
        platform: Platform.OS,
      },
      { onConflict: 'token' }
    );

  if (error) {
    console.error('Failed to save push token:', error.message);
  }
}

/**
 * Remove push token on logout.
 */
export async function unregisterPushToken() {
  if (!isSupabaseConfigured()) return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    await supabase
      .from('push_tokens')
      .delete()
      .eq('token', tokenData.data);
  } catch (err) {
    // Token may not exist, that's fine
  }
}

/**
 * Add listeners for incoming notifications.
 * Returns cleanup function.
 */
export function addNotificationListeners({ onReceive, onTap }) {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onReceive?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    onTap?.(data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
