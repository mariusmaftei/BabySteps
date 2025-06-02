import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getApiUrl = () => {
  const COMPUTER_IP = "192.168.1.2";

  if (Platform.OS === "android") {
    return `http://${COMPUTER_IP}:8080`;
  }

  return `http://${COMPUTER_IP}:8080`;
};

export const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const initializeApi = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      return false;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return true;
  } catch (error) {
    return false;
  }
};

const EXPECTED_404_ENDPOINTS = [
  "/growth/child/",
  "/previous",
  "/latest",
  "/statistics",
];

const isExpected404Error = (url, status) => {
  if (status !== 404) return false;
  return EXPECTED_404_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

const isKnownError = (error) => {
  const isDuplicateEmail =
    error.response &&
    error.response.status === 400 &&
    error.response.data &&
    (error.response.data.code === "EMAIL_EXISTS" ||
      (error.response.data.message &&
        error.response.data.message.includes("already exists")));

  const isInvalidCredentials =
    error.response &&
    error.response.status === 400 &&
    error.response.data &&
    error.response.data.message &&
    error.response.data.message.includes("Invalid credentials");

  return isDuplicateEmail || isInvalidCredentials;
};

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const setAuthToken = async (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    await AsyncStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    await AsyncStorage.removeItem("token");
  }
};

export const clearAuthToken = async () => {
  delete api.defaults.headers.common["Authorization"];
  await AsyncStorage.removeItem("token");
};

export const ensureToken = async () => {
  if (api.defaults.headers.common["Authorization"]) {
    return;
  }

  const token = await AsyncStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return;
  }

  throw new Error("No authentication token found");
};

export default api;
