import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";

// Main tab navigator (post-login)
import MainTabNavigator from "./MainTabNavigator";

// Kiosk
import KioskTimeclockScreen from "../screens/kiosk/KioskTimeclockScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const isKioskMode = useAppStore((s) => s.isKioskMode);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isKioskMode ? (
        <Stack.Screen name="Kiosk" component={KioskTimeclockScreen} />
      ) : user && mustChangePassword ? (
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      ) : user ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
