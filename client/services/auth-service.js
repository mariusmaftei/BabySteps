import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const register = async (userData) => {
  try {
    // Make sure userData is a plain JavaScript object
    const cleanUserData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      imageSrc: userData.imageSrc,
    };

    console.log("Sending registration data:", JSON.stringify(cleanUserData));

    // Use the clean object for the API request
    const response = await api.post("/auth/register", cleanUserData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw (
      error.response?.data || {
        error: "Registration failed",
        message: error.message,
      }
    );
  }
};
// Login a user
export const login = async (credentials) => {
  try {
    console.log("Auth service login with:", credentials);
    const response = await api.post("/auth/login", credentials);
    console.log("Login response:", response.data);

    const { token, user } = response.data;

    // Store token in AsyncStorage
    await AsyncStorage.setItem("token", token);

    return { token, user };
  } catch (error) {
    console.error("Login error in auth-service:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    throw (
      error.response?.data || { error: "Login failed", message: error.message }
    );
  }
};

// Get current user
export const getCurrentUser = async (token) => {
  try {
    console.log(
      "Getting current user with token:",
      token ? "Token exists" : "No token"
    );

    if (!token) {
      throw new Error("No authentication token");
    }

    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Current user response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get current user error:", error);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    throw (
      error.response?.data || {
        error: "Failed to get user data",
        message: error.message,
      }
    );
  }
};

// Update user profile
export const updateUserProfile = async (userData, token) => {
  try {
    console.log("Updating user profile with data:", userData);
    console.log("Using token:", token ? "Token exists" : "No token");

    // Make sure we're sending the data to the correct endpoint
    const response = await api.put("/auth/update", userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Profile update response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Profile update error:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    throw (
      error.response?.data || {
        error: "Failed to update profile",
        message: error.message,
      }
    );
  }
};

// Logout a user
export const logout = async () => {
  try {
    // Remove token from AsyncStorage
    await AsyncStorage.removeItem("token");
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};
