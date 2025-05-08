import { createContext, useState, useContext } from "react";
import { useColorScheme } from "react-native";
// Define theme colors - Updated with gender-specific themes
const girlTheme = {
  background: "#FFF8FA",
  backgroundSecondary: "#FFF0F5",
  text: "#4A4A4A",
  textSecondary: "#6D6D6D",
  textTertiary: "#9E9E9E",
  border: "#FFCCE0",
  borderLight: "#FFE0EB",
  primary: "#FF80AB",
  success: "#4CD964",
  warning: "#FF9500",
  danger: "#FF3B30",
  info: "#5856D6",
  accent: "#F48FB1",
  cardBackground: "#FFFFFF",
  modalBackground: "#FFFFFF",
  modalOverlay: "rgba(0, 0, 0, 0.5)",
  switchTrackColor: { false: "#FFD0E0", true: "#FF80AB" },
  switchThumbColor: "#FFFFFF",
  tabBackground: "#FFE0EB",
  tabActiveText: "#FFFFFF",
  tabInactiveText: "#FF80AB",
  isDark: false,
  isGirlTheme: true,
};

// Updated Boy Theme with dark text colors for better readability on light blue background
const boyTheme = {
  background: "#EFF8FF",
  backgroundSecondary: "#E3F2FD",
  text: "#4A4A4A", // Changed to dark text
  textSecondary: "#6D6D6D", // Changed to dark text
  textTertiary: "#9E9E9E", // Changed to dark text
  border: "#64B5F6",
  borderLight: "#90CAF9",
  primary: "#2196F3",
  success: "#4CD964",
  warning: "#FF9500",
  danger: "#FF3B30",
  info: "#5856D6",
  accent: "#42A5F5",
  cardBackground: "#FFFFFF", // Changed to white for better contrast
  modalBackground: "#FFFFFF", // Changed to white
  modalOverlay: "rgba(0, 0, 0, 0.5)",
  switchTrackColor: { false: "#90CAF9", true: "#2196F3" },
  switchThumbColor: "#FFFFFF",
  tabBackground: "#BBDEFB",
  tabActiveText: "#FFFFFF",
  tabInactiveText: "#2196F3",
  isDark: false, // Changed to false since it's now a light theme
  isGirlTheme: false,
};

// Create context
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Add this console.log at the beginning of the ThemeProvider function:
  console.log("ThemeProvider - Initializing");
  // Get device color scheme
  const deviceColorScheme = useColorScheme();

  // Initialize theme state based on device preference
  const [isGirlTheme, setIsGirlTheme] = useState(false);
  const [manualThemeOverride, setManualThemeOverride] = useState(false);

  // Toggle theme function - disabled for now as we only want automatic theme changes
  const toggleTheme = () => {
    console.log(
      "Manual theme toggling is disabled. Theme changes based on child gender only."
    );
    // No longer changing the theme manually
    // setIsGirlTheme((prevMode) => !prevMode)
    // setManualThemeOverride(true)
  };

  // Add a function to set theme based on child gender - always applies regardless of previous state
  const setThemeByGender = (gender) => {
    if (gender) {
      const isFemale = gender.toLowerCase() === "female";
      setIsGirlTheme(isFemale);
      console.log(
        `Theme updated based on child gender: ${
          isFemale ? "Girl theme" : "Boy theme"
        }`
      );
    }
  };

  // Function to reset to automatic theme based on gender
  const resetToAutoTheme = (gender) => {
    setManualThemeOverride(false);
    if (gender) {
      const isFemale = gender.toLowerCase() === "female";
      setIsGirlTheme(isFemale);
    }
    console.log("Theme reset to automatic gender-based selection");
  };

  // Get current theme
  const theme = isGirlTheme ? girlTheme : boyTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isGirlTheme,
        toggleTheme,
        setThemeByGender,
        resetToAutoTheme,
        isManuallyOverridden: manualThemeOverride,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
