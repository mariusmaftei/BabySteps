import api, { ensureToken } from "./api";
import {
  getLocalDateString,
  isLocalToday,
  getCurrentWeekDates,
  getMonthDates,
} from "../utils/date-utils";

const createSleepRecord = (data) => {
  return {
    id: data.id || null,
    childId: data.childId,
    napHours: data.napHours || 0,
    nightHours: data.nightHours || 0,
    date: data.date || getLocalDateString(),
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
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isToday = (dateString) => {
  return isLocalToday(dateString);
};

export const getChildSleepData = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/sleep/child/${childId}`);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
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
      const today = getLocalDateString();

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

    const response = await api.get(
      `/sleep/child/${childId}/range?startDate=${startDateStr}&endDate=${endDateStr}`
    );

    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep data by date range:", error);
    throw error;
  }
};

export const getSleepDataByMonth = async (childId, year, month) => {
  try {
    await ensureToken();

    const { startDate, endDate } = getMonthDates(year, month);
    return await getSleepDataByDateRange(childId, startDate, endDate);
  } catch (error) {
    throw error;
  }
};

export const getWeeklySleepData = async (childId) => {
  const { startDate, endDate } = getCurrentWeekDates();
  return await getSleepDataByDateRange(childId, startDate, endDate);
};

export const getMonthlySleepData = async (childId) => {
  const today = new Date();
  return await getSleepDataByMonth(
    childId,
    today.getFullYear(),
    today.getMonth()
  );
};

export const getYearlySleepData = async (childId) => {
  const today = new Date();
  const endDate = getLocalDateString();

  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);
  const startDateStr =
    startDate.getFullYear() +
    "-" +
    String(startDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(startDate.getDate()).padStart(2, "0");

  return await getSleepDataByDateRange(childId, startDateStr, endDate);
};

export const formatDateForPeriod = (date, period) => {
  if (period === "week") {
    return new Date(date)
      .toLocaleDateString("en-US", { weekday: "short" })
      .substring(0, 3);
  } else if (period === "month") {
    return new Date(date).toLocaleDateString("en-US", { day: "2-digit" });
  } else if (period === "year") {
    return new Date(date)
      .toLocaleDateString("en-US", { month: "short" })
      .substring(0, 3);
  }
  return date;
};

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

  return Object.values(monthlyData)
    .map((item) => ({
      date: item.date.toISOString().split("T")[0],
      month: item.month,
      totalHours: (item.totalHours / item.count).toFixed(1),
      count: item.count,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
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
    const today = getLocalDateString();
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

    // Make sure we're using the local date
    const localDate = sleepData.date || getLocalDateString();

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: localDate,
      notes: sleepData.notes || "",
      sleepProgress: sleepData.sleepProgress || 0,
    };

    console.log(`Saving sleep data with local date: ${localDate}`);

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

    // Make sure we're using the local date
    const localDate = sleepData.date || getLocalDateString();

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: localDate,
      notes: sleepData.notes || "",
      sleepProgress: sleepData.sleepProgress || 0,
    };

    console.log(`Updating sleep data with local date: ${localDate}`);

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
    const response = await api.get(`/sleep/child/${childId}`);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    return [];
  }
};
