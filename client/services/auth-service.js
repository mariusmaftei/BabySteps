import { api, setAuthToken, initializeApi } from "./api";

let handlingDuplicateEmail = false;
let handlingInvalidCredentials = false;

const isDuplicateEmailErrorCheck = (error) => {
  return (
    error.response &&
    error.response.status === 400 &&
    (error.response.data.code === "EMAIL_EXISTS" ||
      (error.response.data.message &&
        error.response.data.message.includes("already exists")))
  );
};

const isInvalidCredentialsCheck = (error) => {
  return (
    error.response &&
    error.response.status === 400 &&
    error.response.data &&
    error.response.data.message &&
    (error.response.data.message.includes("Invalid credentials") ||
      error.response.data.message.includes("Invalid email") ||
      error.response.data.message.includes("Invalid password"))
  );
};

export const register = async (userData) => {
  try {
    handlingDuplicateEmail = false;

    if (!userData.email) {
      throw new Error("Email is required for registration");
    }

    const response = await api.post("/auth/register", userData);

    const { token, user } = response.data;
    await setAuthToken(token);
    await initializeApi();

    return response.data;
  } catch (error) {
    if (isDuplicateEmailErrorCheck(error)) {
      handlingDuplicateEmail = true;

      const customError = new Error(error.response.data.message);
      customError.code = "EMAIL_EXISTS";

      throw customError;
    }

    throw error;
  }
};

export const login = async (credentials) => {
  try {
    handlingInvalidCredentials = false;

    const response = await api.post("/auth/login", credentials);

    const { token, user } = response.data;
    await setAuthToken(token);
    await initializeApi();

    return response.data;
  } catch (error) {
    if (isInvalidCredentialsCheck(error)) {
      handlingInvalidCredentials = true;

      const customError = new Error("Invalid email or password");
      customError.code = "INVALID_CREDENTIALS";

      throw customError;
    }

    if (error.response) {
      throw new Error(error.response.data.message || "Login failed");
    } else {
      throw new Error("Network error. Please check your connection.");
    }
  }
};

export const getCurrentUser = async (token) => {
  try {
    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Failed to get user data");
    } else {
      throw new Error("Network error. Please check your connection.");
    }
  }
};

export const updateUserProfile = async (userData, token) => {
  try {
    const response = await api.put("/auth/profile", userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to update profile"
      );
    } else {
      throw new Error("Network error. Please check your connection.");
    }
  }
};

export const logout = async () => {
  try {
    await setAuthToken(null);
    return true;
  } catch (error) {
    throw new Error("Failed to logout");
  }
};

export const initializeApiService = async () => {
  try {
    await initializeApi();
    return true;
  } catch (error) {
    return false;
  }
};

export const getDuplicateEmailErrorFlag = () => handlingDuplicateEmail;
export const getInvalidCredentialsFlag = () => handlingInvalidCredentials;
