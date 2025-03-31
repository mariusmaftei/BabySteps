import api, { ensureToken } from "./api.js";
import {
  calculateExpectedMonthlyGrowth,
  calculateMonthlyGrowthProgress,
} from "../utils/growth-utils.js";

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

// Calculate monthly growth targets based on WHO standards
export const calculateMonthlyGrowthTargets = (ageInMonths, gender) => {
  // Get expected monthly growth based on WHO standards
  const expectedGrowth = calculateExpectedMonthlyGrowth(ageInMonths, gender);

  return {
    targetWeight: expectedGrowth.weight,
    targetHeight: expectedGrowth.height,
    targetHeadCirc: expectedGrowth.headCirc,
  };
};

// Add this function to calculate growth progress percentages
export const calculateGrowthProgressPercentages = async (
  childId,
  ageInMonths,
  gender,
  birthWeight,
  birthHeight,
  birthHeadCirc
) => {
  try {
    // Get all growth records
    const records = await getGrowthRecords(childId);

    if (records.length === 0) {
      return {
        heightProgress: 0,
        weightProgress: 0,
        headCircProgress: 0,
        latestRecord: null,
      };
    }

    // Get birth record and latest record
    const birthRecord = records.reduce((earliest, record) => {
      return new Date(record.date) < new Date(earliest.date)
        ? record
        : earliest;
    });

    const latestRecord = records.reduce((latest, record) => {
      return new Date(record.date) > new Date(latest.date) ? record : latest;
    });

    // Get expected monthly growth based on WHO standards
    const expectedGrowth = calculateExpectedMonthlyGrowth(ageInMonths, gender);

    // Calculate progress for each metric
    const heightProgress = calculateMonthlyGrowthProgress(
      birthRecord.height,
      latestRecord.height,
      expectedGrowth.height,
      "height"
    );

    const weightProgress = calculateMonthlyGrowthProgress(
      birthRecord.weight,
      latestRecord.weight,
      expectedGrowth.weight,
      "weight"
    );

    const headCircProgress = calculateMonthlyGrowthProgress(
      birthRecord.headCirc || birthRecord.headCircumference,
      latestRecord.headCirc || latestRecord.headCircumference,
      expectedGrowth.headCirc,
      "headCirc"
    );

    return {
      heightProgress,
      weightProgress,
      headCircProgress,
      latestRecord,
    };
  } catch (error) {
    console.error("Error calculating growth progress percentages:", error);
    return {
      heightProgress: 0,
      weightProgress: 0,
      headCircProgress: 0,
      latestRecord: null,
    };
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
