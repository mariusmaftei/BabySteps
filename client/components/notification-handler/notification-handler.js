import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useNotification } from "../../context/notification-context";

const NotificationHandler = () => {
  const { updateCurrentScreen } = useNotification();

  useEffect(() => {
    // Set up notification response handler
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        // If the notification has a screen to navigate to, update the current screen
        if (data && data.screen) {
          updateCurrentScreen(data.screen);
        }
      }
    );

    // Clean up the subscription
    return () => subscription.remove();
  }, [updateCurrentScreen]);

  // This component doesn't render anything
  return null;
};

export default NotificationHandler;
