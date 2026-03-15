import React from "react";
import { Text, View } from "react-native";

// Stage 2A: Test framework imports only (no project stores/services)
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ff6600" }}>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>Stage 2A: Framework</Text>
          <Text style={{ color: "#fff", fontSize: 14, marginTop: 10 }}>Navigation + SafeArea loaded OK</Text>
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
