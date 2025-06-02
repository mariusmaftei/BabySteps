import api, { ensureToken } from "./api";

export const getUserChildren = async () => {
  try {
    await ensureToken();
    const response = await api.get("/children");
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to get children",
        message: error.message,
      }
    );
  }
};

export const getChildById = async (childId) => {
  try {
    await ensureToken();
    const response = await api.get(`/children/${childId}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to get child",
        message: error.message,
      }
    );
  }
};

export const createChild = async (childData) => {
  try {
    await ensureToken();
    const response = await api.post("/children", childData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateChild = async (childId, childData) => {
  try {
    await ensureToken();
    const response = await api.put(`/children/${childId}`, childData);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to update child",
        message: error.message,
      }
    );
  }
};

export const deleteChild = async (childId) => {
  try {
    await ensureToken();
    const response = await api.delete(`/children/${childId}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "Failed to delete child",
        message: error.message,
      }
    );
  }
};
