import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/profile/ProfileScreen";
import AdminScreen from "../screens/admin/AdminScreen";
import AdminEditUserScreen from "../screens/admin/AdminEditUserScreen";
import StoreManualScreen from "../screens/manual/StoreManualScreen";
import ManualAcknowledgmentsScreen from "../screens/manual/ManualAcknowledgmentsScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="AdminPanel" component={AdminScreen} />
      <Stack.Screen name="AdminEditUser" component={AdminEditUserScreen} />
      <Stack.Screen name="StoreManual" component={StoreManualScreen} />
      <Stack.Screen name="ManualAcknowledgments" component={ManualAcknowledgmentsScreen} />
    </Stack.Navigator>
  );
}
