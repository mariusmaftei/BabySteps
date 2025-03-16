import { createContext, useState, useContext, useEffect } from "react";
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
  // Get device color scheme
  const deviceColorScheme = useColorScheme();

  // Initialize theme state based on device preference
  const [isGirlTheme, setIsGirlTheme] = useState(false);

  // Toggle theme function
  const toggleTheme = () => {
    setIsGirlTheme((prevMode) => !prevMode);
  };

  // Get current theme
  const theme = isGirlTheme ? girlTheme : boyTheme;

  return (
    <ThemeContext.Provider value={{ theme, isGirlTheme, toggleTheme }}>
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
