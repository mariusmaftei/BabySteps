import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Storage keys
const NOTIFICATION_SETTINGS_KEY = "@BabyApp:notificationSettings";
const HEALTH_NOTIFICATION_ID_KEY = "@BabyApp:healthNotificationId";

// Check if running on emulator
const isRunningOnEmulator = !Device.isDevice;

// Check if using Expo Go
const isUsingExpoGo = Constants.appOwnership === "expo";

// Completely disable notifications on Android emulators with Expo Go
const shouldDisableNotifications =
  Platform.OS === "android" && isRunningOnEmulator && isUsingExpoGo;

// Only configure notifications if not disabled
if (!shouldDisableNotifications) {
  // Configure notifications for SDK 53 with the correct properties
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

    console.log("Notification channels created");
  }
};

// Request permissions - updated for SDK 53
export const requestNotificationPermissions = async () => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return true;
  }

  // Create notification channels for Android
  if (Platform.OS === "android") {
    await createNotificationChannel();
  }

  // If on emulator, just return true for local notifications
  if (isRunningOnEmulator) {
    return true;
  }

  // Get existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get notification permissions");
    return false;
  }

  return true;
};

// Save notification settings to storage
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(settings)
    );
    return true;
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return false;
  }
};

// Load notification settings from storage
export const loadNotificationSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settings
      ? JSON.parse(settings)
      : { enabled: true, healthReminders: true };
  } catch (error) {
    console.error("Error loading notification settings:", error);
    return { enabled: true, healthReminders: true };
  }
};

// Schedule a health vaccination reminder - updated for SDK 53
export const scheduleVaccinationReminder = async (childName, dueVaccines) => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return null;
  }

  // Cancel any existing health notification first
  await cancelHealthNotification();

  // Check if we have permission (skip actual permission check on emulator)
  const hasPermission = isRunningOnEmulator
    ? true
    : await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  // Create the notification content
  const vaccineCount = dueVaccines.length;

  try {
    // Schedule local notification using the correct format for SDK 53
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Vaccination Reminder for ${childName}`,
        body:
          vaccineCount === 1
            ? `${childName} has 1 vaccination due this month`
            : `${childName} has ${vaccineCount} vaccinations due this month`,
        data: { screen: "HealthDetails", type: "vaccination" },
        sound: true,
        badge: 1,
        // For Android
        channelId: "baby-app-reminders",
      },
      trigger: {
        hour: 12,
        minute: 0,
        repeats: true,
      },
    });

    // Save the notification ID so we can cancel it later
    await AsyncStorage.setItem(HEALTH_NOTIFICATION_ID_KEY, notificationId);
    console.log("Scheduled vaccination reminder with ID:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling vaccination reminder:", error);
    return null;
  }
};

// Cancel the health notification
export const cancelHealthNotification = async () => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return true;
  }

  try {
    const notificationId = await AsyncStorage.getItem(
      HEALTH_NOTIFICATION_ID_KEY
    );
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(HEALTH_NOTIFICATION_ID_KEY);
      console.log("Cancelled health notification with ID:", notificationId);
    }
    return true;
  } catch (error) {
    console.error("Error canceling health notification:", error);
    return false;
  }
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return true;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(HEALTH_NOTIFICATION_ID_KEY);
    console.log("Cancelled all notifications");
    return true;
  } catch (error) {
    console.error("Error canceling all notifications:", error);
    return false;
  }
};

// Handle notification response (when user taps on notification)
export const handleNotificationResponse = (response, navigation) => {
  if (!navigation) return;

  const data = response.notification.request.content.data;

  if (data?.screen) {
    // Navigate to the appropriate screen
    navigation.navigate(data.screen);
  }
};

// Set up notification listeners - updated for SDK 53
export const setupNotificationListeners = (navigation) => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return () => {};
  }

  if (!navigation) return () => {};

  console.log("Setting up notification listeners");

  // Handle notification when app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received in foreground:", notification);
    }
  );

  // Handle notification response when user taps on notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(
        "User responded to notification:",
        response.notification.request.identifier
      );
      handleNotificationResponse(response, navigation);
    });

  // Return cleanup function using the correct method
  return () => {
    notificationListener.remove();
    responseListener.remove();
    console.log("Notification listeners removed");
  };
};

// Get notification token - updated for SDK 53
export const getExpoPushToken = async () => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return null;
  }

  // Skip push token registration on emulators or Expo Go with SDK 53
  if (isRunningOnEmulator || (isUsingExpoGo && Platform.OS === "android")) {
    return null;
  }

  try {
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

    // Request permissions first
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo push token:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    // Silently handle the error
    console.log("Push notifications not available");
    return null;
  }
};

// Schedule an immediate test notification
export const scheduleTestNotification = async () => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    console.log("Test notification skipped on Android emulator with Expo Go");
    return null;
  }

  try {
    // On emulators, we don't need to request permissions for local notifications
    if (!isRunningOnEmulator) {
      await requestNotificationPermissions();
    }

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

// Initialize notification service
export const initializeNotifications = async () => {
  // Skip on Android emulators with Expo Go
  if (shouldDisableNotifications) {
    return;
  }

  await createNotificationChannel();

  // Skip permission request on emulators
  if (!isRunningOnEmulator) {
    await requestNotificationPermissions();
  }
};
