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
import { Text, View } from "react-native";

try {
  initSentry();
} catch (e) {
  console.warn("Sentry init failed:", e);
}

export default function App() {
  const navigationRef = useRef(null);
  const [startupError, setStartupError] = React.useState(null);

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    try {
      useAuthStore.getState().initialize();
    } catch (e) {
      setStartupError(e?.message || String(e));
    }
  }, []);

  // Start offline sync listener
  useEffect(() => {
    startOfflineSync();
    return () => stopOfflineSync();
  }, []);

  // Register for push notifications when user logs in
  useEffect(() => {
    if (!user?.id) return;

    registerForPushNotifications(user.id);

    const cleanup = addNotificationListeners({
      onTap: (data) => {
        // Navigate based on notification type
        if (data?.screen && navigationRef.current) {
          navigationRef.current.navigate(data.screen, data.params);
        }
      },
    });

    return cleanup;
  }, [user?.id]);

  if (startupError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#1a1a2e" }}>
        <Text style={{ color: "#ff6b6b", fontSize: 18, fontWeight: "bold" }}>Startup Error</Text>
        <Text style={{ color: "#fff", fontSize: 14, marginTop: 10, textAlign: "center" }}>{startupError}</Text>
      </View>
    );
  }

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
