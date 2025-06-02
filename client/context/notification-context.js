import { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const NOTIFICATION_SETTINGS_KEY = "@BabyApp:notificationSettings";
const CURRENT_SCREEN_KEY = "@BabyApp:currentScreen";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    healthReminders: true,
  });
  const [currentScreen, setCurrentScreen] = useState("Activity");
  const [permissionGranted, setPermissionGranted] = useState(true);

  const updateCurrentScreen = async (screenName) => {
    try {
      await AsyncStorage.setItem(CURRENT_SCREEN_KEY, screenName);
      setCurrentScreen(screenName);
    } catch (error) {
      console.error("Error saving current screen:", error);
    }
  };

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

  const toggleNotifications = async (value) => {
    const newSettings = { ...settings, enabled: value };
    return await saveSettings(newSettings);
  };

  const toggleHealthReminders = async (value) => {
    const newSettings = { ...settings, healthReminders: value };
    return await saveSettings(newSettings);
  };

  const requestPermissions = async () => {
    return true;
  };

  const registerForPushNotifications = async () => {
    Alert.alert(
      "Notifications Disabled",
      "Push notifications have been disabled in this version of the app.",
      [{ text: "OK" }]
    );
    return null;
  };

  const scheduleVaccinationReminders = async () => {
    console.log("Vaccination reminders are disabled");
    return null;
  };

  const scheduleTestNotification = async () => {
    Alert.alert(
      "Notifications Disabled",
      "Notifications have been disabled in this version of the app.",
      [{ text: "OK" }]
    );
    return null;
  };

  const cancelVaccinationReminders = async () => {
    return true;
  };

  const cancelAllNotifications = async () => {
    return true;
  };

  useEffect(() => {
    console.log("NotificationProvider - Initializing (UI only)");
    loadSettings();

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

  const value = {
    settings,
    permissionGranted,
    currentScreen,
    expoPushToken: "",
    notification: undefined,
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

export default NotificationContext;
