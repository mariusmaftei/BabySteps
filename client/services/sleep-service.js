import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { ensureToken } from "./api";

// Sleep data structure for frontend
const createSleepRecord = (data) => {
  return {
    id: data.id || null,
    childId: data.childId,
    napHours: data.napHours || 0,
    nightHours: data.nightHours || 0,
    date: data.date || new Date().toISOString().split("T")[0],
    notes: data.notes || "",
    totalHours: (
      Number.parseFloat(data.napHours || 0) +
      Number.parseFloat(data.nightHours || 0)
    ).toFixed(1),
    autoFilled: data.autoFilled || false,
  };
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Check if a date is today
export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Get all sleep data for a child
export const getChildSleepData = async (childId) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log(`Fetching sleep data for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}`);
    console.log("Sleep data response:", response.data);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep data:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    // Return empty array instead of falling back to local storage
    return [];
  }
};

// Get today's sleep data for a child
export const getTodaySleepData = async (childId) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log(`Fetching today's sleep data for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}/today`);
    console.log("Today's sleep data response:", response.data);
    return response.data ? createSleepRecord(response.data) : null;
  } catch (error) {
    // If 404, it means no record for today
    if (error.response && error.response.status === 404) {
      console.log("No sleep record found for today");
      return null;
    }
    console.error("Error fetching today's sleep data:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    // Return null instead of falling back to local storage
    return null;
  }
};

// Get sleep data for a specific date range
export const getSleepDataByDateRange = async (childId, startDate, endDate) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    console.log(
      `Fetching sleep data for child ID: ${childId} from ${formattedStartDate} to ${formattedEndDate}`
    );
    const response = await api.get(
      `/sleep/child/${childId}/range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
    );
    console.log("Sleep data by date range response:", response.data);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep data by date range:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    // Return empty array instead of falling back to local storage
    return [];
  }
};

// Get sleep data for the last 7 days
export const getWeeklySleepData = async (childId) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return await getSleepDataByDateRange(childId, startDate, endDate);
};

// Helper function to calculate child's age in months
const getChildAgeInMonths = (child) => {
  if (!child || !child.age) return 24; // Default to toddler if no age

  const ageText = child.age;
  const ageNum = Number.parseInt(ageText.split(" ")[0]) || 0;
  const ageUnit = ageText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  return ageUnit === "months" ? ageNum : ageNum * 12;
};

// Helper function to get recommended sleep hours based on age
const getRecommendedSleepHours = (ageInMonths) => {
  let recommendedNapHours = 2;
  let recommendedNightHours = 10;

  if (ageInMonths < 4) {
    // Newborn (0-3 months)
    recommendedNapHours = 8;
    recommendedNightHours = 8;
  } else if (ageInMonths >= 4 && ageInMonths <= 12) {
    // Infant (4-12 months)
    recommendedNapHours = 4;
    recommendedNightHours = 10;
  } else if (ageInMonths > 12 && ageInMonths <= 24) {
    // Toddler (1-2 years)
    recommendedNapHours = 2;
    recommendedNightHours = 11;
  } else if (ageInMonths > 24 && ageInMonths <= 60) {
    // Preschooler (3-5 years)
    recommendedNapHours = 1;
    recommendedNightHours = 11;
  } else {
    // School-age (6-12 years)
    recommendedNapHours = 0;
    recommendedNightHours = 10;
  }

  return { recommendedNapHours, recommendedNightHours };
};

// Add this new function to get current sleep data based on time of day
export const getCurrentSleepData = async (childId) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log(`Fetching current sleep data for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}/current`);
    console.log("Current sleep data response:", response.data);

    // Return the data with additional info about whether it's yesterday's data
    return {
      ...createSleepRecord(response.data),
      isBeforeNoon: response.data.isBeforeNoon,
      targetDate: response.data.targetDate,
    };
  } catch (error) {
    console.log("Error in getCurrentSleepData:", error.message);

    // Create a default record with zeros
    const today = new Date().toISOString().split("T")[0];
    let targetDate = today;
    let isBeforeNoon = false;

    // Try to extract data from error response if available
    if (error.response && error.response.status === 404) {
      console.log("404 error - No sleep record found");
      console.log("Error response data:", error.response.data);

      if (error.response.data) {
        targetDate = error.response.data.targetDate || today;
        isBeforeNoon = error.response.data.isBeforeNoon || false;
      }
    }

    console.log(
      `Creating default sleep record for date: ${targetDate}, isBeforeNoon: ${isBeforeNoon}`
    );

    // Return a default record with zeros
    return {
      id: null,
      childId,
      napHours: 0,
      nightHours: 0,
      date: targetDate,
      notes: "",
      totalHours: "0",
      isBeforeNoon: isBeforeNoon,
      targetDate: targetDate,
      isDefaultData: true, // Mark this as default data
    };
  }
};

// Save sleep data
export const saveSleepData = async (sleepData) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    // If we have an ID, update existing record
    if (sleepData.id) {
      return await updateSleepData(sleepData);
    }

    // Ensure data is properly formatted
    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: sleepData.date || new Date().toISOString().split("T")[0],
      notes: sleepData.notes || "",
    };

    console.log("Saving sleep data to database:", formattedData);

    // Otherwise create a new record
    const response = await api.post("/sleep", formattedData);
    console.log("Save sleep data response:", response.data);
    console.log("Database save successful with ID:", response.data.id);

    return createSleepRecord(response.data);
  } catch (error) {
    console.error("Error saving sleep data to database:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    // Throw the error instead of falling back to local storage
    throw error;
  }
};

// Update existing sleep data
export const updateSleepData = async (sleepData) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    // Ensure data is properly formatted
    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: sleepData.date || new Date().toISOString().split("T")[0],
      notes: sleepData.notes || "",
    };

    console.log(
      `Updating sleep data in database for ID: ${sleepData.id}`,
      formattedData
    );
    const response = await api.put(`/sleep/${sleepData.id}`, formattedData);
    console.log("Update sleep data response:", response.data);
    console.log("Database update successful for ID:", response.data.id);

    return createSleepRecord(response.data);
  } catch (error) {
    console.error("Error updating sleep data in database:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    // Throw the error instead of falling back to local storage
    throw error;
  }
};

// Delete sleep data
export const deleteSleepData = async (sleepId) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log(`Deleting sleep data with ID: ${sleepId} from database`);
    await api.delete(`/sleep/${sleepId}`);
    console.log("Sleep data deleted successfully from database");
    return true;
  } catch (error) {
    console.error("Error deleting sleep data from database:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    throw error;
  }
};

// Add this function to the sleep-service.js file
export const fetchSleepRecords = async (childId) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log(`Fetching sleep records for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}`);
    console.log("Sleep records response:", response.data);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep records:", error);
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    // Return empty array
    return [];
  }
};

// Local storage functions - keeping these for reference but they won't be used
const SLEEP_STORAGE_KEY = "kindergrow_sleep_data";

// Get all sleep data from local storage
const getLocalSleepData = async (childId) => {
  try {
    console.log(`Getting local sleep data for child ID: ${childId}`);
    const jsonValue = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
    if (!jsonValue) {
      console.log("No local sleep data found");
      return [];
    }

    const allData = JSON.parse(jsonValue);
    console.log("All local sleep data:", allData);
    const filteredData = allData.filter((item) => item.childId === childId);
    console.log("Filtered local sleep data:", filteredData);
    return filteredData.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error reading sleep data from storage:", error);
    return [];
  }
};

// Get today's sleep data from local storage
const getLocalTodaySleepData = async (childId) => {
  try {
    console.log(`Getting local today's sleep data for child ID: ${childId}`);
    const allData = await getLocalSleepData(childId);
    const today = new Date().toISOString().split("T")[0];
    console.log("Today's date:", today);

    const todayData = allData.find((item) => item.date === today);
    console.log("Today's local sleep data:", todayData);
    return todayData || null;
  } catch (error) {
    console.error("Error getting today's sleep data from storage:", error);
    return null;
  }
};

