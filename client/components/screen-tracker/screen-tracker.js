import { useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useNotification } from "../../context/notification-context";

const ScreenTracker = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateCurrentScreen } = useNotification();

  useEffect(() => {
    // Get the current screen name
    const currentRouteName = route.name;

    // Update the current screen in the notification context
    updateCurrentScreen(currentRouteName);

    // Set up a listener for screen changes
    const unsubscribe = navigation.addListener("state", (e) => {
      const currentRoute = navigation.getCurrentRoute();
      if (currentRoute) {
        updateCurrentScreen(currentRoute.name);
      }
    });

    // Clean up the listener
    return unsubscribe;
  }, [navigation, route, updateCurrentScreen]);

  // This component doesn't render anything
  return null;
};

export default ScreenTracker;
