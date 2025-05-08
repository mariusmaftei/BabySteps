"use client";

import { createContext, useState, useContext, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import Constants from "expo-constants";

// Storage keys
const NOTIFICATION_SETTINGS_KEY = "@BabyApp:notificationSettings";
const HEALTH_NOTIFICATION_ID_KEY = "@BabyApp:healthNotificationId";
const CURRENT_SCREEN_KEY = "@BabyApp:currentScreen";

// Check if running on emulator
const isRunningOnEmulator = !Device.isDevice;

// Check if using Expo Go
const isUsingExpoGo = Constants.appOwnership === "expo";

// Completely disable notifications on Android emulators with Expo Go
const shouldDisableNotifications =
  Platform.OS === "android" && isRunningOnEmulator && isUsingExpoGo;

// Only configure notifications if not disabled
if (!shouldDisableNotifications) {
  // Update the notification handler to use the non-deprecated properties
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Create notification channel for Android
const createNotificationChannel = async () => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("baby-app-notifications", {
      name: "Baby App Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("baby-app-reminders", {
      name: "Baby App Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }
};

// Create context
const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

// Create a dummy provider for when notifications are disabled
const DummyNotificationProvider = ({ children }) => {
  const dummyValue = {
    settings: { enabled: false, healthReminders: false },
    permissionGranted: false,
    currentScreen: "Activity",
    expoPushToken: "",
    notification: undefined,
    updateCurrentScreen: () => {},
    toggleNotifications: () => Promise.resolve(false),
    toggleHealthReminders: () => Promise.resolve(false),
    requestPermissions: () => Promise.resolve(false),
    registerForPushNotifications: () => Promise.resolve(null),
    scheduleVaccinationReminders: () => Promise.resolve(null),
    scheduleTestNotification: () => Promise.resolve(null),
    cancelVaccinationReminders: () => Promise.resolve(true),
    cancelAllNotifications: () => Promise.resolve(true),
  };

  return (
    <NotificationContext.Provider value={dummyValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Provider component - updated for SDK 53
const RealNotificationProvider = ({ children }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    healthReminders: true,
  });
  const [currentScreen, setCurrentScreen] = useState("Activity");
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(undefined);

  // Refs for notification listeners
  const notificationListener = useRef();
  const responseListener = useRef();

  // Update current screen in storage
  const updateCurrentScreen = async (screenName) => {
    try {
      await AsyncStorage.setItem(CURRENT_SCREEN_KEY, screenName);
      setCurrentScreen(screenName);
    } catch (error) {
      console.error("Error saving current screen:", error);
    }
  };

  // Request notification permissions - updated for SDK 53
  const requestPermissions = async () => {
    // On emulators, we'll assume permissions are granted for local notifications
    if (isRunningOnEmulator) {
      setPermissionGranted(true);
      return true;
    }

    try {
      // Create notification channels for Android
      if (Platform.OS === "android") {
        await createNotificationChannel();
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If we don't have permission yet, ask for it
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Update permission state
      const granted = finalStatus === "granted";
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      setPermissionGranted(false);
      return false;
    }
  };

  // Update the registerForPushNotifications function to handle missing project ID gracefully
  const registerForPushNotifications = async () => {
    // Skip push token registration on emulators or Expo Go with SDK 53
    if (isRunningOnEmulator || (isUsingExpoGo && Platform.OS === "android")) {
      return null;
    }

    try {
      // Request permissions first
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      // Get project ID from Constants
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      // If no project ID is found, just log a message and return null without showing an error
      if (!projectId) {
        console.log(
          "No project ID found. Push notifications will not be available, but local notifications will still work."
        );
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setExpoPushToken(tokenData.data);
      console.log("Expo push token:", tokenData.data);
      return tokenData.data;
    } catch (error) {
      // Silently handle the error
      console.log("Push notifications not available");
      return null;
    }
  };

  // Save notification settings to storage
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error("Error saving notification settings:", error);
      return false;
    }
  };

  // Load notification settings from storage
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        NOTIFICATION_SETTINGS_KEY
      );
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  // Toggle all notifications
  const toggleNotifications = async (value) => {
    const newSettings = { ...settings, enabled: value };
    const success = await saveSettings(newSettings);

    if (success) {
      if (!value) {
        // Cancel all notifications if turning off
        await cancelAllNotifications();
      } else {
        // Request permissions if turning on (skip on emulator)
        if (!isRunningOnEmulator) {
          const hasPermission = await requestPermissions();
          if (!hasPermission) {
            Alert.alert(
              "Permission Required",
              "Please enable notifications in your device settings to receive reminders.",
              [{ text: "OK" }]
            );
          }
        }
      }
    }

    return success;
  };

  // Toggle health reminders
  const toggleHealthReminders = async (value) => {
    const newSettings = { ...settings, healthReminders: value };
    const success = await saveSettings(newSettings);

    if (success && !value) {
      // Cancel health notifications if turning off
      await cancelVaccinationReminders();
    }

    return success;
  };

  // Update the scheduleVaccinationReminders function
  const scheduleVaccinationReminders = async (
    dueVaccines,
    childName = "Your child"
  ) => {
    if (!settings.enabled || !settings.healthReminders) {
      console.log("Cannot schedule reminders: notifications disabled");
      return null;
    }

    // On emulators, we don't need to check for permission
    if (!isRunningOnEmulator && !permissionGranted) {
      console.log("Cannot schedule reminders: permission not granted");
      return null;
    }

    try {
      // Cancel any existing reminders first
      await cancelVaccinationReminders();

      // Create notification content based on due vaccines
      const vaccineCount = dueVaccines?.length || 0;

      // Schedule local notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Vaccination Reminder for ${childName}`,
          body:
            vaccineCount === 1
              ? `${childName} has 1 vaccination due this month`
              : `${childName} has ${vaccineCount} vaccinations due this month`,
          data: { screen: "HealthScreen", type: "vaccination" },
        },
        trigger: {
          hour: 12,
          minute: 0,
          repeats: true,
        },
      });

      // Save the notification ID
      await AsyncStorage.setItem(HEALTH_NOTIFICATION_ID_KEY, notificationId);
      console.log(
        "Vaccination reminder scheduled successfully with ID:",
        notificationId
      );
      return notificationId;
    } catch (error) {
      console.error("Error scheduling vaccination reminder:", error);
      return null;
    }
  };

  // Update the scheduleTestNotification function
  const scheduleTestNotification = async () => {
    // On emulators, we don't need to check for permission
    if (!isRunningOnEmulator && !permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive test notifications.",
          [{ text: "OK" }]
        );
        return null;
      }
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification to verify notifications are working",
          data: { screen: "ActivityMain" },
        },
        trigger: null, // null means send immediately
      });
      console.log("Test notification scheduled with ID:", notificationId);
      return notificationId;
    } catch (error) {
      console.error("Error scheduling test notification:", error);
      return null;
    }
  };

  // Cancel vaccination reminders
  const cancelVaccinationReminders = async () => {
    try {
      const notificationId = await AsyncStorage.getItem(
        HEALTH_NOTIFICATION_ID_KEY
      );
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await AsyncStorage.removeItem(HEALTH_NOTIFICATION_ID_KEY);
      }
      console.log("Vaccination reminders cancelled");
      return true;
    } catch (error) {
      console.error("Error cancelling vaccination reminders:", error);
      return false;
    }
  };

  // Cancel all notifications
  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(HEALTH_NOTIFICATION_ID_KEY);
      console.log("All notifications cancelled");
      return true;
    } catch (error) {
      console.error("Error canceling all notifications:", error);
      return false;
    }
  };

  // Also update the useEffect to not show alerts for missing project ID
  useEffect(() => {
    console.log("NotificationProvider - Initializing");

    // Create notification channels for Android
    if (Platform.OS === "android") {
      createNotificationChannel();
    }

    loadSettings();

    // On emulators, we'll assume permissions are granted for local notifications
    if (isRunningOnEmulator) {
      setPermissionGranted(true);
    } else {
      requestPermissions();
    }

    // Try to register for push notifications if on a physical device
    // but don't show errors if it fails
    if (!isRunningOnEmulator && !(isUsingExpoGo && Platform.OS === "android")) {
      registerForPushNotifications().catch(() => {
        // Silently handle any errors
      });
    }

    // Load the current screen from storage
    const loadCurrentScreen = async () => {
      try {
        const savedScreen = await AsyncStorage.getItem(CURRENT_SCREEN_KEY);
        if (savedScreen) {
          setCurrentScreen(savedScreen);
        }
      } catch (error) {
        console.error("Error loading current screen:", error);
      }
    };

    loadCurrentScreen();

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received:", response);
        const data = response.notification.request.content.data;

        // If the notification has a screen to navigate to, update the current screen
        if (data && data.screen) {
          updateCurrentScreen(data.screen);
        }
      });

    // Clean up listeners on unmount using the correct method
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Context value
  const value = {
    settings,
    permissionGranted,
    currentScreen,
    expoPushToken,
    notification,
    updateCurrentScreen,
    toggleNotifications,
    toggleHealthReminders,
    requestPermissions,
    registerForPushNotifications,
    scheduleVaccinationReminders,
    scheduleTestNotification,
    cancelVaccinationReminders,
    cancelAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Export the appropriate provider based on whether notifications are disabled
export const NotificationProvider = shouldDisableNotifications
  ? DummyNotificationProvider
  : RealNotificationProvider;

export default NotificationContext;
