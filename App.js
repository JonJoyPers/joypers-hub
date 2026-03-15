import React from "react";
import { Text, View } from "react-native";

// Stage 2D: Test the 3 deps of offlineQueue individually
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "./src/services/supabase";

export default function App() {
  const [results, setResults] = React.useState("Testing...");

  React.useEffect(() => {
    const checks = [];
    try { AsyncStorage; checks.push("AsyncStorage OK"); } catch (e) { checks.push("AsyncStorage FAIL: " + e.message); }
    try { NetInfo; checks.push("NetInfo OK"); } catch (e) { checks.push("NetInfo FAIL: " + e.message); }
    try { supabase; checks.push("Supabase OK"); } catch (e) { checks.push("Supabase FAIL: " + e.message); }
    setResults(checks.join("\n"));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#B22222" }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>Stage 2D: Deps</Text>
      <Text style={{ color: "#fff", fontSize: 14, marginTop: 10, textAlign: "center" }}>{results}</Text>
    </View>
  );
}
