import api, { ensureToken } from "./api";
import { getLocalDateString, isLocalToday } from "../utils/date-utils";

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

export const getLocalDateTimeString = () => {
  const now = new Date();
  const romaniaOffset = 3 * 60 * 60 * 1000;
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

export const extractDateFromDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  return dateTimeString.split(" ")[0];
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
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
  const datePart = dateString.includes(" ")
    ? dateString.split(" ")[0]
    : dateString;
  return isLocalToday(datePart);
};

const API_BASE_URL = "/sleep";

export const getSleepByChild = async (childId) => {
  try {
    await ensureToken();
    console.log(`Fetching all sleep records for child: ${childId}`);
    const response = await api.get(`${API_BASE_URL}/child/${childId}`);
    console.log(`Found ${response.data.length} sleep records:`, response.data);
    return response.data.map((item) => createSleepRecord(item));
  } catch (error) {
    console.error("Error fetching sleep records:", error);
    throw error;
  }
};

export const getSleepDataByDateRange = async (childId, startDate, endDate) => {
  try {
    await ensureToken();

    console.log(
      `Fetching sleep data for child ${childId} from ${startDate} to ${endDate}`
    );

    let formattedStartDate, formattedEndDate;

    if (startDate instanceof Date) {
      formattedStartDate = startDate.toISOString().split("T")[0];
    } else {
      formattedStartDate =
        startDate.length === 10 ? startDate : startDate.split("T")[0];
    }

    if (endDate instanceof Date) {
      formattedEndDate = endDate.toISOString().split("T")[0];
    } else {
      formattedEndDate =
        endDate.length === 10 ? endDate : endDate.split("T")[0];
    }

    console.log(
      `🔍 Sleep Service - Formatted dates: ${formattedStartDate} to ${formattedEndDate}`
    );
    const response = await api.get(`${API_BASE_URL}/child/${childId}/range`, {
      params: {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      },
    });
    console.log(
      `Found ${response.data.length} sleep records in date range:`,
      response.data
    );

    const processedData = response.data.map((record) => {
      let day = null;
      if (record.date) {
        if (record.date.includes("T")) {
          day = record.date.split("T")[0].split("-")[2];
        } else if (record.date.includes(" ")) {
          day = record.date.split(" ")[0].split("-")[2];
        } else if (record.date.includes("-")) {
          day = record.date.split("-")[2];
        }

        day = day ? Number.parseInt(day, 10).toString() : null;
      }

      return {
        ...createSleepRecord(record),
        day,
      };
    });

    console.log("🔍 Sleep Service - Processed range data:", processedData);
    return processedData;
  } catch (error) {
    console.error("Error fetching sleep data by date range:", error);
    throw error;
  }
};

export const getWeeklySleepData = async (childId) => {
  try {
    await ensureToken();
    console.log(`Fetching weekly sleep data for child: ${childId}`);
    const response = await api.get(`${API_BASE_URL}/child/${childId}/weekly`);
    console.log(
      `Found ${response.data.length} weekly sleep records:`,
      response.data
    );

    const processedData = response.data.map((record) => {
      let day = null;
      if (record.date) {
        if (record.date.includes("T")) {
          day = record.date.split("T")[0].split("-")[2];
        } else if (record.date.includes(" ")) {
          day = record.date.split(" ")[0].split("-")[2];
        } else if (record.date.includes("-")) {
          day = record.date.split("-")[2];
        }

        day = day ? Number.parseInt(day, 10).toString() : null;
      }

      return {
        ...createSleepRecord(record),
        day,
      };
    });

    console.log("🔍 Sleep Service - Processed weekly data:", processedData);
    return processedData;
  } catch (error) {
    console.error("Error fetching weekly sleep data:", error);
    throw error;
  }
};

export const getTodaySleepData = async (childId) => {
  try {
    await ensureToken();
    console.log(`Fetching today's sleep data for child: ${childId}`);
    const response = await api.get(`${API_BASE_URL}/child/${childId}/today`);
    console.log("Today's sleep data:", response.data);
    return response.data ? createSleepRecord(response.data) : null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("No sleep data found for today (404). Returning null.");
      return null;
    }
    console.error("Error fetching today's sleep data:", error);
    throw error;
  }
};

