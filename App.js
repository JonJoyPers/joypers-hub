import React from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Stage 2B: Test project services (split into two groups)
// Group 1: authStore (also pulls in supabase + notifications)
import { useAuthStore } from "./src/store/authStore";
// Group 2: offlineQueue (pulls in NetInfo + AsyncStorage)
import { startOfflineSync, stopOfflineSync } from "./src/services/offlineQueue";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6a0dad" }}>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>Stage 2B: Services</Text>
          <Text style={{ color: "#fff", fontSize: 14, marginTop: 10 }}>authStore + offlineQueue loaded OK</Text>
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
