import React from "react";
import { Text, View } from "react-native";

// Stage 2F: Test our supabase.js wrapper specifically
// This calls createClient() at module load time — that might be the crash

export default function App() {
  const results = [];

  try {
    const mod = require("./src/services/supabase");
    results.push("supabase.js: OK");
    results.push("isConfigured: " + String(mod.isSupabaseConfigured()));
  } catch (e) {
    results.push("supabase.js: FAIL - " + (e?.message || String(e)));
  }

  try {
    require("./src/services/offlineQueue");
    results.push("offlineQueue.js: OK");
  } catch (e) {
    results.push("offlineQueue.js: FAIL - " + (e?.message || String(e)));
  }

  try {
    require("./src/services/notifications");
    results.push("notifications.js: OK");
  } catch (e) {
    results.push("notifications.js: FAIL - " + (e?.message || String(e)));
  }

  try {
    require("./src/store/authStore");
    results.push("authStore.js: OK");
  } catch (e) {
    results.push("authStore.js: FAIL - " + (e?.message || String(e)));
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e", padding: 20 }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Stage 2F: Wrappers</Text>
      {results.map((r, i) => (
        <Text key={i} style={{ color: r.includes("FAIL") ? "#ff6b6b" : "#6bff6b", fontSize: 16, marginTop: 8 }}>{r}</Text>
      ))}
    </View>
  );
}