export const getCurrentSleepData = async (childId) => {
  try {
    await ensureToken();
    console.log(`Fetching current sleep data for child: ${childId}`);
    const response = await api.get(`${API_BASE_URL}/child/${childId}/current`);
    console.log("Current sleep data:", response.data);

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

export const createSleepRecordApi = async (sleepData) => {
  try {
    await ensureToken();
    console.log("Creating sleep record with data:", sleepData);

    const romaniaDatetime = getLocalDateTimeString();

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: romaniaDatetime,
      notes: sleepData.notes.trim(),
      sleepProgress: sleepData.sleepProgress || 0,
    };

    const response = await api.post(API_BASE_URL, formattedData);
    console.log("Sleep record created successfully:", response.data);
    return createSleepRecord(response.data);
  } catch (error) {
    console.error("Error creating sleep record:", error);
    throw error;
  }
};

export const updateSleepRecord = async (sleepId, sleepData) => {
  try {
    await ensureToken();
    console.log(`Updating sleep record ${sleepId} with data:`, sleepData);

    const romaniaDatetime = getLocalDateTimeString();

    const formattedData = {
      childId: sleepData.childId,
      napHours: Number.parseFloat(sleepData.napHours) || 0,
      nightHours: Number.parseFloat(sleepData.nightHours) || 0,
      date: romaniaDatetime,
      notes: sleepData.notes.trim(),
      sleepProgress: sleepData.sleepProgress || 0,
    };

    const response = await api.put(`${API_BASE_URL}/${sleepId}`, formattedData);
    console.log("Sleep record updated successfully:", response.data);
    return createSleepRecord(response.data);
  } catch (error) {
    console.error("Error updating sleep record:", error);
    throw error;
  }
};

export const deleteSleepRecord = async (sleepId) => {
  try {
    await ensureToken();
    console.log(`Deleting sleep record: ${sleepId}`);
    const response = await api.delete(`${API_BASE_URL}/${sleepId}`);
    console.log("Sleep record deleted successfully");
    return response.data;
  } catch (error) {
    console.error("Error deleting sleep record:", error);
    throw error;
  }
};

export const getSleepById = async (sleepId) => {
  try {
    await ensureToken();
    console.log(`Fetching sleep record: ${sleepId}`);
    const response = await api.get(`${API_BASE_URL}/${sleepId}`);
    console.log("Sleep record found:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching sleep record:", error);
    throw error;
  }
};

export const getSleepDataByMonth = async (childId, year, month) => {
  try {
    await ensureToken();

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth() + 1;

    console.log(
      `📅 Sleep Service - Fetching sleep data for month: ${targetYear}-${String(
        targetMonth
      ).padStart(2, "0")}`
    );

    const url = `${API_BASE_URL}/child/${childId}/monthly`;
    const params = { year: targetYear, month: targetMonth };
    console.log(`📡 API Request: GET ${url}`, params);

    const response = await api.get(url, { params });

    console.log(
      `✅ Found ${
        response.data.length
      } monthly sleep records for ${targetYear}-${String(targetMonth).padStart(
        2,
        "0"
      )}:`,
      response.data
    );

    const processedData = response.data.map((record) => {
      let day = null;
      if (record.date) {
        if (record.date.includes("T")) {
          day = record.date.split("T")[0].split("-")[2];
        } else if (record.date.includes(" ")) {
          day = record.date.split(" ")[0].split("-")[2];
        } else if (record.date.includes("-")) {
          day = record.date.split("-")[2];
        }

        day = day ? Number.parseInt(day, 10).toString() : null;
      }

      return {
        ...createSleepRecord(record),
        day,
      };
    });

    console.log("🔍 Sleep Service - Processed monthly data:", processedData);
    return processedData;
  } catch (error) {
    console.error("❌ Error fetching monthly sleep data:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
          }
        : "No response",
      request: error.request
        ? "Request made but no response received"
        : "No request made",
    });

    return [];
  }
};

export const getMonthlySleepData = async (childId, year, month) => {
  return await getSleepDataByMonth(childId, year, month);
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

export const saveSleepData = async (sleepData) => {
  try {
    if (sleepData.id) {
      return await updateSleepRecord(sleepData.id, sleepData);
    }
    return await createSleepRecordApi(sleepData);
  } catch (error) {
    console.error("Error saving sleep data:", error);
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

export const getDailySleepData = async (childId) => {
  try {
    await ensureToken();
    console.log(`Fetching daily sleep data for child: ${childId}`);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return await getMonthlySleepData(childId, year, month);
  } catch (error) {
    console.error("Error fetching daily sleep data:", error);
    throw error;
  }
};
