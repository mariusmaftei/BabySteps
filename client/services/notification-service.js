import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const NOTIFICATION_SETTINGS_KEY = "@BabyApp:notificationSettings";
const HEALTH_NOTIFICATION_ID_KEY = "@BabyApp:healthNotificationId";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.log("Notifications are not available on simulator/emulator");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

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

// Schedule a health vaccination reminder
export const scheduleVaccinationReminder = async (childName, dueVaccines) => {
  // Cancel any existing health notification first
  await cancelHealthNotification();

  // Check if we have permission
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  // Create the notification content
  const vaccineCount = dueVaccines.length;
  const content = {
    title: `Vaccination Reminder for ${childName}`,
    body:
      vaccineCount === 1
        ? `${childName} has 1 vaccination due this month`
        : `${childName} has ${vaccineCount} vaccinations due this month`,
    data: { screen: "HealthDetails", type: "vaccination" },
  };

  // Schedule the notification to repeat daily at 12:00 PM until canceled
  const trigger = {
    hour: 12,
    minute: 0,
    repeats: true,
  };

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });

    // Save the notification ID so we can cancel it later
    await AsyncStorage.setItem(HEALTH_NOTIFICATION_ID_KEY, notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling vaccination reminder:", error);
    return null;
  }
};

// Cancel the health notification
export const cancelHealthNotification = async () => {
  try {
    const notificationId = await AsyncStorage.getItem(
      HEALTH_NOTIFICATION_ID_KEY
    );
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(HEALTH_NOTIFICATION_ID_KEY);
    }
    return true;
  } catch (error) {
    console.error("Error canceling health notification:", error);
    return false;
  }
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(HEALTH_NOTIFICATION_ID_KEY);
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

// Set up notification listeners
export const setupNotificationListeners = (navigation) => {
  if (!navigation) return () => {};

  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received in foreground:", notification);
    }
  );

  // Handle notification response when user taps on notification
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response, navigation);
    });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};
