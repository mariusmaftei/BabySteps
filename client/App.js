import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Dimensions, StatusBar, Text } from "react-native";

// Add these imports at the top
import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Image, Animated } from "react-native";

// Screens
import ActivityScreen from "./screens/activity/activity";
import ChartsScreen from "./screens/charts/charts";
import SettingsScreen from "./screens/settings/settings";
import SleepDetailsScreen from "./screens/activity-details-screen/sleep-screen/sleep-details-screen";
import FeedingDetailsScreen from "./screens/activity-details-screen/feeding-screen/feeding-screen";
import GrowthDetailsScreen from "./screens/activity-details-screen/growth-details-screen/growth-details-screen";
import PlaytimeDetailsScreen from "./screens/activity-details-screen/playtime-details-screen/playtime-details-screen";
import HealthDetailsScreen from "./screens/activity-details-screen/health-detals-screen/health-details-screen";
import SocialDetailsScreen from "./screens/activity-details-screen/social-details-screen/social-details-screen";
import DiaperDetailsScreen from "./screens/activity-details-screen/diaper-details-screen/diaper-details-screen";
import RelaxingMusicScreen from "./screens/activity-details-screen/relaxing-music-screen/relaxing-music-screen";

// Custom Tab Bar
import CustomTabBar from "./components/custom-tab-bar/custom-tab-bar";

// Theme Provider
import { ThemeProvider, useTheme } from "./context/theme-context";
// Auth Provider
import { ChildActivityProvider } from "./context/child-activity-context";
// Auth Provider
import { AuthProvider, useAuth } from "./context/auth-context";
import LoginScreen from "./screens/login/login-screen";
import RegisterScreen from "./screens/register/register-screen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// Get screen dimensions
const { width, height } = Dimensions.get("window");

// Activity Stack Navigator
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
        name="SleepDetails"
        component={SleepDetailsScreen}
        options={{ title: "Sleep Details" }}
      />
      <Stack.Screen
        name="FeedingDetails"
        component={FeedingDetailsScreen}
        options={{ title: "Feeding Details" }}
      />
      <Stack.Screen
        name="GrowthDetails"
        component={GrowthDetailsScreen}
        options={{ title: "Growth Details" }}
      />
      <Stack.Screen
        name="PlaytimeDetails"
        component={PlaytimeDetailsScreen}
        options={{ title: "Playtime Details" }}
      />
      <Stack.Screen
        name="HealthDetails"
        component={HealthDetailsScreen}
        options={{ title: "Health Details" }}
      />
      <Stack.Screen
        name="SocialDetails"
        component={SocialDetailsScreen}
        options={{ title: "Social Details" }}
      />
      {/* Then in the ActivityStack component, add the route for the DiaperDetailsScreen: */}
      <Stack.Screen
        name="DiaperDetails"
        component={DiaperDetailsScreen}
        options={{ title: "Diaper Details" }}
      />
      {/* Add the new route for the relaxing music screen */}
      <Stack.Screen
        name="RelaxingMusic"
        component={RelaxingMusicScreen}
        options={{ title: "Relaxing Music" }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
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

// Auth Stack Navigator
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

// Simple splash screen with just the logo image
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

// Update the MainApp component to make sure it responds to auth state changes
function MainApp() {
  const { theme } = useTheme();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    // Show splash screen for a minimum time
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Custom navigation theme
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

  // Show splash screen
  if (isSplashVisible) {
    return <SplashScreen />;
  }

  // Show loading indicator while checking auth state
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

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <NavigationContainer theme={customTheme}>
        {isAuthenticated ? <MainTabs /> : <AuthStackNavigator />}
      </NavigationContainer>
    </>
  );
}

// Root component with ThemeProvider and ChildActivityProvider
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChildActivityProvider>
          <SafeAreaProvider>
            <MainApp />
          </SafeAreaProvider>
        </ChildActivityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Update styles for full screen image display
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#000", // Black background in case image doesn't cover entire screen
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
