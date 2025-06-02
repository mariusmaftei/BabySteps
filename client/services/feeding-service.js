import api, { ensureToken } from "./api";

const createFeedingRecord = (data) => {
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
    date: data.date || new Date().toISOString().split("T")[0],
    timestamp: data.timestamp || new Date().toISOString(),
  };
};

export const getDayFromTimestamp = (timestamp) => {
  if (!timestamp) return null;

  try {
    if (timestamp.includes("T")) {
      return timestamp.split("T")[0].split("-")[2];
    }

    if (timestamp.includes(" ")) {
      return timestamp.split(" ")[0].split("-")[2];
    }

    if (timestamp.includes("-")) {
      return timestamp.split("-")[2];
    }

    const date = new Date(timestamp);
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

    // Format dates to YYYY-MM-DD format
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    console.log(
      `API call: Getting feeding data for range ${formattedStartDate} to ${formattedEndDate}`
    );

    // Try the date-range endpoint first
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

      // Fallback: Get all feeding data and filter manually
      console.log(
        "Falling back to getting all feeding data and filtering manually"
      );
      const allData = await getChildFeedingData(childId);

      if (!allData || allData.length === 0) {
        console.log("No feeding data found for child");
        return [];
      }

      console.log(
        `Got ${allData.length} total feeding records, filtering by date range`
      );

      // Convert start and end dates to timestamps for comparison
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      // Filter records that fall within the date range
      const filteredData = allData.filter((record) => {
        let recordDate;

        if (record.timestamp) {
          recordDate = new Date(record.timestamp);
        } else if (record.date) {
          recordDate = new Date(record.date);
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
    const today = new Date();
    console.log(`Today is: ${today.toISOString()}`);

    // Calculate start date (7 days ago from today)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Calculate end date (today at end of day)
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `Weekly date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Try to get data for this date range
    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(
      `Weekly feeding data retrieved: ${result ? result.length : 0} records`
    );

    // If no data found, try getting all data as a fallback
    if (!result || result.length === 0) {
      console.log(
        "No weekly data found, trying to get all feeding data as fallback"
      );
      const allData = await getChildFeedingData(childId);

      if (allData && allData.length > 0) {
        console.log(
          `Got ${allData.length} total feeding records, returning most recent ones`
        );
        // Sort by date descending and take the most recent ones (up to 10)
        return allData
          .sort((a, b) => {
            const dateA = new Date(a.timestamp || a.date);
            const dateB = new Date(b.timestamp || b.date);
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

export const getMonthlyFeedingData = async (childId) => {
  try {
    console.log("Getting monthly feeding data");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    console.log(
      `Monthly date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(
      `Monthly feeding data retrieved: ${result ? result.length : 0} records`
    );

    // If no data found, try getting all data as a fallback
    if (!result || result.length === 0) {
      console.log(
        "No monthly data found, trying to get all feeding data as fallback"
      );
      const allData = await getChildFeedingData(childId);

      if (allData && allData.length > 0) {
        console.log(
          `Got ${allData.length} total feeding records, returning most recent ones`
        );
        // Sort by date descending and take the most recent ones (up to 30)
        return allData
          .sort((a, b) => {
            const dateA = new Date(a.timestamp || a.date);
            const dateB = new Date(b.timestamp || b.date);
            return dateB - dateA;
          })
          .slice(0, 30);
      }
    }

    return result || [];
  } catch (error) {
    console.error("Error in getMonthlyFeedingData:", error);
    return [];
  }
};

export const getFeedingDataByMonth = async (childId, year, month) => {
  try {
    console.log(`Getting feeding data for ${year}-${month + 1}`);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `Month date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(
      `Month feeding data retrieved: ${result ? result.length : 0} records`
    );

    // If no data found, try getting all data as a fallback
    if (!result || result.length === 0) {
      console.log(
        "No data found for this month, trying to get all feeding data as fallback"
      );
      const allData = await getChildFeedingData(childId);

      if (allData && allData.length > 0) {
        console.log(
          `Got ${allData.length} total feeding records, filtering for month ${
            month + 1
          }/${year}`
        );

        // Filter records for the specified month and year
        const filteredData = allData.filter((record) => {
          let recordDate;

          if (record.timestamp) {
            recordDate = new Date(record.timestamp);
          } else if (record.date) {
            recordDate = new Date(record.date);
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
    console.error("Error in getFeedingDataByMonth:", error);
    return [];
  }
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

export const debugFeedingData = (feedingData) => {
  if (!feedingData || feedingData.length === 0) {
    return;
  }

  const dateGroups = {};
  feedingData.forEach((item) => {
    const day = getDayFromTimestamp(item.timestamp);
    const dateKey = day || item.date;

    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = [];
    }
    dateGroups[dateKey].push(item);
  });

  Object.keys(dateGroups)
    .sort()
    .forEach((date) => {
      const items = dateGroups[date];

      const breastCount = items.filter((i) => i.type === "breast").length;
      const bottleCount = items.filter((i) => i.type === "bottle").length;
      const solidCount = items.filter((i) => i.type === "solid").length;

      if (items.length > 0) {
      }
    });
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

    const formattedData = {
      childId: feedingData.childId,
      type: "breast",
      startTime: feedingData.startTime,
      endTime: feedingData.endTime,
      duration: feedingData.duration,
      side: feedingData.side,
      amount: 0,
      notes: feedingData.notes || "",
      date: feedingData.date || new Date().toISOString().split("T")[0],
      timestamp: feedingData.timestamp || new Date().toISOString(),
    };

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
      date: feedingData.date || new Date().toISOString().split("T")[0],
      timestamp: feedingData.timestamp || new Date().toISOString(),
    };

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
      date: feedingData.date || new Date().toISOString().split("T")[0],
      timestamp: feedingData.timestamp || new Date().toISOString(),
    };

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

// Add this debug function at the end of the file
export const debugWeeklyFeedingData = async (childId) => {
  try {
    console.log("=== DEBUG: Weekly Feeding Data Flow ===");

    const today = new Date();
    console.log(`Today's date: ${today.toISOString()}`);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `Weekly date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Get the day names for the last 7 days
    const dayNames = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = date.toISOString().split("T")[0];
      dayNames.push({ day: dayName, date: dateStr });
    }

    console.log("Expected days in weekly view:", dayNames);

    // Get the actual data
    const result = await getFeedingDataByDateRange(childId, startDate, endDate);
    console.log(`Raw weekly feeding data (${result.length} records):`, result);

    // Check which days have data
    const dataByDay = {};
    result.forEach((record) => {
      let recordDate = null;

      if (record.date) {
        recordDate = record.date;
      } else if (record.timestamp) {
        recordDate = record.timestamp.split("T")[0];
      }

      if (recordDate) {
        if (!dataByDay[recordDate]) {
          dataByDay[recordDate] = [];
        }
        dataByDay[recordDate].push(record);
      }
    });

    console.log("Data grouped by date:", dataByDay);

    // Check if any of the expected days match the data
    dayNames.forEach(({ day, date }) => {
      const hasData = dataByDay[date] && dataByDay[date].length > 0;
      console.log(
        `${day} (${date}): ${
          hasData ? dataByDay[date].length + " records" : "No data"
        }`
      );
    });

    // If no data found, try getting all data as a fallback
    if (result.length === 0) {
      console.log("No weekly data found, trying to get all feeding data");
      const allData = await getChildFeedingData(childId);
      console.log(
        `Total feeding records for child: ${allData ? allData.length : 0}`
      );

      if (allData && allData.length > 0) {
        console.log("Sample of available feeding records:");
        allData.slice(0, 3).forEach((record, index) => {
          console.log(`Record ${index + 1}:`, {
            id: record.id,
            type: record.type,
            date: record.date,
            timestamp: record.timestamp,
          });
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error in debugWeeklyFeedingData:", error);
    return [];
  }
};

// Make it available globally for console testing
if (typeof window !== "undefined") {
  window.debugWeeklyFeedingData = debugWeeklyFeedingData;
  window.getChildFeedingData = getChildFeedingData;
}
