import { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "../services/auth-service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider - Initializing");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const loadToken = async () => {
      console.log("AuthProvider - Loading token from storage");
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

          // Initialize API with the token
          try {
            await authService.initializeApiService();
            console.log("API initialized during startup");
          } catch (error) {
            console.error("Error initializing API during startup:", error);
          }
        }
      } catch (err) {
        console.error("Error loading token:", err);
      } finally {
        console.log("AuthProvider - Finished loading auth state");
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  // Helper function to check if an error is an invalid credentials error
  const isInvalidCredentialsError = (err) => {
    return (
      err.code === "INVALID_CREDENTIALS" ||
      (err.message &&
        (err.message.includes("Invalid email") ||
          err.message.includes("Invalid credentials") ||
          err.message.includes("Invalid password")))
    );
  };

  // Register a new user
  const register = async (userData) => {
    setError(null);
    try {
      console.log("Auth context register with data:", userData);

      // Call the auth service to register the user
      const result = await authService.register(userData);

      // If registration is successful, directly set the auth state
      if (result && result.token) {
        const { token, user } = result;

        console.log("Registration successful, setting token and user");

        // Update state
        setToken(token);
        setUser(user);

        // Store user data in AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(user));

        // Set authenticated state AFTER everything else is done
        setIsAuthenticated(true);
      }

      return result;
    } catch (err) {
      // Check if this is a duplicate email error
      if (err.message && err.message.includes("User already exists")) {
        // For duplicate email errors, just set the error without additional logging
        setError(err.message);

        // Only log this once if it's not already being handled by the service
        if (!authService.getDuplicateEmailErrorFlag()) {
          console.log("Registration failed: Email already exists");
        }
      } else {
        // For other errors, log normally
        console.error("Registration error in auth context:", err);
        setError(err.message || "Registration failed");
      }

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

      // Store user data in AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Set authenticated state AFTER everything else is done
      setIsAuthenticated(true);

      return true;
    } catch (err) {
      // Check if this is an invalid credentials error
      if (isInvalidCredentialsError(err)) {
        // For invalid credentials errors, just set the error without additional logging
        setError(err.message);

        // Only log this once if it's not already being handled by the service
        if (!authService.getInvalidCredentialsFlag()) {
          console.log("Login failed: Invalid credentials");
        }
      } else {
        // For other errors, log normally
        console.error("Login error in auth context:", err);
        setError(err.message || "Login failed");
      }

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

      // Update stored user data
      await AsyncStorage.setItem("user", JSON.stringify(userData));

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

      // Update stored user data
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          ...updatedUser,
        })
      );

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

      // Call the auth service to logout
      await authService.logout();

      // Clear user data
      setUser(null);
      setToken(null);

      // Clear storage
      await AsyncStorage.removeItem("user");

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
