import { useState, useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Location from "expo-location";

export function useLocation() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionGranted(status === "granted");
    })();
  }, []);

  const getLocation = async () => {
    if (!permissionGranted) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "GPS location is required for remote clock-in. Please enable location access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openSettings();
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return null;
      }
      setPermissionGranted(true);
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch {
      Alert.alert("Location Error", "Unable to get your current location. Please try again.");
      return null;
    }
  };

  return { permissionGranted, getLocation };
}
