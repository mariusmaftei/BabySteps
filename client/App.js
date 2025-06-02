import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Dimensions, StatusBar } from "react-native";

import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Image } from "react-native";

import RegisterScreen from "./screens/RegisterScreen/RegisterScreen";
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import ActivityScreen from "./screens/ActivityScreen/ActivityScreen";
import ChartsScreen from "./screens/ChartsScreen/ChartsScreen";
import SettingsScreen from "./screens/SettingsScreen/SettingsScreen";

import SleepScreen from "./screens/ActivitySubScreens/SleepScreen/SleepScreen";
import FeedingScreen from "./screens/ActivitySubScreens/FeedingScreen/FeedingScreen";
import GrowthScreen from "./screens/ActivitySubScreens/GrowthScreen/GrowthScreen";
import HealthScreen from "./screens/ActivitySubScreens/HealthScreen/HealthScreen";
import DiaperScreen from "./screens/ActivitySubScreens/DiaperScreen/DiaperScreen";
import MusicScreen from "./screens/ActivitySubScreens//MusicScreen/MusicScreen";

import CustomTabBar from "./components/UI/CustomTabBar/CustomTabBar";

import { ThemeProvider, useTheme } from "./context/theme-context";

import {
  ChildActivityProvider,
  useChildActivity,
} from "./context/child-activity-context";

import { AuthProvider, useAuth } from "./context/auth-context";

import NotificationHandler from "./components/notification-handler/notification-handler";
import { NotificationProvider } from "./context/notification-context";

console.log("App.js - Starting initialization");

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

const { width, height } = Dimensions.get("window");

function ActivityStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
          backgroundColor: theme.background,
        },
        headerTitleStyle: {
          fontWeight: "600",
          color: theme.text,
        },
        headerTintColor: theme.primary,
      }}
    >
      <Stack.Screen
        name="ActivityMain"
        component={ActivityScreen}
        options={{ title: "Activity" }}
      />
      <Stack.Screen
        name="SleepScreen"
        component={SleepScreen}
        options={{ title: "Sleep Details" }}
      />
      <Stack.Screen
        name="FeedingScreen"
        component={FeedingScreen}
        options={{ title: "Feeding Details" }}
      />
      <Stack.Screen
        name="GrowthScreen"
        component={GrowthScreen}
        options={{ title: "Growth Details" }}
      />
      <Stack.Screen
        name="HealthScreen"
        component={HealthScreen}
        options={{ title: "Health Details" }}
      />
      <Stack.Screen
        name="DiaperScreen"
        component={DiaperScreen}
        options={{ title: "Diaper Details" }}
      />
      <Stack.Screen
        name="MusicScreen"
        component={MusicScreen}
        options={{ title: "Relaxing Music" }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Activity" component={ActivityStack} />
      <Tab.Screen name="Charts" component={ChartsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStackNavigator() {
  const { theme } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

const ThemeChildConnector = () => {
  const { currentChild } = useChildActivity();
  const { setThemeByGender } = useTheme();

  useEffect(() => {
    if (currentChild && currentChild.gender) {
      setThemeByGender(currentChild.gender);
    }
  }, [currentChild]);

  return null;
};

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={{
          uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon.jpg-44WMVSdJGJzQY1Un38hCMfU86skFi1.jpeg",
        }}
        style={styles.fullScreenImage}
        resizeMode="cover"
      />
    </View>
  );
}

function MainApp() {
  console.log("MainApp - Component initializing");
  const { theme, setThemeByGender } = useTheme();
  const {
    isLoading: authLoading,
    isAuthenticated,
    logout,
    getCurrentUser,
    token,
  } = useAuth();
  const { currentChild } = useChildActivity();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const userChecked = useRef(false);

  useEffect(() => {
    // Show splash screen for a minimum time
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    console.log("MainApp - Authentication check effect running");
    const checkUser = async () => {
      if (isAuthenticated && !userChecked.current) {
        userChecked.current = true;
        try {
          console.log("Checking user profile...");
          await getCurrentUser();
          console.log("User profile fetched successfully");
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          if (
            error.message === "User not found" ||
            (error.response && error.response.status === 401)
          ) {
            console.log("User not found, logging out");
            logout();
          }
        }
      } else if (!isAuthenticated) {
        userChecked.current = false;
      }
    };

    checkUser();
  }, [isAuthenticated, getCurrentUser, logout]);

  useEffect(() => {
    if (currentChild && currentChild.gender) {
      setThemeByGender(currentChild.gender);
      console.log(
        `Theme updated based on current child gender: ${currentChild.gender}`
      );
    }
  }, [currentChild, setThemeByGender]);

  const customTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.cardBackground,
      text: theme.text,
      border: theme.border,
    },
  };

  if (isSplashVisible) {
    return <SplashScreen />;
  }

  if (authLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <Image
          source={{
            uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon.jpg-44WMVSdJGJzQY1Un38hCMfU86skFi1.jpeg",
          }}
          style={styles.smallLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  console.log(
    "MainApp - Rendering UI with auth state:",
    isAuthenticated ? "authenticated" : "not authenticated"
  );
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <NavigationContainer theme={customTheme}>
        {isAuthenticated ? (
          <>
            <NotificationHandler />
            <MainTabs />
          </>
        ) : (
          <AuthStackNavigator />
        )}
      </NavigationContainer>
    </>
  );
}

export default function App() {
  console.log("App - Root component initializing");
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChildActivityProvider>
          <NotificationProvider>
            <SafeAreaProvider>
              <ThemeChildConnector />
              <MainApp />
            </SafeAreaProvider>
          </NotificationProvider>
        </ChildActivityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenImage: {
    width: width,
    height: height,
    position: "absolute",
    top: 0,
    left: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  smallLogo: {
    width: 200,
    height: 300,
  },
});
