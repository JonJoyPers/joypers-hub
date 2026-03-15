import React, { useEffect, useRef } from "react";
import { Text, View } from "react-native";

// Stage 1: Test all service/store imports
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { useAuthStore } from "./src/store/authStore";
import { initSentry } from "./src/services/sentry";
import {
  registerForPushNotifications,
  addNotificationListeners,
} from "./src/services/notifications";
import { startOfflineSync, stopOfflineSync } from "./src/services/offlineQueue";

// NOT importing RootNavigator yet — testing if services/stores crash

try {
  initSentry();
} catch (e) {
  console.warn("Sentry init failed:", e);
}

export default function App() {
  const [status, setStatus] = React.useState("Loading...");

  useEffect(() => {
    try {
      useAuthStore.getState().initialize();
      setStatus("Stores OK");
    } catch (e) {
      setStatus("Store error: " + (e?.message || String(e)));
    }
  }, []);

  useEffect(() => {
    try {
      startOfflineSync();
      return () => stopOfflineSync();
    } catch (e) {
      setStatus("Sync error: " + (e?.message || String(e)));
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#008080" }}>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>Stage 1: Services</Text>
            <Text style={{ color: "#fff", fontSize: 16, marginTop: 10 }}>{status}</Text>
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
