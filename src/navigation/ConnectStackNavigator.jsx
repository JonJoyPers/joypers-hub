import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ConnectHubScreen from "../screens/connect/ConnectHubScreen";
import ChatScreen from "../screens/messages/ChatScreen";

const Stack = createNativeStackNavigator();

export default function ConnectStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConnectHub" component={ConnectHubScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
