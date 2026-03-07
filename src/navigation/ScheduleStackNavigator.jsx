import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ScheduleScreen from "../screens/schedule/ScheduleScreen";
import UserScheduleScreen from "../screens/schedule/UserScheduleScreen";

const Stack = createNativeStackNavigator();

export default function ScheduleStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScheduleMain" component={ScheduleScreen} />
      <Stack.Screen name="UserSchedule" component={UserScheduleScreen} />
    </Stack.Navigator>
  );
}
