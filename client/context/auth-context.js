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

  useEffect(() => {
    const loadToken = async () => {
      console.log("AuthProvider - Loading token from storage");
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);

          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          setIsAuthenticated(true);

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

  const isInvalidCredentialsError = (err) => {
    return (
      err.code === "INVALID_CREDENTIALS" ||
      (err.message &&
        (err.message.includes("Invalid email") ||
          err.message.includes("Invalid credentials") ||
          err.message.includes("Invalid password")))
    );
  };

  const register = async (userData) => {
    setError(null);
    try {
      console.log("Auth context register with data:", userData);

      const result = await authService.register(userData);

      if (result && result.token) {
        const { token, user } = result;

        console.log("Registration successful, setting token and user");

        setToken(token);
        setUser(user);

        await AsyncStorage.setItem("user", JSON.stringify(user));

        setIsAuthenticated(true);
      }

      return result;
    } catch (err) {
      if (err.message && err.message.includes("User already exists")) {
        setError(err.message);

        if (!authService.getDuplicateEmailErrorFlag()) {
          console.log("Registration failed: Email already exists");
        }
      } else {
        console.error("Registration error in auth context:", err);
        setError(err.message || "Registration failed");
      }

      throw err;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      console.log("Auth context login with:", { email });
      const credentials = { email, password };
      const { token: newToken, user: userData } = await authService.login(
        credentials
      );
      console.log("Login successful, setting token and user");

      setToken(newToken);
      setUser(userData);

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setIsAuthenticated(true);

      return true;
    } catch (err) {
      if (isInvalidCredentialsError(err)) {
        setError(err.message);

        if (!authService.getInvalidCredentialsFlag()) {
          console.log("Login failed: Invalid credentials");
        }
      } else {
        console.error("Login error in auth context:", err);
        setError(err.message || "Login failed");
      }

      throw err;
    }
  };

  const getCurrentUser = async () => {
    if (!token) return null;

    setError(null);
    try {
      const userData = await authService.getCurrentUser(token);
      setUser(userData);

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      return userData;
    } catch (err) {
      setError(err.message || "Failed to get user data");
      throw err;
    }
  };

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

      setUser((prev) => ({
        ...prev,
        ...updatedUser,
      }));

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

  const logout = async () => {
    try {
      console.log("Logging out user");

      await authService.logout();

      setUser(null);
      setToken(null);

      await AsyncStorage.removeItem("user");

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
