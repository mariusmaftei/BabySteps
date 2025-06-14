import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useNotification } from "../../context/notification-context";

const NotificationTestButton = () => {
  const { scheduleTestNotification, requestPermissions } = useNotification();

  const handleTestNotification = async () => {
    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Please enable notifications in your device settings to test notifications.",
        [{ text: "OK" }]
      );
      return;
    }

    const notificationId = await scheduleTestNotification();

    if (notificationId) {
      Alert.alert(
        "Notification Sent",
        "A test notification has been sent. You should see it appear shortly.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Notification Failed",
        "There was a problem sending the test notification. Please check your device settings.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
        <Text style={styles.buttonText}>Test Notification</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default NotificationTestButton;
