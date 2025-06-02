import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FallbackCenterButton({
  isFocused,
  onPress,
  onPressIn,
  onPressOut,
  scaleAnimation,
  label,
  iconName,
  accessibilityState,
  accessibilityLabel,
  testID,
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.centerButton}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.centerButtonContainer,
          { transform: [{ scale: scaleAnimation }] },
        ]}
      >
        <View
          style={[
            styles.centerButtonInner,
            { backgroundColor: isFocused ? "#4776E6" : "#5A87FF" },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.centerButtonText}>{label}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    flex: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  centerButtonContainer: {
    borderRadius: 36,
    shadowColor: "#4776E6",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
