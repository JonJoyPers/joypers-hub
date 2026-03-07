import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ConversationListScreen from "../screens/messages/ConversationListScreen";
import ChatScreen from "../screens/messages/ChatScreen";

const Stack = createNativeStackNavigator();

export default function MessagesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversationList" component={ConversationListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
