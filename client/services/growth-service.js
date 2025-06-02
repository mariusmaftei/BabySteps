import api, { ensureToken } from "./api.js";
import {
  calculateExpectedMonthlyGrowth,
  calculateMonthlyGrowthProgress,
} from "../utils/growth-utils.js";

const handle404Error = (error, message, defaultValue) => {
  if (error.response && error.response.status === 404) {
    return defaultValue;
  }
  console.error(message, error);
  throw error;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getGrowthRecords = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/growth/child/${childId}`);
    return response.data;
  } catch (error) {
    console.error("Error in getGrowthRecords:", error);
    return [
      {
        id: 1,
        childId: 1,
        weight: 50,
        height: 1,
        headCircumference: 1,
        recordDate: "2025-05-19 20:00:05",
      },
    ];
  }
};

export const getLatestGrowthRecord = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/growth/child/${childId}/latest`);
    return response.data;
  } catch (error) {
    return {
      id: 1,
      childId: 1,
      weight: 50,
      height: 1,
      headCircumference: 1,
      recordDate: "2025-05-19 20:00:05",
    };
  }
};

export const getPreviousGrowthRecord = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/growth/child/${childId}/previous`);
    return response.data;
  } catch (error) {
    return handle404Error(error, "No previous growth record found", null);
  }
};

export const getGrowthStatistics = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/growth/child/${childId}/statistics`);

    if (response.data && response.data.weightData) {
      response.data.weightData = response.data.weightData.map((item) => ({
        ...item,
        formattedDate: formatDate(item.date),
      }));
    }

    if (response.data && response.data.heightData) {
      response.data.heightData = response.data.heightData.map((item) => ({
        ...item,
        formattedDate: formatDate(item.date),
      }));
    }

    if (response.data && response.data.headCircumferenceData) {
      response.data.headCircumferenceData =
        response.data.headCircumferenceData.map((item) => ({
          ...item,
          formattedDate: formatDate(item.date),
        }));
    }

    return response.data;
  } catch (error) {
    return handle404Error(error, "No growth statistics available", {
      weightData: [],
      heightData: [],
      headCircumferenceData: [],
      totalRecords: 0,
      firstRecord: null,
      latestRecord: null,
      weightGain: 0,
      heightGain: 0,
      headCircumferenceGain: 0,
    });
  }
};

export const calculateMonthlyGrowthTargets = (ageInMonths, gender) => {
  const expectedGrowth = calculateExpectedMonthlyGrowth(ageInMonths, gender);
  return {
    targetWeight: expectedGrowth.weight,
    targetHeight: expectedGrowth.height,
    targetHeadCirc: expectedGrowth.headCirc,
  };
};

export const calculateGrowthProgressPercentages = async (
  childId,
  ageInMonths,
  gender,
  birthWeight,
  birthHeight,
  birthHeadCirc
) => {
  try {
    const records = await getGrowthRecords(childId);

    if (records.length === 0) {
      return {
        heightProgress: 0,
        weightProgress: 0,
        headCircProgress: 0,
        latestRecord: null,
      };
    }

    const birthRecord = records.reduce((earliest, record) => {
      return new Date(record.date || record.recordDate || record.createdAt) <
        new Date(earliest.date || earliest.recordDate || earliest.createdAt)
        ? record
        : earliest;
    });

    const latestRecord = records.reduce((latest, record) => {
      return new Date(record.date || record.recordDate || record.createdAt) >
        new Date(latest.date || latest.recordDate || latest.createdAt)
        ? record
        : latest;
    });

    const expectedGrowth = calculateExpectedMonthlyGrowth(ageInMonths, gender);

    const heightProgress = calculateMonthlyGrowthProgress(
      birthRecord.height,
      latestRecord.height,
      expectedGrowth.height,
      "height"
    );

    const weightProgress = calculateMonthlyGrowthProgress(
      birthRecord.weight,
      latestRecord.weight,
      expectedGrowth.weight,
      "weight"
    );

    const headCircProgress = calculateMonthlyGrowthProgress(
      birthRecord.headCirc || birthRecord.headCircumference,
      latestRecord.headCirc || latestRecord.headCircumference,
      expectedGrowth.headCirc,
      "headCirc"
    );

    return {
      heightProgress,
      weightProgress,
      headCircProgress,
      latestRecord,
    };
  } catch (error) {
    console.error("Error calculating growth progress percentages:", error);
    return {
      heightProgress: 0,
      weightProgress: 0,
      headCircProgress: 0,
      latestRecord: null,
    };
  }
};

export const createGrowthRecord = async (growthData) => {
  try {
    await ensureToken();
    const response = await api.post("/growth", growthData);
    return response.data;
  } catch (error) {
    console.error("Error creating growth record:", error);
    throw error;
  }
};

export const updateGrowthRecord = async (id, growthData) => {
  try {
    await ensureToken();
    const response = await api.put(`/growth/${id}`, growthData);
    return response.data;
  } catch (error) {
    console.error("Error updating growth record:", error);
    throw error;
  }
};

export const deleteGrowthRecord = async (id) => {
  try {
    await ensureToken();
    const response = await api.delete(`/growth/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting growth record:", error);
    throw error;
  }
};

export const checkIfSunday = async () => {
  try {
    await ensureToken();
    const response = await api.get("/growth/check-sunday");
    return response.data;
  } catch (error) {
    console.error("Error checking if today is Sunday:", error);
    throw error;
  }
};

export const getGrowthChartData = async (childId, period = "all") => {
  try {
    const allRecords = await getGrowthRecords(childId);
    let filteredRecords = [...allRecords];

    if (period !== "all") {
      const now = new Date();
      let monthsBack = 0;

      if (period === "1m") monthsBack = 1;
      else if (period === "3m") monthsBack = 3;
      else if (period === "6m") monthsBack = 6;

      const cutoffDate = new Date();
      cutoffDate.setMonth(now.getMonth() - monthsBack);

      filteredRecords = allRecords.filter((record) => {
        const recordDate = new Date(
          record.date || record.recordDate || record.createdAt
        );
        return recordDate >= cutoffDate;
      });
    }

    const formattedRecords = filteredRecords.map((record) => {
      const recordDate = new Date(
        record.date || record.recordDate || record.createdAt
      );
      return {
        ...record,
        formattedDate: recordDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      };
    });

    return {
      records: formattedRecords,
    };
  } catch (error) {
    console.error("Error fetching growth chart data:", error);
    return { records: [] };
  }
};
