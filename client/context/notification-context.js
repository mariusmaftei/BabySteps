import { createContext, useState, useContext, useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// Storage keys
const NOTIFICATION_SETTINGS_KEY = "@BabyApp:notificationSettings";
const HEALTH_NOTIFICATION_ID_KEY = "@BabyApp:healthNotificationId";
const CURRENT_SCREEN_KEY = "@BabyApp:currentScreen";

// Configure notifications with custom handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Get the current screen from storage
    let currentScreen = "Activity"; // Default to Activity
    try {
      const savedScreen = await AsyncStorage.getItem(CURRENT_SCREEN_KEY);
      if (savedScreen) {
        currentScreen = savedScreen;
      }
    } catch (error) {
      console.error("Error getting current screen:", error);
    }

    // Only show notifications when in the Activity screen
    const shouldShowAlert = currentScreen === "Activity";

    return {
      shouldShowAlert,
      shouldPlaySound: shouldShowAlert,
      shouldSetBadge: shouldShowAlert,
    };
  },
});

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

// Provider component
export const NotificationProvider = ({ children }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    healthReminders: true,
  });
  const [currentScreen, setCurrentScreen] = useState("Activity");

  // Update current screen in storage
  const updateCurrentScreen = async (screenName) => {
    try {
      await AsyncStorage.setItem(CURRENT_SCREEN_KEY, screenName);
      setCurrentScreen(screenName);
    } catch (error) {
      console.error("Error saving current screen:", error);
    }
  };

  // Request notification permissions
  const requestPermissions = async () => {
    if (!Device.isDevice) {
      console.log("Notifications are not available on simulator/emulator");
      return false;
    }

    try {
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
        // Request permissions if turning on
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

  // Schedule vaccination reminders
  const scheduleVaccinationReminders = async (
    dueVaccines,
    childName = "Your child"
  ) => {
    if (!settings.enabled || !settings.healthReminders || !permissionGranted) {
      console.log(
        "Cannot schedule reminders: notifications disabled or permission not granted"
      );
      return null;
    }

    try {
      // Cancel any existing reminders first
      await cancelVaccinationReminders();

      // Create notification content based on due vaccines
      const vaccineCount = dueVaccines?.length || 0;
      const content = {
        title: `Vaccination Reminder for ${childName}`,
        body:
          vaccineCount === 1
            ? `${childName} has 1 vaccination due this month`
            : `${childName} has ${vaccineCount} vaccinations due this month`,
        data: { screen: "HealthDetails", type: "vaccination" },
      };

      // Schedule a daily reminder at 12:00 PM
      const trigger = {
        hour: 12,
        minute: 0,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      // Save the notification ID
      await AsyncStorage.setItem(HEALTH_NOTIFICATION_ID_KEY, notificationId);
      console.log("Vaccination reminder scheduled successfully");
      return notificationId;
    } catch (error) {
      console.error("Error scheduling vaccination reminder:", error);
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
      return true;
    } catch (error) {
      console.error("Error canceling all notifications:", error);
      return false;
    }
  };

  // Initialize notification settings and permissions
  useEffect(() => {
    loadSettings();
    requestPermissions();

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
  }, []);

  // Context value
  const value = {
    settings,
    permissionGranted,
    currentScreen,
    updateCurrentScreen,
    toggleNotifications,
    toggleHealthReminders,
    requestPermissions,
    scheduleVaccinationReminders,
    cancelVaccinationReminders,
    cancelAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
