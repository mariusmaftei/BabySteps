import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Base URL for the API
const getApiUrl = () => {
  // For physical devices on the same network, use your computer's IP address
  const COMPUTER_IP = "192.168.1.2";

  // For Android emulator
  if (Platform.OS === "android") {
    // If you're using a physical Android device, use your computer's IP
    // If you're using an Android emulator, use 10.0.2.2 (which maps to your computer's localhost)
    // You can add logic here to detect if it's a physical device or emulator if needed
    return `http://${COMPUTER_IP}:8080`;
  }

  // For iOS simulator or physical device
  return `http://${COMPUTER_IP}:8080`;
};

// Create axios instance
export const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log the base URL during initialization to verify it's correct
console.log("API initialized with base URL:", getApiUrl());

// Initialize API with auth token
export const initializeApi = async () => {
  try {
    // Get the auth token from storage - use "token" key to match auth-context.jsx
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      console.log("No auth token found");
      return false;
    }

    // Set the auth token in the headers
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    console.log(
      "API initialized with auth token:",
      token.substring(0, 10) + "..."
    );
    return true;
  } catch (error) {
    console.error("Error initializing API:", error);
    return false;
  }
};

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method.toUpperCase(), config.url);
    console.log("Request headers:", JSON.stringify(config.headers));
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log("API Response Status:", response.status);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error);
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error Message:", error.message);
    }
    return Promise.reject(error);
  }
);

// Export a function to set the auth token
export const setAuthToken = async (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // Use "token" key to match auth-context.jsx
    await AsyncStorage.setItem("token", token);
    console.log(
      "Auth token set and saved to storage:",
      token.substring(0, 10) + "..."
    );
  } else {
    delete api.defaults.headers.common["Authorization"];
    await AsyncStorage.removeItem("token");
    console.log("Auth token removed from API headers and storage");
  }
};

// Export a function to clear the auth token
export const clearAuthToken = async () => {
  delete api.defaults.headers.common["Authorization"];
  await AsyncStorage.removeItem("token");
  console.log("Auth token cleared from API headers and storage");
};

// Add a function to ensure the API has a token before making requests
export const ensureToken = async () => {
  // Check if Authorization header is already set
  if (api.defaults.headers.common["Authorization"]) {
    console.log(
      "Authorization header already set:",
      api.defaults.headers.common["Authorization"].substring(0, 15) + "..."
    );
    return true;
  }

  // If not, try to get it from storage - use "token" key to match auth-context.jsx
  const token = await AsyncStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log(
      "Auth token retrieved from storage and set in API headers:",
      token.substring(0, 10) + "..."
    );
    return true;
  }

  console.log("No auth token found in storage");
  return false;
};

export default api;