// Get sleep data by date range from local storage
const getLocalSleepDataByDateRange = async (childId, startDate, endDate) => {
  try {
    console.log(
      `Getting local sleep data for child ID: ${childId} from ${startDate} to ${endDate}`
    );
    const allData = await getLocalSleepData(childId);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const filteredData = allData.filter((item) => {
      const itemTime = new Date(item.date).getTime();
      return itemTime >= startTime && itemTime <= endTime;
    });
    console.log("Filtered local sleep data by date range:", filteredData);
    return filteredData;
  } catch (error) {
    console.error(
      "Error getting sleep data by date range from storage:",
      error
    );
    return [];
  }
};

// Save sleep data to local storage
const saveLocalSleepData = async (sleepData) => {
  try {
    console.log("Saving sleep data to local storage:", sleepData);
    // Get existing data
    const jsonValue = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
    let allData = jsonValue ? JSON.parse(jsonValue) : [];
    console.log("Existing local sleep data:", allData);

    // Check if we're updating an existing record
    if (sleepData.id) {
      console.log(`Updating local sleep data with ID: ${sleepData.id}`);
      allData = allData.map((item) =>
        item.id === sleepData.id ? { ...sleepData } : item
      );
    } else {
      // Generate a unique ID for new records
      sleepData.id = Date.now().toString();
      console.log(`Created new local sleep data with ID: ${sleepData.id}`);
      allData.push(sleepData);
    }

    // Save back to storage
    await AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(allData));
    console.log("Updated local sleep data:", allData);
    return createSleepRecord(sleepData);
  } catch (error) {
    console.error("Error saving sleep data to storage:", error);
    return null;
  }
};
