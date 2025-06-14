import api, { ensureToken } from "./api";

export const getDiaperChanges = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/diaper/child/${childId}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to get diaper changes",
        message: error.message,
      }
    );
  }
};

export const getDiaperChangeById = async (childId, diaperChangeId) => {
  try {
    await ensureToken();
    const response = await api.get(
      `/diaper/child/${childId}/${diaperChangeId}`
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to get diaper change",
        message: error.message,
      }
    );
  }
};

export const createDiaperChange = async (childId, diaperData) => {
  try {
    await ensureToken();

    const romanianDate = new Date(diaperData.date);
    const targetOffset = 3;

    const adjustedDate = new Date(
      romanianDate.getTime() + targetOffset * 60 * 60 * 1000
    );

    const adjustedDiaperData = {
      ...diaperData,
      date: adjustedDate.toISOString(),
    };

    const response = await api.post(
      `/diaper/child/${childId}`,
      adjustedDiaperData
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to create diaper change",
        message: error.message,
      }
    );
  }
};

export const updateDiaperChange = async (
  childId,
  diaperChangeId,
  diaperData
) => {
  try {
    await ensureToken();
    const response = await api.put(
      `/diaper/child/${childId}/${diaperChangeId}`,
      diaperData
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to update diaper change",
        message: error.message,
      }
    );
  }
};

export const deleteDiaperChange = async (childId, diaperChangeId) => {
  try {
    await ensureToken();
    const response = await api.delete(
      `/diaper/child/${childId}/${diaperChangeId}`
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to delete diaper change",
        message: error.message,
      }
    );
  }
};

export const getDiaperDataByDateRange = async (childId, startDate, endDate) => {
  try {
    await ensureToken();

    const romanianStartDate = new Date(
      startDate.getTime() + 3 * 60 * 60 * 1000
    );
    const romanianEndDate = new Date(endDate.getTime() + 3 * 60 * 60 * 1000);

    const formattedStartDate = romanianStartDate.toISOString().split("T")[0];
    const formattedEndDate = romanianEndDate.toISOString().split("T")[0];

    const response = await api.get(
      `/diaper/child/${childId}/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
    );

    const processedData = response.data.map((record) => {
      let day = null;
      if (record.timestamp) {
        if (record.timestamp.includes("T")) {
          day = record.timestamp.split("T")[0].split("-")[2];
        } else if (record.timestamp.includes(" ")) {
          day = record.timestamp.split(" ")[0].split("-")[2];
        } else if (record.timestamp.includes("-")) {
          day = record.timestamp.split("-")[2];
        }

        day = day ? Number.parseInt(day, 10).toString() : null;
      }

      return {
        ...record,
        day,
      };
    });

    return processedData;
  } catch (error) {
    if (error.response) {
    } else if (error.request) {
    }
    return [];
  }
};

export const getWeeklyDiaperData = async (childId) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return await getDiaperDataByDateRange(childId, startDate, endDate);
  } catch (error) {
    return [];
  }
};

export const getMonthlyDiaperData = async (childId) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return await getDiaperDataByDateRange(childId, startDate, endDate);
  } catch (error) {
    return [];
  }
};

export const getYearlyDiaperData = async (childId) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    return await getDiaperDataByDateRange(childId, startDate, endDate);
  } catch (error) {
    return [];
  }
};

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

  return Object.values(monthlyData)
    .map((item) => ({
      date: item.date.toISOString().split("T")[0],
      month: item.month,
      count: item.count,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const getDiaperDataByMonth = async (childId, year, month) => {
  try {
    await ensureToken();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    return await getDiaperDataByDateRange(childId, startDate, endDate);
  } catch (error) {
    return [];
  }
};
