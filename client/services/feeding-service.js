import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { ensureToken } from "./api";

const createFeedingRecord = (data) => {
  return {
    id: data.id || null,
    childId: data.childId,
    type: data.type || "breastfeeding", // breastfeeding, bottleFeeding, solidFood
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    duration: data.duration || 0,
    side: data.side || null, // left, right, both
    amount: data.amount || 0,
    unit: data.unit || null, // ml, oz, g
    foodType: data.foodType || null,
    notes: data.notes || data.note || "",
    date: data.date || new Date().toISOString().split("T")[0],
    timestamp: data.timestamp || new Date().toISOString(),
  };
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getChildFeedingData = async (childId) => {
  try {
    await ensureToken();

    console.log(`Fetching feeding data for child ID: ${childId}`);
    const response = await api.get(`/feeding/child/${childId}`);

    console.log("API Request: GET /feeding/child/" + childId);

    if (response.status === 200) {
      console.log("API Response Status:", response.status);
      if (response.data && response.data.data) {
        console.log("Feeding data response:", response.data);
        return response.data.data.map((item) => createFeedingRecord(item));
      }
    } else {
      console.error("Unexpected response status:", response.status);
    }

    return [];
  } catch (error) {
    console.error("Error fetching feeding data:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    return [];
  }
};

export const getTodayFeedingData = async (childId) => {
  try {
    await ensureToken();

    console.log(`Fetching today's feeding data for child ID: ${childId}`);

    try {
      // First try the /today endpoint
      console.log("API Request: GET /feeding/child/" + childId + "/today");
      const response = await api.get(`/feeding/child/${childId}/today`);

      console.log("API Response Status:", response.status);
      if (response.data && response.data.data) {
        console.log("Today's feeding data response:", response.data);
        return response.data.data.map((item) => createFeedingRecord(item));
      }

      return [];
    } catch (todayError) {
      console.error("API Response Error:", todayError);
      console.error("Error Status:", todayError.response?.status);
      console.error("Error Data:", todayError.response?.data);

      console.log("Error with /today endpoint, falling back to date-range");

      // If /today endpoint fails, fall back to date-range
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const formattedStartDate = startOfDay.toISOString().split("T")[0];
      const formattedEndDate = endOfDay.toISOString().split("T")[0];

      console.log(
        `Falling back to date range: ${formattedStartDate} to ${formattedEndDate}`
      );
      console.log(
        "API Request: GET /feeding/child/" +
          childId +
          "/date-range?startDate=" +
          formattedStartDate +
          "&endDate=" +
          formattedEndDate
      );

      const response = await api.get(
        `/feeding/child/${childId}/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );

      console.log("API Response Status:", response.status);
      if (response.data && response.data.data) {
        console.log("Date range fallback response:", response.data);
        return response.data.data.map((item) => createFeedingRecord(item));
      }

      return [];
    }
  } catch (error) {
    console.log("Error fetching today's feeding data:", error.message || error);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    // Return empty array for any error
    return [];
  }
};

export const getFeedingDataByDateRange = async (
  childId,
  startDate,
  endDate
) => {
  try {
    await ensureToken();

    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    console.log(
      `Fetching feeding data for child ID: ${childId} from ${formattedStartDate} to ${formattedEndDate}`
    );
    console.log(
      "API Request: GET /feeding/child/" +
        childId +
        "/date-range?startDate=" +
        formattedStartDate +
        "&endDate=" +
        formattedEndDate
    );

    const response = await api.get(
      `/feeding/child/${childId}/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
    );

    console.log("API Response Status:", response.status);
    if (response.data && response.data.data) {
      console.log("Feeding data by date range response:", response.data);
      return response.data.data.map((item) => createFeedingRecord(item));
    }

    return [];
  } catch (error) {
    console.log(
      "Error fetching feeding data by date range:",
      error.message || error
    );
    // Return empty array for any error
    return [];
  }
};

// Function to get weekly feeding data (last 7 days)
export const getWeeklyFeedingData = async (childId) => {
  try {
    console.log(`Getting weekly feeding data for child ID: ${childId}`);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    console.log(
      `Fetching feeding data from ${startDate.toISOString().split("T")[0]} to ${
        endDate.toISOString().split("T")[0]
      }`
    );

    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(
      `Retrieved ${result ? result.length : 0} feeding records for the week`
    );

    // If the API call fails, return an empty array instead of throwing an error
    return result || [];
  } catch (error) {
    console.error("Error in getWeeklyFeedingData:", error.message || error);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    return [];
  }
};

// Function to get monthly feeding data (last 30 days)
export const getMonthlyFeedingData = async (childId) => {
  try {
    console.log(`Getting monthly feeding data for child ID: ${childId}`);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log(
      `Fetching feeding data from ${startDate.toISOString().split("T")[0]} to ${
        endDate.toISOString().split("T")[0]
      }`
    );

    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(
      `Retrieved ${result ? result.length : 0} feeding records for the month`
    );

    // If the API call fails, return an empty array instead of throwing an error
    return result || [];
  } catch (error) {
    console.error("Error in getMonthlyFeedingData:", error.message || error);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    return [];
  }
};

export const getFeedingSummary = async (childId, date) => {
  try {
    await ensureToken();

    const formattedDate = date
      ? date.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    console.log(
      `Fetching feeding summary for child ID: ${childId} on ${formattedDate}`
    );
    console.log(
      "API Request: GET /feeding/child/" +
        childId +
        "/summary?date=" +
        formattedDate
    );

    const response = await api.get(
      `/feeding/child/${childId}/summary?date=${formattedDate}`
    );

    console.log("API Response Status:", response.status);
    if (response.data && response.data.data) {
      console.log("Feeding summary response:", response.data);
      return response.data.data;
    }

    // Return default summary if no data
    return {
      breastFeedings: { count: 0, totalMinutes: 0, leftSide: 0, rightSide: 0 },
      bottleFeedings: { count: 0, totalMl: 0 },
      solidFeedings: { count: 0, totalGrams: 0 },
    };
  } catch (error) {
    console.log("Error fetching feeding summary:", error.message || error);
    // Return default summary for any error
    return {
      breastFeedings: { count: 0, totalMinutes: 0, leftSide: 0, rightSide: 0 },
      bottleFeedings: { count: 0, totalMl: 0 },
      solidFeedings: { count: 0, totalGrams: 0 },
    };
  }
};

export const saveBreastfeedingData = async (feedingData) => {
  try {
    await ensureToken();

    const formattedData = {
      childId: feedingData.childId,
      type: "breast",
      startTime: feedingData.startTime,
      endTime: feedingData.endTime,
      duration: feedingData.duration,
      side: feedingData.side,
      amount: 0, // Explicitly set to 0 for breastfeeding
      notes: feedingData.notes || "",
      date: feedingData.date || new Date().toISOString().split("T")[0],
      timestamp: feedingData.timestamp || new Date().toISOString(),
    };

    console.log("Saving breastfeeding data to database:", formattedData);

    if (feedingData.id) {
      console.log("API Request: PUT /feeding/" + feedingData.id);
      const response = await api.put(
        `/feeding/${feedingData.id}`,
        formattedData
      );
      console.log("API Response Status:", response.status);
      console.log("Update breastfeeding data response:", response.data);
      return createFeedingRecord(response.data.data || response.data);
    } else {
      console.log("API Request: POST /feeding");
      const response = await api.post("/feeding", formattedData);
      console.log("API Response Status:", response.status);
      console.log("Save breastfeeding data response:", response.data);
      return createFeedingRecord(response.data.data || response.data);
    }
  } catch (error) {
    console.error("Error saving breastfeeding data to database:", error);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    throw error;
  }
};

export const saveBottleFeedingData = async (feedingData) => {
  try {
    await ensureToken();

    const formattedData = {
      childId: feedingData.childId,
      type: "bottle",
      startTime: null, // Explicitly set to null for bottle feeding
      endTime: null, // Explicitly set to null for bottle feeding
      duration: 0, // Explicitly set to 0 for bottle feeding
      side: null, // Explicitly set to null for bottle feeding
      amount: feedingData.amount,
      unit: feedingData.unit || "ml",
      notes: feedingData.notes || "",
      date: feedingData.date || new Date().toISOString().split("T")[0],
      timestamp: feedingData.timestamp || new Date().toISOString(),
    };

    console.log("Saving bottle feeding data to database:", formattedData);

    if (feedingData.id) {
      console.log("API Request: PUT /feeding/" + feedingData.id);
      const response = await api.put(
        `/feeding/${feedingData.id}`,
        formattedData
      );
      console.log("API Response Status:", response.status);
      console.log("Update bottle feeding data response:", response.data);
      return createFeedingRecord(response.data.data || response.data);
    } else {
      console.log("API Request: POST /feeding");
      const response = await api.post("/feeding", formattedData);
      console.log("API Response Status:", response.status);
      console.log("Save bottle feeding data response:", response.data);
      return createFeedingRecord(response.data.data || response.data);
    }
  } catch (error) {
    console.error("Error saving bottle feeding data to database:", error);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    throw error;
  }
};

export const saveSolidFoodData = async (feedingData) => {
  try {
    await ensureToken();

    const formattedData = {
      childId: feedingData.childId,
      type: "solid",
      startTime: null, // Explicitly set to null for solid food
      endTime: null, // Explicitly set to null for solid food
      duration: 0, // Explicitly set to 0 for solid food
      side: null, // Explicitly set to null for solid food
      amount: feedingData.amount,
      unit: feedingData.unit || "g",
      foodType: feedingData.foodType,
      notes: feedingData.notes || "",
      date: feedingData.date || new Date().toISOString().split("T")[0],
      timestamp: feedingData.timestamp || new Date().toISOString(),
    };

    console.log("Saving solid food data to database:", formattedData);

    if (feedingData.id) {
      console.log("API Request: PUT /feeding/" + feedingData.id);
      const response = await api.put(
        `/feeding/${feedingData.id}`,
        formattedData
      );
      console.log("API Response Status:", response.status);
      console.log("Update solid food data response:", response.data);
      return createFeedingRecord(response.data.data || response.data);
    } else {
      console.log("API Request: POST /feeding");
      const response = await api.post("/feeding", formattedData);
      console.log("API Response Status:", response.status);
      console.log("Save solid food data response:", response.data);
      return createFeedingRecord(response.data.data || response.data);
    }
  } catch (error) {
    console.error("Error saving solid food data to database:", error);
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    throw error;
  }
};

export const deleteFeedingData = async (feedingId) => {
  try {
    await ensureToken();

    console.log(`Deleting feeding data with ID: ${feedingId} from database`);
    console.log("API Request: DELETE /feeding/" + feedingId);

    const response = await api.delete(`/feeding/${feedingId}`);

    console.log("API Response Status:", response.status);
    console.log("Feeding data deleted successfully from database");
    return true;
  } catch (error) {
    console.error("Error deleting feeding data from database:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    throw error;
  }
};

// Local storage functions kept for reference but not used
const FEEDING_STORAGE_KEY = "kindergrow_feeding_data";

const getLocalFeedingData = async (childId) => {
  try {
    console.log(`Getting local feeding data for child ID: ${childId}`);
    const jsonValue = await AsyncStorage.getItem(FEEDING_STORAGE_KEY);
    if (!jsonValue) {
      console.log("No local feeding data found");
      return [];
    }

    const allData = JSON.parse(jsonValue);
    console.log("All local feeding data:", allData);
    const filteredData = allData.filter((item) => item.childId === childId);
    console.log("Filtered local feeding data:", filteredData);
    return filteredData.map((item) => createFeedingRecord(item));
  } catch (error) {
    console.error("Error reading feeding data from storage:", error);
    return [];
  }
};

const saveLocalFeedingData = async (feedingData) => {
  try {
    console.log("Saving feeding data to local storage:", feedingData);
    // Get existing data
    const jsonValue = await AsyncStorage.getItem(FEEDING_STORAGE_KEY);
    let allData = jsonValue ? JSON.parse(jsonValue) : [];
    console.log("Existing local feeding data:", allData);

    // Check if we're updating an existing record
    if (feedingData.id) {
      console.log(`Updating local feeding data with ID: ${feedingData.id}`);
      allData = allData.map((item) =>
        item.id === feedingData.id ? { ...feedingData } : item
      );
    } else {
      // Generate a unique ID for new records
      feedingData.id = Date.now().toString();
      console.log(`Created new local feeding data with ID: ${feedingData.id}`);
      allData.push(feedingData);
    }

    // Save back to storage
    await AsyncStorage.setItem(FEEDING_STORAGE_KEY, JSON.stringify(allData));
    console.log("Updated local feeding data:", allData);
    return createFeedingRecord(feedingData);
  } catch (error) {
    console.error("Error saving feeding data to storage:", error);
    return null;
  }
};
