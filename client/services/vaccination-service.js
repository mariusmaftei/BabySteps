import { api, ensureToken } from "./api";

export const getVaccinationsForChild = async (childId) => {
  try {
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
    throw error;
  }
};

export const createMultipleVaccinations = async (childId, vaccinations) => {
  try {
    await ensureToken();

    const response = await api.post(`/vaccinations/child/${childId}/bulk`, {
      vaccinations,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating vaccinations:", error);
    throw error;
  }
};

export const markVaccinationAsCompleted = async (
  childId,
  vaccineId,
  completionNotes
) => {
  try {
    await ensureToken();

    const response = await api.put(
      `/vaccinations/child/${childId}/vaccine/${vaccineId}`,
      {
        isCompleted: true,
        completedDate: new Date(),
        completionNotes,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking vaccination as completed:", error);
    throw error;
  }
};

export const getVaccinationProgress = async (childId) => {
  try {
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}/progress`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vaccination progress:", error);
    throw error;
  }
};

export const getDueVaccinations = async (childId) => {
  try {
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}/due`);
    return response.data;
  } catch (error) {
    console.error("Error fetching due vaccinations:", error);
    throw error;
  }
};

export const getOverdueVaccinations = async (childId) => {
  try {
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}/overdue`);
    return response.data;
  } catch (error) {
    console.error("Error fetching overdue vaccinations:", error);
    throw error;
  }
};
