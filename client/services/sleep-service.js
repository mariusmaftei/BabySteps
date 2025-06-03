import api, { ensureToken } from "./api";
import {
  getLocalDateString,
  isLocalToday,
  getCurrentWeekDates,
} from "../utils/date-utils";

const createSleepRecord = (data) => {
  console.log("Creating sleep record from data:", data);
  return {
    id: data.id || null,
    childId: data.childId,
    napHours: data.napHours || 0,
    nightHours: data.nightHours || 0,
    date: data.date || getLocalDateTimeString(),
    notes: data.notes || "",
    totalHours: (
      Number.parseFloat(data.napHours || 0) +
      Number.parseFloat(data.nightHours || 0)
    ).toFixed(1),
    autoFilled: data.autoFilled || false,
    sleepProgress: data.sleepProgress || 0,
  };
};

// Helper function to get current Romanian datetime string (YYYY-MM-DD HH:MM:SS)
export const getLocalDateTimeString = () => {
  const now = new Date();
  const romaniaOffset = 3 * 60 * 60 * 1000; // UTC+3 for Romania (EEST)
  const romaniaTime = new Date(
    now.getTime() + now.getTimezoneOffset() * 60 * 1000 + romaniaOffset
  );

  const year = romaniaTime.getFullYear();
  const month = String(romaniaTime.getMonth() + 1).padStart(2, "0");
  const day = String(romaniaTime.getDate()).padStart(2, "0");
  const hours = String(romaniaTime.getHours()).padStart(2, "0");
  const minutes = String(romaniaTime.getMinutes()).padStart(2, "0");
  const seconds = String(romaniaTime.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Helper function to extract just the date part from a datetime string
export const extractDateFromDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  return dateTimeString.split(" ")[0];
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  // Extract just the date part if it's a datetime string
  const datePart = dateString.includes(" ")
    ? dateString.split(" ")[0]
    : dateString;
  const date = new Date(datePart);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isToday = (dateString) => {
  // Extract just the date part if it's a datetime string
  const datePart = dateString.includes(" ")
    ? dateString.split(" ")[0]
    : dateString;
  return isLocalToday(datePart);
};

export const getChildSleepData = async (childId) => {
  try {
    await ensureToken();
    console.log(`Fetching all sleep data for child ${childId}`);
    const response = await api.get(`/sleep/child/${childId}`);
    console.log("Raw sleep data from API:", response.data);
    const processedData = response.data.map((item) => createSleepRecord(item));
    console.log("Processed sleep data:", processedData);
    return processedData;
  } catch (error) {
    console.error("Error fetching child sleep data:", error);
    throw error;
  }
};

export const getTodaySleepData = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/sleep/child/${childId}/today`);
    return response.data ? createSleepRecord(response.data) : null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const today = getLocalDateTimeString();

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
    throw error;
  }
};

export const getSleepDataByDateRange = async (
  childId,
  startDateStr,
  endDateStr
) => {
  try {
    await ensureToken();

    console.log(`Fetching sleep data from ${startDateStr} to ${endDateStr}`);

    // For date range queries, we need to handle both date and datetime formats
    // If we receive date-only strings, convert them to datetime ranges
    let startDateTime, endDateTime;

    if (startDateStr.length === 10) {
      // Date only format (YYYY-MM-DD)
      startDateTime = `${startDateStr} 00:00:00`;
    } else {
      startDateTime = startDateStr;
    }

    if (endDateStr.length === 10) {
      // Date only format (YYYY-MM-DD)
      endDateTime = `${endDateStr} 23:59:59`;
    } else {
      endDateTime = endDateStr;
    }

    console.log(
      `Converted to datetime range: ${startDateTime} to ${endDateTime}`
    );

    const response = await api.get(
      `/sleep/child/${childId}/range?startDate=${encodeURIComponent(
        startDateTime
      )}&endDate=${encodeURIComponent(endDateTime)}`
    );

    console.log("Sleep data range response:", response.data);
    const processedData = response.data.map((item) => createSleepRecord(item));
    console.log("Processed range data:", processedData);
    return processedData;
  } catch (error) {
    console.error("Error fetching sleep data by date range:", error);
    throw error;
  }
};

export const getSleepDataByMonth = async (childId, year, month) => {
  try {
    await ensureToken();

    console.log(`Fetching sleep data for month: ${year}-${month + 1}`);

    // Get the first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = `${firstDay.getFullYear()}-${String(
      firstDay.getMonth() + 1
    ).padStart(2, "0")}-${String(firstDay.getDate()).padStart(2, "0")}`;
    const endDate = `${lastDay.getFullYear()}-${String(
      lastDay.getMonth() + 1
    ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

    console.log(`Month range: ${startDate} to ${endDate}`);

    return await getSleepDataByDateRange(childId, startDate, endDate);
  } catch (error) {
    console.error("Error fetching monthly sleep data:", error);
    throw error;
  }
};

export const getWeeklySleepData = async (childId) => {
  try {
    console.log("Fetching weekly sleep data");
    const { startDate, endDate } = getCurrentWeekDates();
    console.log(`Week range: ${startDate} to ${endDate}`);
    return await getSleepDataByDateRange(childId, startDate, endDate);
  } catch (error) {
    console.error("Error fetching weekly sleep data:", error);
    throw error;
  }
};

export const getMonthlySleepData = async (childId) => {
  try {
    console.log("Fetching current month sleep data");
    const today = new Date();
    return await getSleepDataByMonth(
      childId,
      today.getFullYear(),
      today.getMonth()
    );
  } catch (error) {
    console.error("Error fetching current monthly sleep data:", error);
    throw error;
  }
};

export const getYearlySleepData = async (childId) => {
  const today = new Date();
  const endDate = getLocalDateString();
  const endDateTime = `${endDate} 23:59:59`;

  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);
  const startDateStr =
    startDate.getFullYear() +
    "-" +
    String(startDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(startDate.getDate()).padStart(2, "0");
  const startDateTime = `${startDateStr} 00:00:00`;

  return await getSleepDataByDateRange(childId, startDateTime, endDateTime);
};

export const formatDateForPeriod = (date, period) => {
  // Extract just the date part if it's a datetime string
  const datePart = date.includes(" ") ? date.split(" ")[0] : date;

  if (period === "week") {
    return new Date(datePart)
      .toLocaleDateString("en-US", { weekday: "short" })
      .substring(0, 3);
  } else if (period === "month") {
    return new Date(datePart).toLocaleDateString("en-US", { day: "2-digit" });
  } else if (period === "year") {
    return new Date(datePart)
      .toLocaleDateString("en-US", { month: "short" })
      .substring(0, 3);
  }
  return datePart;
};

export const aggregateSleepDataByMonth = (sleepData) => {
  console.log("Aggregating sleep data by month:", sleepData);
  const monthlyData = {};

  sleepData.forEach((record) => {
    // Extract just the date part if it's a datetime string
    const datePart = record.date.includes(" ")
      ? record.date.split(" ")[0]
      : record.date;
    const date = new Date(datePart);
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

  const result = Object.values(monthlyData)
    .map((item) => ({
      date: item.date.toISOString().split("T")[0],
      month: item.month,
      totalHours: (item.totalHours / item.count).toFixed(1),
      count: item.count,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  console.log("Aggregated monthly data:", result);
  return result;
};

export const getCurrentSleepData = async (childId) => {
  try {
    await ensureToken();

    const response = await api.get(`/sleep/child/${childId}/current`);

    return {
      ...createSleepRecord(response.data),
      isBeforeNoon: response.data.isBeforeNoon,
      targetDate: response.data.targetDate,
    };
  } catch (error) {
    const today = getLocalDateTimeString();
    let targetDate = today;
    let isBeforeNoon = false;

    if (error.response && error.response.status === 404) {
      if (error.response.data) {
        targetDate = error.response.data.targetDate || today;
        isBeforeNoon = error.response.data.isBeforeNoon || false;
      }
    }

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

    // Get current Romanian datetime
    const romaniaDatetime = getLocalDateTimeString();

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: romaniaDatetime,
      notes: sleepData.notes || "",
      sleepProgress: sleepData.sleepProgress || 0,
    };

    console.log(`Saving sleep data with Romanian datetime: ${romaniaDatetime}`);

    const response = await api.post("/sleep", formattedData);

    return createSleepRecord(response.data);
  } catch (error) {
    console.error("Error saving sleep data:", error);
    throw error;
  }
};

export const updateSleepData = async (sleepData) => {
  try {
    await ensureToken();

    // Get current Romanian datetime
    const romaniaDatetime = getLocalDateTimeString();

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: romaniaDatetime,
      notes: sleepData.notes || "",
      sleepProgress: sleepData.sleepProgress || 0,
    };

    console.log(
      `Updating sleep data with Romanian datetime: ${romaniaDatetime}`
    );

    const response = await api.put(`/sleep/${sleepData.id}`, formattedData);

    return createSleepRecord(response.data);
  } catch (error) {
    console.error("Error updating sleep data:", error);
    throw error;
  }
};

export const deleteSleepData = async (sleepId) => {
  try {
    await ensureToken();

    await api.delete(`/sleep/${sleepId}`);
    return true;
  } catch (error) {
    throw error;
  }
};

export const fetchSleepRecords = async (childId) => {
  try {
    await ensureToken();
    console.log(`Fetching sleep records for child ${childId}`);
    const response = await api.get(`/sleep/child/${childId}`);
    console.log("Fetched sleep records:", response.data);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep records:", error);
    return [];
  }
};
