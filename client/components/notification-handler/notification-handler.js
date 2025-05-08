"use client";

import { useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import { setupNotificationListeners } from "../../services/notification-service";

// Check if running on emulator
const isRunningOnEmulator = !Device.isDevice;

// Check if using Expo Go
const isUsingExpoGo = Constants.appOwnership === "expo";

// Completely disable notifications on Android emulators with Expo Go
const shouldDisableNotifications =
  Platform.OS === "android" && isRunningOnEmulator && isUsingExpoGo;

const NotificationHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Skip notification setup on Android emulators with Expo Go
    if (shouldDisableNotifications) {
      return;
    }

    // Set up notification listeners
    const cleanupListeners = setupNotificationListeners(navigation);

    // Clean up listeners on unmount
    return () => {
      cleanupListeners();
    };
  }, [navigation]);

  // This component doesn't render anything
  return null;
};

export default NotificationHandler;
