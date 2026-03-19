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
 *
 * Wrapped in try/catch so a failure here never crashes the app.
 */
export async function registerForPushNotifications(employeeId) {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check/request permissions — wrapped individually so a rejection
    // (e.g. user tapping "Don't Allow") never throws.
    let finalStatus;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (permErr) {
      console.warn('Push permission check failed:', permErr);
      return null;
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

    // Get the Expo push token.
    // projectId is required for EAS builds; if missing (e.g. Expo Go)
    // we bail out gracefully instead of crashing.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn(
        'EAS projectId not found in app config — push token registration skipped. ' +
        'This is expected in Expo Go; push notifications require an EAS build.'
      );
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Save token to Supabase
    if (isSupabaseConfigured() && employeeId) {
      await savePushToken(employeeId, token);
    }

    return token;
  } catch (err) {
    // Never let a push-notification failure take down the app
    console.error('registerForPushNotifications failed:', err);
    return null;
  }
}

/**
 * Save push token to Supabase (upsert by token).
 *
 * When the same token is re-registered (same device, app restart) this
 * updates the employee_id and platform so tokens stay fresh. The
 * updated_at column is set explicitly so stale-token cleanup queries
 * can reference it.
 */
async function savePushToken(employeeId, token) {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          employee_id: employeeId,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    if (error) {
      console.error('Failed to save push token:', error.message);
    }
  } catch (err) {
    console.error('savePushToken threw:', err);
  }
}

/**
 * Remove push token on logout.
 */
export async function unregisterPushToken() {
  if (!isSupabaseConfigured()) return;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase
      .from('push_tokens')
      .delete()
      .eq('token', tokenData.data);
  } catch (err) {
    // Token may not exist or device is simulator — that's fine
    console.log('unregisterPushToken skipped:', err.message || err);
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

/**
 * Handle a notification tap that arrived while the app was killed.
 * Call once during app startup with the navigation ref.
 */
export async function getInitialNotification() {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      return response.notification.request.content.data;
    }
  } catch (err) {
    console.warn('getInitialNotification failed:', err);
  }
  return null;
}
