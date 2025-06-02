import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const NOTIFICATION_SETTINGS_KEY = "@BabyApp:notificationSettings";
const HEALTH_NOTIFICATION_ID_KEY = "@BabyApp:healthNotificationId";

const isRunningOnEmulator = !Device.isDevice;

const isUsingExpoGo = Constants.appOwnership === "expo";

const shouldDisableNotifications =
  Platform.OS === "android" && isRunningOnEmulator && isUsingExpoGo;

if (!shouldDisableNotifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const createNotificationChannel = async () => {
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

export const requestNotificationPermissions = async () => {
  if (shouldDisableNotifications) {
    return true;
  }

  if (Platform.OS === "android") {
    await createNotificationChannel();
  }

  if (isRunningOnEmulator) {
    return true;
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

export const scheduleVaccinationReminder = async (childName, dueVaccines) => {
  if (shouldDisableNotifications) {
    return null;
  }

  await cancelHealthNotification();

  const hasPermission = isRunningOnEmulator
    ? true
    : await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  const vaccineCount = dueVaccines.length;

  try {
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
        channelId: "baby-app-reminders",
      },
      trigger: {
        hour: 12,
        minute: 0,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(HEALTH_NOTIFICATION_ID_KEY, notificationId);
    console.log("Scheduled vaccination reminder with ID:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling vaccination reminder:", error);
    return null;
  }
};

export const cancelHealthNotification = async () => {
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

export const cancelAllNotifications = async () => {
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

export const handleNotificationResponse = (response, navigation) => {
  if (!navigation) return;

  const data = response.notification.request.content.data;

  if (data?.screen) {
    navigation.navigate(data.screen);
  }
};

export const setupNotificationListeners = (navigation) => {
  if (shouldDisableNotifications) {
    return () => {};
  }

  if (!navigation) return () => {};

  console.log("Setting up notification listeners");

  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received in foreground:", notification);
    }
  );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(
        "User responded to notification:",
        response.notification.request.identifier
      );
      handleNotificationResponse(response, navigation);
    });

  return () => {
    notificationListener.remove();
    responseListener.remove();
    console.log("Notification listeners removed");
  };
};

export const getExpoPushToken = async () => {
  if (shouldDisableNotifications) {
    return null;
  }

  if (isRunningOnEmulator || (isUsingExpoGo && Platform.OS === "android")) {
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log(
        "No project ID found. Push notifications will not be available, but local notifications will still work."
      );
      return null;
    }

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

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo push token:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.log("Push notifications not available");
    return null;
  }
};

export const scheduleTestNotification = async () => {
  if (shouldDisableNotifications) {
    console.log("Test notification skipped on Android emulator with Expo Go");
    return null;
  }

  try {
    if (!isRunningOnEmulator) {
      await requestNotificationPermissions();
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test notification to verify notifications are working",
        data: { screen: "ActivityMain" },
      },
      trigger: null,
    });
    console.log("Test notification scheduled with ID:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling test notification:", error);
    return null;
  }
};

export const initializeNotifications = async () => {
  if (shouldDisableNotifications) {
    return;
  }

  await createNotificationChannel();

  if (!isRunningOnEmulator) {
    await requestNotificationPermissions();
  }
};
