import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkHubScreen from "../screens/work/WorkHubScreen";
import UserScheduleScreen from "../screens/schedule/UserScheduleScreen";
import LeaveScreen from "../screens/leave/LeaveScreen";

const Stack = createNativeStackNavigator();

export default function WorkStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkHub" component={WorkHubScreen} />
      <Stack.Screen name="UserSchedule" component={UserScheduleScreen} />
      <Stack.Screen name="Leave" component={LeaveScreen} />
    </Stack.Navigator>
  );
}
