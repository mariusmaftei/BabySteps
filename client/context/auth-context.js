import { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "../services/auth-service";
// Create the auth context
// Create the auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);

          // Also try to load the user data
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error loading token:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  // Register a new user
  const register = async (userData) => {
    setError(null);
    try {
      // Call the auth service to register the user
      const result = await authService.register(userData);

      // If registration is successful, directly set the auth state
      if (result && result.token) {
        const { token, user } = result;

        // Update state
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
      }

      return result;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    }
  };

  // Login a user
  const login = async (email, password) => {
    setError(null);
    try {
      console.log("Auth context login with:", { email });
      const credentials = { email, password };
      const { token: newToken, user: userData } = await authService.login(
        credentials
      );
      console.log("Login successful, setting token and user");

      // Update state
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Login error in auth context:", err);
      setError(err.message || "Login failed");
      throw err;
    }
  };

  // Get current user
  const getCurrentUser = async () => {
    if (!token) return null;

    setError(null);
    try {
      const userData = await authService.getCurrentUser(token);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message || "Failed to get user data");
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    if (!token) return null;

    setError(null);
    try {
      console.log(
        "Updating user profile with token:",
        token ? "Token exists" : "No token"
      );
      console.log("Update data:", userData);

      const updatedUser = await authService.updateUserProfile(userData, token);

      // Update the user state with the new data
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
      }));

      return updatedUser;
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message || "Failed to update profile");
      throw err;
    }
  };

  // Logout a user
  const logout = async () => {
    try {
      console.log("Logging out user");
      // Clear user data
      setUser(null);
      setToken(null);

      // Clear storage
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");

      // Set isAuthenticated to false AFTER storage is cleared
      setIsAuthenticated(false);

      console.log("Logout successful");
      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        register,
        login,
        logout,
        isAuthenticated,
        getCurrentUser,
        updateUserProfile,
        setUser,
        setToken,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
