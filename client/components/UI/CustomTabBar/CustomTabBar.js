import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme-context";

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { theme, isGirlTheme } = useTheme();

  // Animation value for the center button
  const [scaleAnimation] = React.useState(new Animated.Value(1));

  // Define theme-specific colors for the center button
  const centerButtonColors = {
    girl: {
      active: "#FF80AB",
      inactive: "#F48FB1",
    },
    boy: {
      active: "#1976D2",
      inactive: "#42A5F5",
    },
  };

  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnimation, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.borderLight,
          shadowColor: "#000",
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Get icon name based on route
        let iconName;
        if (route.name === "Activity") {
          iconName = isFocused ? "pulse" : "pulse-outline";
        } else if (route.name === "Settings") {
          iconName = isFocused ? "settings" : "settings-outline";
        } else if (route.name === "Charts") {
          iconName = "bar-chart"; // Always use filled icon for Charts
        }

        // Special styling for the Charts tab (center)
        if (route.name === "Charts") {
          // Get the appropriate colors based on the current theme and focus state
          const buttonColor = isGirlTheme
            ? isFocused
              ? centerButtonColors.girl.active
              : centerButtonColors.girl.inactive
            : isFocused
            ? centerButtonColors.boy.active
            : centerButtonColors.boy.inactive;

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.centerButton}
              activeOpacity={0.9}
            >
              <Animated.View
                style={[
                  styles.centerButtonContainer,
                  {
                    transform: [{ scale: scaleAnimation }],
                    shadowColor: buttonColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.centerButtonInner,
                    {
                      backgroundColor: buttonColor,
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
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

        // Regular tab buttons
        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? theme.primary : theme.textTertiary}
            />
            <Text
              style={{
                color: isFocused ? theme.primary : theme.textTertiary,
                fontSize: 12,
                fontWeight: isFocused ? "600" : "400",
                marginTop: 2,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    alignItems: "flex-end",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  centerButton: {
    flex: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  centerButtonContainer: {
    borderRadius: 35,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
