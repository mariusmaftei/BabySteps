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
