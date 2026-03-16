import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { useAuthStore } from "./src/store/authStore";
import { initSentry } from "./src/services/sentry";
import {
  registerForPushNotifications,
  addNotificationListeners,
} from "./src/services/notifications";
import { startOfflineSync, stopOfflineSync } from "./src/services/offlineQueue";

try {
  initSentry();
} catch (e) {
  console.warn("Sentry init failed:", e);
}

export default function App() {
  const navigationRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    startOfflineSync();
    return () => stopOfflineSync();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    registerForPushNotifications(user.id);

    const cleanup = addNotificationListeners({
      onTap: (data) => {
        if (data?.screen && navigationRef.current) {
          navigationRef.current.navigate(data.screen, data.params);
        }
      },
    });

    return cleanup;
  }, [user?.id]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
