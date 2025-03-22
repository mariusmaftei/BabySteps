import api, { ensureToken } from "./api";

// Get all children for the authenticated user
export const getUserChildren = async (token) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log("Getting children with token");
    const response = await api.get("/children");
    console.log("Children data from API:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get children error:", error);
    throw (
      error.response?.data || {
        error: "Failed to get children",
        message: error.message,
      }
    );
  }
};

// Get a specific child by ID
export const getChildById = async (childId, token) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log(`Fetching child with ID: ${childId}`);
    const response = await api.get(`/children/${childId}`);
    return response.data;
  } catch (error) {
    console.error("Get child error:", error);
    throw (
      error.response?.data || {
        error: "Failed to get child",
        message: error.message,
      }
    );
  }
};

// Create a new child
export const createChild = async (childData) => {
  try {
    const token = await ensureToken();

    // Format birth date if it exists
    if (childData.birthDate) {
      // Make sure birthDate is sent in the format the server expects
      console.log("Birth date being sent:", childData.birthDate);
    }

    // Fix: Changed from "/child" to "/children" to match the route definition
    const response = await api.post("/children", childData);

    // No initial growth record creation - user will create the first record manually
    console.log("Child created successfully, no initial growth record created");

    return response.data;
  } catch (error) {
    console.error("Error creating child:", error);
    throw error;
  }
};

// Update a child
export const updateChild = async (childId, childData, token) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    // Format birth date if it exists
    if (childData.birthDate) {
      // Make sure birthDate is sent in the format the server expects
      console.log("Birth date being updated:", childData.birthDate);
    }

    console.log("Updating child with ID:", childId, "and data:", childData);
    const response = await api.put(`/children/${childId}`, childData);
    console.log("Child updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Update child error:", error);
    throw (
      error.response?.data || {
        error: "Failed to update child",
        message: error.message,
      }
    );
  }
};

// Delete a child
export const deleteChild = async (childId, token) => {
  try {
    // Ensure API has auth token before making request
    await ensureToken();

    console.log("Deleting child with ID:", childId);
    const response = await api.delete(`/children/${childId}`);
    console.log("Child deleted successfully");
    return response.data;
  } catch (error) {
    console.error("Delete child error:", error);
    throw (
      error.response?.data || {
        error: "Failed to delete child",
        message: error.message,
      }
    );
  }
};

// Helper function to ensure child data has the required structure
const ensureChildDataStructure = (childData) => {
  if (!childData) return childData;

  // Create a copy to avoid modifying the original object
  const processedData = { ...childData };

  // Ensure image property is consistent
  if (!processedData.imageSrc && processedData.image) {
    processedData.imageSrc = processedData.image;
  } else if (!processedData.imageSrc) {
    const randomNumber = Math.floor(Math.random() * 10 + 1);
    processedData.imageSrc = `https://randomuser.me/api/portraits/kids/${randomNumber}.jpg`;
  }

  // Make sure activities object exists
  if (!processedData.activities) {
    processedData.activities = {};
  }

  // Ensure all activity types exist with default values
  const activityTypes = [
    "sleep",
    "feeding",
    "growth",
    "playtime",
    "health",
    "social",
  ];

  activityTypes.forEach((type) => {
    if (!processedData.activities[type]) {
      switch (type) {
        case "sleep":
        case "feeding":
        case "social":
          processedData.activities[type] = {
            data: [0, 0, 0, 0, 0, 0, 0],
            average: "0",
            trend: "0%",
            quality: "No data",
            bestDay: "No data",
            worstDay: "No data",
          };
          break;
        case "growth":
          processedData.activities[type] = {
            height: processedData.height
              ? `${processedData.height} cm`
              : "0 cm",
            weight: processedData.weight
              ? `${processedData.weight} kg`
              : "0 kg",
            bmi: "0",
            trend: "0%",
            percentile: "0th",
          };
          break;
        case "playtime":
          processedData.activities[type] = {
            data: [0, 0, 0, 0, 0, 0, 0],
            average: "0 min",
            trend: "0%",
            types: {
              physical: 0,
              creative: 0,
              educational: 0,
              social: 0,
            },
          };
          break;
        case "health":
          processedData.activities[type] = {
            lastCheckup: "None",
            nextCheckup: "None",
            vaccinations: "None",
            allergies: "None",
            medications: "None",
            trend: "0%",
          };
          break;
      }
    }
  });

  return processedData;
};
