import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { ensureToken } from "./api";

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
    sleepProgress: data.sleepProgress || 0,
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

export const getChildSleepData = async (childId) => {
  try {
    await ensureToken();

    console.log(`Fetching sleep data for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}`);
    console.log("Sleep data response:", response.data);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep data:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    return [];
  }
};

export const getTodaySleepData = async (childId) => {
  try {
    await ensureToken();

    console.log(`Fetching today's sleep data for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}/today`);
    console.log("Today's sleep data response:", response.data);
    return response.data ? createSleepRecord(response.data) : null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("No sleep record found for today, creating default record");

      // Create a default record for today
      const today = new Date().toISOString().split("T")[0];

      return {
        id: null,
        childId: childId,
        napHours: 0,
        nightHours: 0,
        date: today,
        notes: "",
        totalHours: "0",
        isDefaultData: true,
        sleepProgress: 0,
      };
    }
    console.error("Error fetching today's sleep data:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    return null;
  }
};

export const getSleepDataByDateRange = async (childId, startDate, endDate) => {
  try {
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
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    return [];
  }
};

export const getWeeklySleepData = async (childId) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return await getSleepDataByDateRange(childId, startDate, endDate);
};

export const getMonthlySleepData = async (childId) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Get last 30 days

  return await getSleepDataByDateRange(childId, startDate, endDate);
};

export const getYearlySleepData = async (childId) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // Get last 365 days

  return await getSleepDataByDateRange(childId, startDate, endDate);
};

// Add this helper function to format dates for different time periods
export const formatDateForPeriod = (date, period) => {
  if (period === "week") {
    return new Date(date)
      .toLocaleDateString("en-US", { weekday: "short" })
      .substring(0, 3);
  } else if (period === "month") {
    return new Date(date)
      .toLocaleDateString("en-US", { day: "2-digit", month: "short" })
      .substring(0, 5);
  } else if (period === "year") {
    return new Date(date)
      .toLocaleDateString("en-US", { month: "short" })
      .substring(0, 3);
  }
  return date;
};

// Add this function to aggregate sleep data by month for yearly view
export const aggregateSleepDataByMonth = (sleepData) => {
  const monthlyData = {};

  sleepData.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        totalHours: 0,
        count: 0,
        date: new Date(date.getFullYear(), date.getMonth(), 1),
      };
    }

    monthlyData[monthKey].totalHours += Number.parseFloat(record.totalHours);
    monthlyData[monthKey].count += 1;
  });

  // Calculate averages and sort by date
  return Object.values(monthlyData)
    .map((item) => ({
      date: item.date.toISOString().split("T")[0],
      month: item.month,
      totalHours: (item.totalHours / item.count).toFixed(1),
      count: item.count,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const getChildAgeInMonths = (child) => {
  if (!child || !child.age) return 24;

  const ageText = child.age;
  const ageNum = Number.parseInt(ageText.split(" ")[0]) || 0;
  const ageUnit = ageText.includes("month") ? "months" : "years";

  return ageUnit === "months" ? ageNum : ageNum * 12;
};

const getRecommendedSleepHours = (ageInMonths) => {
  let recommendedNapHours = 2;
  let recommendedNightHours = 10;

  if (ageInMonths < 4) {
    recommendedNapHours = 8;
    recommendedNightHours = 8;
  } else if (ageInMonths >= 4 && ageInMonths <= 12) {
    recommendedNapHours = 4;
    recommendedNightHours = 10;
  } else if (ageInMonths > 12 && ageInMonths <= 24) {
    recommendedNapHours = 2;
    recommendedNightHours = 11;
  } else if (ageInMonths > 24 && ageInMonths <= 60) {
    recommendedNapHours = 1;
    recommendedNightHours = 11;
  } else {
    recommendedNapHours = 0;
    recommendedNightHours = 10;
  }

  return { recommendedNapHours, recommendedNightHours };
};

export const getCurrentSleepData = async (childId) => {
  try {
    await ensureToken();

    console.log(`Fetching current sleep data for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}/current`);
    console.log("Current sleep data response:", response.data);

    return {
      ...createSleepRecord(response.data),
      isBeforeNoon: response.data.isBeforeNoon,
      targetDate: response.data.targetDate,
    };
  } catch (error) {
    console.log("Error in getCurrentSleepData:", error.message);

    const today = new Date().toISOString().split("T")[0];
    let targetDate = today;
    let isBeforeNoon = false;

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
      isDefaultData: true,
      sleepProgress: 0,
    };
  }
};

export const saveSleepData = async (sleepData) => {
  try {
    await ensureToken();

    if (sleepData.id) {
      return await updateSleepData(sleepData);
    }

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: sleepData.date || new Date().toISOString().split("T")[0],
      notes: sleepData.notes || "",
      sleepProgress: sleepData.sleepProgress || 0,
    };

    console.log("Saving sleep data to database:", formattedData);

    const response = await api.post("/sleep", formattedData);
    console.log("Save sleep data response:", response.data);
    console.log("Database save successful with ID:", response.data.id);

    return createSleepRecord(response.data);
  } catch (error) {
    console.error("Error saving sleep data to database:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    throw error;
  }
};

export const updateSleepData = async (sleepData) => {
  try {
    await ensureToken();

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: sleepData.date || new Date().toISOString().split("T")[0],
      notes: sleepData.notes || "",
      sleepProgress: sleepData.sleepProgress || 0,
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
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    throw error;
  }
};

export const deleteSleepData = async (sleepId) => {
  try {
    await ensureToken();

    console.log(`Deleting sleep data with ID: ${sleepId} from database`);
    await api.delete(`/sleep/${sleepId}`);
    console.log("Sleep data deleted successfully from database");
    return true;
  } catch (error) {
    console.error("Error deleting sleep data from database:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    throw error;
  }
};

export const fetchSleepRecords = async (childId) => {
  try {
    await ensureToken();

    console.log(`Fetching sleep records for child ID: ${childId}`);
    const response = await api.get(`/sleep/child/${childId}`);
    console.log("Sleep records response:", response.data);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep records:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    return [];
  }
};

// Local storage functions kept for reference but not used
const SLEEP_STORAGE_KEY = "kindergrow_sleep_data";

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
