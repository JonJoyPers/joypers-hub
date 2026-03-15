import React from "react";
import { Text, View } from "react-native";

// Stage 2E: Test each dep with require() inside try-catch
// This way if one crashes, the others still get tested

export default function App() {
  const results = [];

  try {
    require("@react-native-async-storage/async-storage");
    results.push("AsyncStorage: OK");
  } catch (e) {
    results.push("AsyncStorage: FAIL - " + (e?.message || String(e)));
  }

  try {
    require("@react-native-community/netinfo");
    results.push("NetInfo: OK");
  } catch (e) {
    results.push("NetInfo: FAIL - " + (e?.message || String(e)));
  }

  try {
    require("@supabase/supabase-js");
    results.push("Supabase JS: OK");
  } catch (e) {
    results.push("Supabase JS: FAIL - " + (e?.message || String(e)));
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e", padding: 20 }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Stage 2E: Dep Check</Text>
      {results.map((r, i) => (
        <Text key={i} style={{ color: r.includes("FAIL") ? "#ff6b6b" : "#6bff6b", fontSize: 16, marginTop: 8 }}>{r}</Text>
      ))}
    </View>
  );
}
