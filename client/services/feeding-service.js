import api, { ensureToken } from "./api";

export const getCurrentDateTimeString = () => {
  const now = new Date();
  const romaniaTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const year = romaniaTime.getUTCFullYear();
  const month = String(romaniaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(romaniaTime.getUTCDate()).padStart(2, "0");
  const hours = String(romaniaTime.getUTCHours()).padStart(2, "0");
  const minutes = String(romaniaTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(romaniaTime.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const createFeedingRecord = (data) => {
  const currentDateTime = getCurrentDateTimeString();

  return {
    id: data.id || null,
    childId: data.childId,
    type: data.type || "breastfeeding",
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    duration: data.duration || 0,
    side: data.side || null,
    amount: data.amount || 0,
    unit: data.unit || null,
    foodType: data.foodType || null,
    notes: data.notes || data.note || "",
    date: data.date || currentDateTime,
    timestamp: data.timestamp || currentDateTime,
  };
};

const createAggregatedDayRecord = (data) => {
  return {
    date: data.date,
    breastFeedings: data.breastFeedings || {
      count: 0,
      totalMinutes: 0,
      leftSide: 0,
      rightSide: 0,
    },
    bottleFeedings: data.bottleFeedings || { count: 0, totalMl: 0 },
    solidFeedings: data.solidFeedings || { count: 0, totalGrams: 0 },
    totalFeedings: data.totalFeedings || 0,
  };
};

export const getDayFromTimestamp = (dateString) => {
  if (!dateString) return null;

  try {
    if (dateString.includes("T")) {
      return dateString.split("T")[0].split("-")[2];
    }

    if (dateString.includes(" ")) {
      return dateString.split(" ")[0].split("-")[2];
    }

    if (dateString.includes("-")) {
      return dateString.split("-")[2];
    }

    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.getDate().toString();
    }

    return null;
  } catch (error) {
    return null;
  }
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

    const response = await api.get(`/feeding/child/${childId}`);

    if (response.status === 200) {
      if (response.data && response.data.data) {
        const records = response.data.data.map((item) =>
          createFeedingRecord(item)
        );
        return records;
      }
    }

    return [];
  } catch (error) {
    console.error("Error in getChildFeedingData:", error);
    return [];
  }
};

export const getTodayFeedingData = async (childId) => {
  try {
    await ensureToken();

    try {
      const response = await api.get(`/feeding/child/${childId}/today`);

      if (response.data && response.data.data) {
        const records = response.data.data.map((item) =>
          createFeedingRecord(item)
        );
        return records;
      }

      return [];
    } catch (todayError) {
      console.error(
        "Error in getTodayFeedingData (today endpoint):",
        todayError
      );

      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const formattedStartDate = startOfDay.toISOString().split("T")[0];
      const formattedEndDate = endOfDay.toISOString().split("T")[0];

      console.log(
        `Fallback to date range: ${formattedStartDate} to ${formattedEndDate}`
      );

      const response = await api.get(
        `/feeding/child/${childId}/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );

      if (response.data && response.data.data) {
        return response.data.data.map((item) => createFeedingRecord(item));
      }

      return [];
    }
  } catch (error) {
    console.error("Error in getTodayFeedingData:", error);
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
      `API call: Getting feeding data for range ${formattedStartDate} to ${formattedEndDate}`
    );

    try {
      const response = await api.get(
        `/feeding/child/${childId}/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );

      if (response.data && response.data.data) {
        console.log(
          `API returned ${response.data.data.length} records for date range`
        );
        const records = response.data.data.map((item) =>
          createFeedingRecord(item)
        );
        return records;
      }

      console.log("API returned no data for date range");
      return [];
    } catch (dateRangeError) {
      console.error("Error with date-range endpoint:", dateRangeError);

      console.log(
        "Falling back to getting all feeding data and filtering manually by date field"
      );
      const allData = await getChildFeedingData(childId);

      if (!allData || allData.length === 0) {
        console.log("No feeding data found for child");
        return [];
      }

      console.log(
        `Got ${allData.length} total feeding records, filtering by date range`
      );

      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      const filteredData = allData.filter((record) => {
        let recordDate;

        if (record.date) {
          recordDate = new Date(record.date);
        } else if (record.timestamp) {
          recordDate = new Date(record.timestamp);
        } else {
          return false;
        }

        const recordTimestamp = recordDate.getTime();
        return (
          recordTimestamp >= startTimestamp && recordTimestamp <= endTimestamp
        );
      });

      console.log(
        `Filtered to ${filteredData.length} records within date range`
      );
      return filteredData;
    }
  } catch (error) {
    console.error("Error in getFeedingDataByDateRange:", error);
    return [];
  }
};

export const getWeeklyFeedingData = async (childId) => {
  try {
    console.log("Getting weekly feeding data");
    await ensureToken();

    try {
      const response = await api.get(`/feeding/child/${childId}/weekly`);

      if (response.data && response.data.data) {
        console.log(
          `Weekly endpoint returned ${response.data.data.length} aggregated days`
        );

        const processedData = {
          dailyFeedings: response.data.data.map((day) => ({
            date: day.date,
            day: day.date.split("-")[2],
            breastDuration: day.breastFeedings.totalMinutes,
            bottleAmount: day.bottleFeedings.totalMl,
            solidAmount: day.solidFeedings.totalGrams,
            breastFeedings: day.breastFeedings,
            bottleFeedings: day.bottleFeedings,
            solidFeedings: day.solidFeedings,
            totalFeedings: day.totalFeedings,
          })),
        };

        console.log("Processed weekly data:", processedData);
        return processedData.dailyFeedings;
      }

      console.log("Weekly endpoint returned no data");
    } catch (weeklyError) {
      console.error("Error with weekly endpoint:", weeklyError);
    }

    const today = new Date();
    console.log(`Today is: ${today.toISOString()}`);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `Weekly date range fallback: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(
      `Weekly feeding data retrieved via fallback: ${
        result ? result.length : 0
      } records`
    );

    if (!result || result.length === 0) {
      console.log(
        "No weekly data found, trying to get all feeding data as fallback"
      );
      const allData = await getChildFeedingData(childId);

      if (allData && allData.length > 0) {
        console.log(
          `Got ${allData.length} total feeding records, returning most recent ones`
        );
        return allData
          .sort((a, b) => {
            const dateA = new Date(a.date || a.timestamp);
            const dateB = new Date(b.date || b.timestamp);
            return dateB - dateA;
          })
          .slice(0, 10);
      }
    }

    return result || [];
  } catch (error) {
    console.error("Error in getWeeklyFeedingData:", error);
    return [];
  }
};

export const getMonthlyFeedingData = async (childId, year, month) => {
  try {
    console.log(`Getting monthly feeding data for ${year}-${month + 1}`);
    await ensureToken();

    const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;

    try {
      const response = await api.get(
        `/feeding/child/${childId}/monthly?month=${monthParam}`
      );

      if (response.data && response.data.data) {
        console.log(
          `Monthly endpoint returned ${response.data.data.length} aggregated days for ${monthParam}`
        );

        const processedData = {
          dailyFeedings: response.data.data.map((day) => ({
            date: day.date,
            day: day.date.split("-")[2],
            breastDuration: day.breastFeedings.totalMinutes,
            bottleAmount: day.bottleFeedings.totalMl,
            solidAmount: day.solidFeedings.totalGrams,
            breastFeedings: day.breastFeedings,
            bottleFeedings: day.bottleFeedings,
            solidFeedings: day.solidFeedings,
            totalFeedings: day.totalFeedings,
          })),
        };

        console.log("Processed monthly data:", processedData);
        return processedData.dailyFeedings;
      }

      console.log(`Monthly endpoint returned no data for ${monthParam}`);
    } catch (monthlyError) {
      console.error(
        `Error with monthly endpoint for ${monthParam}:`,
        monthlyError
      );
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `Month date range fallback: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(
      `Month feeding data retrieved via fallback: ${
        result ? result.length : 0
      } records`
    );

    if (!result || result.length === 0) {
      console.log(
        `No data found for month ${
          month + 1
        }/${year}, trying to get all feeding data as fallback`
      );
      const allData = await getChildFeedingData(childId);

      if (allData && allData.length > 0) {
        console.log(
          `Got ${allData.length} total feeding records, filtering for month ${
            month + 1
          }/${year}`
        );

        const filteredData = allData.filter((record) => {
          let recordDate;

          if (record.date) {
            recordDate = new Date(record.date);
          } else if (record.timestamp) {
            recordDate = new Date(record.timestamp);
          } else {
            return false;
          }

          return (
            recordDate.getFullYear() === year && recordDate.getMonth() === month
          );
        });

        console.log(
          `Filtered to ${filteredData.length} records for month ${
            month + 1
          }/${year}`
        );
        return filteredData;
      }
    }

    return result || [];
  } catch (error) {
    console.error(
      `Error in getMonthlyFeedingData for ${month + 1}/${year}:`,
      error
    );
    return [];
  }
};

export const getFeedingDataByMonth = async (childId, year, month) => {
  return getMonthlyFeedingData(childId, year, month);
};

export const formatDateForPeriod = (dateString, period) => {
  if (
    typeof dateString === "string" &&
    (dateString.includes("T") || dateString.includes(" "))
  ) {
    const day = getDayFromTimestamp(dateString);

    if (period === "week") {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else if (period === "month") {
      return day;
    }
  }

  const date = new Date(dateString);

  if (period === "week") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else if (period === "month") {
    return date.getDate().toString();
  } else {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
};

export const getFeedingSummary = async (childId, date) => {
  try {
    await ensureToken();

    const formattedDate = date
      ? date.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const response = await api.get(
      `/feeding/child/${childId}/summary?date=${formattedDate}`
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return {
      breastFeedings: { count: 0, totalMinutes: 0, leftSide: 0, rightSide: 0 },
      bottleFeedings: { count: 0, totalMl: 0 },
      solidFeedings: { count: 0, totalGrams: 0 },
    };
  } catch (error) {
    console.error("Error in getFeedingSummary:", error);
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

    const romanianDate = new Date(feedingData.date || new Date());
    const targetOffset = 3;

    const adjustedDate = new Date(
      romanianDate.getTime() + targetOffset * 60 * 60 * 1000
    );

    const formattedData = {
      childId: feedingData.childId,
      type: "breast",
      startTime: feedingData.startTime,
      endTime: feedingData.endTime,
      duration: feedingData.duration,
      side: feedingData.side,
      amount: 0,
      notes: feedingData.notes || "",
      date: adjustedDate.toISOString(),
      timestamp: adjustedDate.toISOString(),
    };

    console.log(
      "Saving breastfeeding data with Romania datetime:",
      formattedData.date
    );

    if (feedingData.id) {
      const response = await api.put(
        `/feeding/${feedingData.id}`,
        formattedData
      );
      return createFeedingRecord(response.data.data || response.data);
    } else {
      const response = await api.post("/feeding", formattedData);
      return createFeedingRecord(response.data.data || response.data);
    }
  } catch (error) {
    console.error("Error in saveBreastfeedingData:", error);
    throw error;
  }
};

export const saveBottleFeedingData = async (feedingData) => {
  try {
    await ensureToken();

    const romanianDate = new Date(feedingData.date || new Date());
    const targetOffset = 3;

    const adjustedDate = new Date(
      romanianDate.getTime() + targetOffset * 60 * 60 * 1000
    );

    const formattedData = {
      childId: feedingData.childId,
      type: "bottle",
      startTime: null,
      endTime: null,
      duration: 0,
      side: null,
      amount: feedingData.amount,
      unit: feedingData.unit || "ml",
      notes: feedingData.notes || "",
      date: adjustedDate.toISOString(),
      timestamp: adjustedDate.toISOString(),
    };

    console.log(
      "Saving bottle feeding data with Romania datetime:",
      formattedData.date
    );

    if (feedingData.id) {
      const response = await api.put(
        `/feeding/${feedingData.id}`,
        formattedData
      );
      return createFeedingRecord(response.data.data || response.data);
    } else {
      const response = await api.post("/feeding", formattedData);
      return createFeedingRecord(response.data.data || response.data);
    }
  } catch (error) {
    console.error("Error in saveBottleFeedingData:", error);
    throw error;
  }
};

export const saveSolidFoodData = async (feedingData) => {
  try {
    await ensureToken();

    const romanianDate = new Date(feedingData.date || new Date());
    const targetOffset = 3;

    const adjustedDate = new Date(
      romanianDate.getTime() + targetOffset * 60 * 60 * 1000
    );

    const formattedData = {
      childId: feedingData.childId,
      type: "solid",
      startTime: null,
      endTime: null,
      duration: 0,
      side: null,
      amount: feedingData.amount,
      unit: feedingData.unit || "g",
      foodType: feedingData.foodType,
      notes: feedingData.notes || "",
      date: adjustedDate.toISOString(),
      timestamp: adjustedDate.toISOString(),
    };

    console.log(
      "Saving solid food data with Romania datetime:",
      formattedData.date
    );

    if (feedingData.id) {
      const response = await api.put(
        `/feeding/${feedingData.id}`,
        formattedData
      );
      return createFeedingRecord(response.data.data || response.data);
    } else {
      const response = await api.post("/feeding", formattedData);
      return createFeedingRecord(response.data.data || response.data);
    }
  } catch (error) {
    console.error("Error in saveSolidFoodData:", error);
    throw error;
  }
};

export const deleteFeedingData = async (feedingId) => {
  try {
    await ensureToken();

    const response = await api.delete(`/feeding/${feedingId}`);

    return true;
  } catch (error) {
    console.error("Error in deleteFeedingData:", error);
    throw error;
  }
};
