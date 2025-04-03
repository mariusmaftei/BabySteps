import api, { ensureToken } from "./api";

// Get all diaper changes for a specific child
export const getDiaperChanges = async (childId) => {
  try {
    await ensureToken();
    console.log(`Getting diaper changes for child ID: ${childId}`);
    const response = await api.get(`/diaper/child/${childId}`);
    console.log(`Retrieved ${response.data.length} diaper changes`);
    return response.data;
  } catch (error) {
    console.error("Error fetching diaper changes:", error);
    throw (
      error.response?.data || {
        error: "Failed to get diaper changes",
        message: error.message,
      }
    );
  }
};

// Get a specific diaper change by ID
export const getDiaperChangeById = async (childId, diaperChangeId) => {
  try {
    await ensureToken();
    const response = await api.get(
      `/diaper/child/${childId}/${diaperChangeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching diaper change:", error);
    throw (
      error.response?.data || {
        error: "Failed to get diaper change",
        message: error.message,
      }
    );
  }
};

// Create a new diaper change
export const createDiaperChange = async (childId, diaperData) => {
  try {
    await ensureToken();
    console.log(`Creating diaper change for child ID: ${childId}`, diaperData);
    const response = await api.post(`/diaper/child/${childId}`, diaperData);
    console.log("Diaper change created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating diaper change:", error);
    throw (
      error.response?.data || {
        error: "Failed to create diaper change",
        message: error.message,
      }
    );
  }
};

// Update a diaper change
export const updateDiaperChange = async (
  childId,
  diaperChangeId,
  diaperData
) => {
  try {
    await ensureToken();
    console.log(
      `Updating diaper change ID: ${diaperChangeId} for child ID: ${childId}`,
      diaperData
    );
    const response = await api.put(
      `/diaper/child/${childId}/${diaperChangeId}`,
      diaperData
    );
    console.log("Diaper change updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating diaper change:", error);
    throw (
      error.response?.data || {
        error: "Failed to update diaper change",
        message: error.message,
      }
    );
  }
};

// Delete a diaper change
export const deleteDiaperChange = async (childId, diaperChangeId) => {
  try {
    await ensureToken();
    console.log(
      `Deleting diaper change ID: ${diaperChangeId} for child ID: ${childId}`
    );
    const response = await api.delete(
      `/diaper/child/${childId}/${diaperChangeId}`
    );
    console.log("Diaper change deleted successfully");
    return response.data;
  } catch (error) {
    console.error("Error deleting diaper change:", error);
    throw (
      error.response?.data || {
        error: "Failed to delete diaper change",
        message: error.message,
      }
    );
  }
};

// Add functions to fetch diaper data for charts
export const getDiaperDataByDateRange = async (childId, startDate, endDate) => {
  try {
    await ensureToken();

    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    console.log(
      `Fetching diaper data for child ID: ${childId} from ${formattedStartDate} to ${formattedEndDate}`
    );
    const response = await api.get(
      `/diaper/child/${childId}/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
    );
    console.log("Diaper data by date range response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching diaper data by date range:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    } else if (error.request) {
      console.error("Error request:", error.request);
    }
    return [];
  }
};

export const getWeeklyDiaperData = async (childId) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return await getDiaperDataByDateRange(childId, startDate, endDate);
};

export const getMonthlyDiaperData = async (childId) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Get last 30 days

  return await getDiaperDataByDateRange(childId, startDate, endDate);
};

export const getYearlyDiaperData = async (childId) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // Get last 365 days

  return await getDiaperDataByDateRange(childId, startDate, endDate);
};

// Add this function to aggregate diaper data by month for yearly view
export const aggregateDiaperDataByMonth = (diaperData) => {
  const monthlyData = {};

  diaperData.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        count: 0,
        date: new Date(date.getFullYear(), date.getMonth(), 1),
      };
    }

    monthlyData[monthKey].count += 1;
  });

  // Sort by date
  return Object.values(monthlyData)
    .map((item) => ({
      date: item.date.toISOString().split("T")[0],
      month: item.month,
      count: item.count,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};
