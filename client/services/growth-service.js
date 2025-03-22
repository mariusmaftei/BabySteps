import api, { ensureToken } from "./api.js";

// Helper function to handle expected 404 errors
const handle404Error = (error, message, defaultValue) => {
  if (error.response && error.response.status === 404) {
    console.log(message);
    return defaultValue;
  }
  // For other errors, log and rethrow
  console.error(message, error);
  throw error;
};

// Get all growth records for a specific child
export const getGrowthRecords = async (childId) => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    const response = await api.get(`/growth/child/${childId}`);
    return response.data;
  } catch (error) {
    return handle404Error(
      error,
      "No growth records found for this child - this is normal for new users",
      []
    );
  }
};

// Get the latest growth record for a specific child
export const getLatestGrowthRecord = async (childId) => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    const response = await api.get(`/growth/child/${childId}/latest`);
    return response.data;
  } catch (error) {
    return handle404Error(
      error,
      "No latest growth record found - this is normal for new users",
      null
    );
  }
};

// Get the previous growth record for a specific child
export const getPreviousGrowthRecord = async (childId) => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    const response = await api.get(`/growth/child/${childId}/previous`);
    return response.data;
  } catch (error) {
    return handle404Error(
      error,
      "No previous growth record found - this is expected for new users",
      null
    );
  }
};

// Get growth statistics for a specific child
export const getGrowthStatistics = async (childId) => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    const response = await api.get(`/growth/child/${childId}/statistics`);
    return response.data;
  } catch (error) {
    return handle404Error(
      error,
      "No growth statistics available - this is normal for new users",
      {
        weightData: [],
        heightData: [],
        headCircumferenceData: [],
        totalRecords: 0,
        firstRecord: null,
        latestRecord: null,
        weightGain: 0,
        heightGain: 0,
        headCircumferenceGain: 0,
      }
    );
  }
};

// Create a new growth record
export const createGrowthRecord = async (growthData) => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    console.log("Creating growth record with data:", growthData);
    const response = await api.post("/growth", growthData);
    return response.data;
  } catch (error) {
    console.error("Error creating growth record:", error);
    throw error;
  }
};

// Update a growth record
export const updateGrowthRecord = async (id, growthData) => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    const response = await api.put(`/growth/${id}`, growthData);
    return response.data;
  } catch (error) {
    console.error("Error updating growth record:", error);
    throw error;
  }
};

// Delete a growth record
export const deleteGrowthRecord = async (id) => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    const response = await api.delete(`/growth/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting growth record:", error);
    throw error;
  }
};

// Check if today is Sunday (for client validation) - still used but modified to always return true
export const checkIfSunday = async () => {
  try {
    await ensureToken(); // Just ensure the token is set, don't use the return value
    const response = await api.get("/growth/check-sunday");
    return response.data;
  } catch (error) {
    console.error("Error checking if today is Sunday:", error);
    throw error;
  }
};
