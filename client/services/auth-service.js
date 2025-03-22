import { api, setAuthToken, initializeApi } from "./api";

// Register a new user
export const register = async (userData) => {
  try {
    console.log("Registering user with data:", JSON.stringify(userData));

    // Validate that email exists before making the request
    if (!userData.email) {
      throw new Error("Email is required for registration");
    }

    const response = await api.post("/auth/register", userData);
    console.log("API Response Status:", response.status);

    // Set the token in headers and storage
    const { token, user } = response.data;
    await setAuthToken(token);
    console.log(
      "Auth token set and saved to storage:",
      token.substring(0, 10) + "..."
    );

    // Initialize API with the token
    await initializeApi();
    console.log("API initialized after registration");

    return response.data;
  } catch (error) {
    console.error("Registration error:", error);

    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
      throw new Error(error.response.data.message || "Registration failed");
    } else {
      throw new Error(
        error.message || "Network error. Please check your connection."
      );
    }
  }
};

// Login a user
export const login = async (credentials) => {
  try {
    console.log("Logging in user:", credentials.email);
    const response = await api.post("/auth/login", credentials);

    // Set the token in headers and storage
    const { token, user } = response.data;
    await setAuthToken(token);

    // Initialize API with the token
    await initializeApi();
    console.log("API initialized after login");

    return response.data;
  } catch (error) {
    console.error("Login error:", error);

    if (error.response) {
      throw new Error(error.response.data.message || "Login failed");
    } else {
      throw new Error("Network error. Please check your connection.");
    }
  }
};

// Get the current user
export const getCurrentUser = async (token) => {
  try {
    console.log(
      "Getting current user with token:",
      token ? "Token exists" : "No token"
    );

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
      throw new Error(error.response.data.message || "Failed to get user data");
    } else {
      throw new Error("Network error. Please check your connection.");
    }
  }
};

// Update user profile
export const updateUserProfile = async (userData, token) => {
  try {
    console.log("Updating user profile:", userData);

    const response = await api.put("/auth/profile", userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to update profile"
      );
    } else {
      throw new Error("Network error. Please check your connection.");
    }
  }
};

// Logout a user
export const logout = async () => {
  try {
    // Clear the auth token
    await setAuthToken(null);
    console.log("Auth token cleared");
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("Failed to logout");
  }
};

// Initialize the API
export const initializeApiService = async () => {
  try {
    await initializeApi();
    console.log("API initialized from service");
    return true;
  } catch (error) {
    console.error("Error initializing API from service:", error);
    return false;
  }
};
