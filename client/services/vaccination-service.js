import { api, ensureToken } from "./api";

// Get all vaccinations for a child
export const getVaccinationsForChild = async (childId) => {
  try {
    // Ensure token is set before making the request
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
    throw error;
  }
};

// Create multiple vaccination records at once (for initial setup)
export const createMultipleVaccinations = async (childId, vaccinations) => {
  try {
    // Ensure token is set before making the request
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

// Mark a vaccination as completed
export const markVaccinationAsCompleted = async (
  childId,
  vaccineId,
  completionNotes
) => {
  try {
    // Ensure token is set before making the request
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

// Get vaccination progress for a child
export const getVaccinationProgress = async (childId) => {
  try {
    // Ensure token is set before making the request
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}/progress`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vaccination progress:", error);
    throw error;
  }
};

// Get due vaccinations for a child
export const getDueVaccinations = async (childId) => {
  try {
    // Ensure token is set before making the request
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}/due`);
    return response.data;
  } catch (error) {
    console.error("Error fetching due vaccinations:", error);
    throw error;
  }
};

// Get overdue vaccinations for a child
export const getOverdueVaccinations = async (childId) => {
  try {
    // Ensure token is set before making the request
    await ensureToken();

    const response = await api.get(`/vaccinations/child/${childId}/overdue`);
    return response.data;
  } catch (error) {
    console.error("Error fetching overdue vaccinations:", error);
    throw error;
  }
};
