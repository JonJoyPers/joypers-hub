import React from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Stage 2C: Test ONLY offlineQueue (NetInfo + AsyncStorage + supabase)
import { startOfflineSync, stopOfflineSync } from "./src/services/offlineQueue";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#228B22" }}>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>Stage 2C: offlineQueue</Text>
          <Text style={{ color: "#fff", fontSize: 14, marginTop: 10 }}>offlineQueue loaded OK</Text>
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
