import { createContext, useState, useContext } from "react";

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

const boyTheme = {
  background: "#EFF8FF",
  backgroundSecondary: "#E3F2FD",
  text: "#4A4A4A",
  textSecondary: "#6D6D6D",
  textTertiary: "#9E9E9E",
  border: "#64B5F6",
  borderLight: "#90CAF9",
  primary: "#2196F3",
  success: "#4CD964",
  warning: "#FF9500",
  danger: "#FF3B30",
  info: "#5856D6",
  accent: "#42A5F5",
  cardBackground: "#FFFFFF",
  modalBackground: "#FFFFFF",
  modalOverlay: "rgba(0, 0, 0, 0.5)",
  switchTrackColor: { false: "#90CAF9", true: "#2196F3" },
  switchThumbColor: "#FFFFFF",
  tabBackground: "#BBDEFB",
  tabActiveText: "#FFFFFF",
  tabInactiveText: "#2196F3",
  isDark: false,
  isGirlTheme: false,
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isGirlTheme, setIsGirlTheme] = useState(false);

  const setThemeByGender = (gender) => {
    if (gender) {
      const isFemale = gender.toLowerCase() === "female";
      setIsGirlTheme(isFemale);
    }
  };

  const theme = isGirlTheme ? girlTheme : boyTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isGirlTheme,
        setThemeByGender,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
