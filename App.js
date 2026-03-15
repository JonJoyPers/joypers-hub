import React from "react";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ff0000" }}>
      <Text style={{ color: "#ffffff", fontSize: 32, fontWeight: "bold" }}>HELLO</Text>
      <Text style={{ color: "#ffffff", fontSize: 16, marginTop: 10 }}>If you see this, JS is running</Text>
    </View>
  );
}
