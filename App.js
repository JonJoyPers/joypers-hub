import React from "react";
import { Text, View } from "react-native";

// Stage 3A: Test ONLY our supabase.js wrapper
import { supabase, isSupabaseConfigured } from "./src/services/supabase";

export default function App() {
  const configured = isSupabaseConfigured();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e", padding: 20 }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>Stage 3A: supabase.js</Text>
      <Text style={{ color: "#6bff6b", fontSize: 16, marginTop: 10 }}>Supabase wrapper loaded OK</Text>
      <Text style={{ color: "#fff", fontSize: 14, marginTop: 8 }}>Configured: {String(configured)}</Text>
    </View>
  );
}
