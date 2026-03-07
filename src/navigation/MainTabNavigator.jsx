import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet } from "react-native";
import {
  Clock,
  BookOpen,
  Megaphone,
  MessageSquare,
  User,
} from "lucide-react-native";
import { COLORS } from "../theme/colors";
import { useAuthStore } from "../store/authStore";
import { useMessageStore } from "../store/messageStore";

// Screens & Navigators
import BulletinScreen from "../screens/bulletin/BulletinScreen";
import AcademyScreen from "../screens/academy/AcademyScreen";
import ConnectStackNavigator from "./ConnectStackNavigator";
import WorkStackNavigator from "./WorkStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";

const Tab = createBottomTabNavigator();

const TAB_BAR_BG = COLORS.charcoalMid;
const ACTIVE = COLORS.teal;
const INACTIVE = COLORS.creamMuted;

function TabIcon({ Icon, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={18} color={color} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

export default function MainTabNavigator() {
  const user = useAuthStore((s) => s.user);
  const totalUnread = useMessageStore((s) => s.getTotalUnread(user?.id));

  return (
    <Tab.Navigator
      initialRouteName="Bulletin"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: styles.label,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Bulletin"
        component={BulletinScreen}
        options={{
          tabBarLabel: "Bulletin",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Megaphone} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Connect"
        component={ConnectStackNavigator}
        options={{
          tabBarLabel: "Connect",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={MessageSquare} color={color} focused={focused} />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.teal,
            color: COLORS.charcoal,
            fontSize: 10,
            fontWeight: "800",
            minWidth: 18,
            height: 18,
            lineHeight: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tab.Screen
        name="Work"
        component={WorkStackNavigator}
        options={{
          tabBarLabel: "Work",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Clock} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Academy"
        component={AcademyScreen}
        options={{
          tabBarLabel: "Academy",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={BookOpen} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: TAB_BAR_BG,
    borderTopColor: COLORS.charcoalLight,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 26,
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: COLORS.teal + "22",
  },
});
