"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./auth-context";
import {
  getUserChildren,
  createChild as apiCreateChild,
  updateChild as apiUpdateChild,
  deleteChild as apiDeleteChild,
} from "../services/child-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create the context
const ChildActivityContext = createContext();

export const ChildActivityProvider = ({ children }) => {
  console.log("ChildActivityProvider - Initializing");
  const { token, isAuthenticated } = useAuth();
  const [childrenData, setChildren] = useState([]);
  const [currentChildId, setCurrentChildId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the current child object
  const currentChild = childrenData.find(
    (child) => child.id === currentChildId
  ) ||
    childrenData[0] || {
      id: "default",
      name: "No Child",
      age: "N/A",
      gender: "other",
      birthWeight: null,
      birthHeight: null,
      birthHeadCircumference: null,
      weight: null,
      height: null,
      headCircumference: null,
      imageSrc: "https://randomuser.me/api/portraits/lego/1.jpg",
      activities: {
        sleep: {
          data: [0, 0, 0, 0, 0, 0, 0],
          average: "0",
          trend: "0%",
          quality: "No data",
          bestDay: "No data",
          worstDay: "No data",
        },
        feeding: {
          data: [0, 0, 0, 0, 0, 0, 0],
          average: "0",
          trend: "0%",
          quality: "No data",
          bestDay: "No data",
          worstDay: "No data",
        },
        growth: {
          height: "0 cm",
          weight: "0 kg",
          bmi: "0",
          trend: "0%",
          percentile: "0th",
          birthWeight: null,
          birthHeight: null,
          birthHeadCircumference: null,
          weight: null,
          height: null,
          headCircumference: null,
        },
        playtime: {
          data: [0, 0, 0, 0, 0, 0, 0],
          average: "0 min",
          trend: "0%",
          types: {
            physical: 0,
            creative: 0,
            educational: 0,
            social: 0,
          },
        },
        health: {
          lastCheckup: "None",
          nextCheckup: "None",
          vaccinations: "None",
          allergies: "None",
          medications: "None",
          trend: "0%",
        },
        social: {
          data: [0, 0, 0, 0, 0, 0, 0],
          average: "0",
          trend: "0%",
          quality: "No data",
          bestDay: "No data",
          worstDay: "No data",
        },
      },
    };

  useEffect(() => {
    if (currentChild && currentChild.id !== "default") {
      console.log("Current child in context:", {
        id: currentChild.id,
        name: currentChild.name,
        birthWeight: currentChild.birthWeight,
        birthHeight: currentChild.birthHeight,
        birthHeadCircumference: currentChild.birthHeadCircumference,
        weight: currentChild.weight,
        height: currentChild.height,
        headCircumference: currentChild.headCircumference,
      });
    }
  }, [currentChild]);

  // Add this function to the context to ensure birth measurements are properly processed
  const processChildData = (childData) => {
    if (!childData) return childData;

    // Create a copy to avoid modifying the original object
    const processedData = { ...childData };

    // Ensure birth measurements are accessible at the top level
    // Check for both naming conventions (birthWeight/weight)
    if (processedData.activities && processedData.activities.growth) {
      // Check for birthWeight/birthHeight/birthHeadCircumference in activities.growth
      if (
        processedData.activities.growth.birthWeight &&
        !processedData.birthWeight
      ) {
        processedData.birthWeight = processedData.activities.growth.birthWeight;
      }
      if (
        processedData.activities.growth.birthHeight &&
        !processedData.birthHeight
      ) {
        processedData.birthHeight = processedData.activities.growth.birthHeight;
      }
      if (
        processedData.activities.growth.birthHeadCircumference &&
        !processedData.birthHeadCircumference
      ) {
        processedData.birthHeadCircumference =
          processedData.activities.growth.birthHeadCircumference;
      }

      // Also check for weight/height/headCircumference in activities.growth
      if (
        processedData.activities.growth.weight &&
        !processedData.weight &&
        !processedData.birthWeight
      ) {
        processedData.weight = processedData.activities.growth.weight;
      }
      if (
        processedData.activities.growth.height &&
        !processedData.height &&
        !processedData.birthHeight
      ) {
        processedData.height = processedData.activities.growth.height;
      }
      if (
        processedData.activities.growth.headCircumference &&
        !processedData.headCircumference &&
        !processedData.birthHeadCircumference
      ) {
        processedData.headCircumference =
          processedData.activities.growth.headCircumference;
      }
    }

    return processedData;
  };

  // Fetch children from API when authenticated
  useEffect(() => {
    const fetchChildren = async () => {
      console.log("ChildActivityProvider - Starting to fetch children data");
      if (!isAuthenticated || !token) {
        console.log("Not authenticated, skipping children fetch");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("Fetching children from API");
        const data = await getUserChildren(token);
        console.log("Children fetched:", data);

        if (data && Array.isArray(data)) {
          // Process each child to ensure birth measurements are accessible
          const processedData = data.map(processChildData);
          setChildren(processedData);

          // Set current child to the first one if not already set
          if (
            data.length > 0 &&
            (!currentChildId ||
              !data.find((child) => child.id === currentChildId))
          ) {
            setCurrentChildId(data[0].id);
            await AsyncStorage.setItem("currentChildId", String(data[0].id));
          }
        } else {
          setChildren([]);
        }
      } catch (err) {
        console.error("Error fetching children:", err);
        setError(err.message || "Failed to load children");

        // Try to load from local storage as fallback
        try {
          const storedChildren = await AsyncStorage.getItem("children");
          if (storedChildren) {
            const parsedChildren = JSON.parse(storedChildren);
            setChildren(parsedChildren);

            // Set current child from storage if available
            const storedCurrentChildId = await AsyncStorage.getItem(
              "currentChildId"
            );
            if (
              storedCurrentChildId &&
              parsedChildren.find(
                (child) => String(child.id) === storedCurrentChildId
              )
            ) {
              setCurrentChildId(storedCurrentChildId);
            } else if (parsedChildren.length > 0) {
              setCurrentChildId(parsedChildren[0].id);
              await AsyncStorage.setItem(
                "currentChildId",
                String(parsedChildren[0].id)
              );
            }
          }
        } catch (storageErr) {
          console.error("Error loading from storage:", storageErr);
        }
      } finally {
        setIsLoading(false);
        console.log("ChildActivityProvider - Finished loading children data");
      }
    };

    fetchChildren();
  }, [isAuthenticated, token]);

  // Save children to AsyncStorage whenever they change
  useEffect(() => {
    const saveToStorage = async () => {
      try {
        await AsyncStorage.setItem("children", JSON.stringify(childrenData));
      } catch (err) {
        console.error("Error saving children to storage:", err);
      }
    };

    if (childrenData.length > 0) {
      saveToStorage();
    }
  }, [childrenData]);

  // Function to switch to a different child
  const switchChild = async (childId) => {
    if (childrenData.some((child) => String(child.id) === String(childId))) {
      setCurrentChildId(childId);
      await AsyncStorage.setItem("currentChildId", String(childId));
      return true;
    }
    return false;
  };

  // Function to add a new child
  const addChild = async (newChildData) => {
    if (!token) {
      console.error("No token available, cannot add child");
      return null;
    }

    try {
      // Ensure birth measurements are included in the API call
      // Check for both naming conventions (birthWeight/weight)
      if (newChildData.birthWeight) {
        console.log(
          "Including birth weight in child creation:",
          newChildData.birthWeight
        );
      } else if (newChildData.weight) {
        console.log("Including weight in child creation:", newChildData.weight);
        // If only weight is provided, use it as birthWeight too
        newChildData.birthWeight = newChildData.weight;
      }

      if (newChildData.birthHeight) {
        console.log(
          "Including birth height in child creation:",
          newChildData.birthHeight
        );
      } else if (newChildData.height) {
        console.log("Including height in child creation:", newChildData.height);
        // If only height is provided, use it as birthHeight too
        newChildData.birthHeight = newChildData.height;
      }

      if (newChildData.birthHeadCircumference) {
        console.log(
          "Including birth head circumference in child creation:",
          newChildData.birthHeadCircumference
        );
      } else if (newChildData.headCircumference) {
        console.log(
          "Including head circumference in child creation:",
          newChildData.headCircumference
        );
        // If only headCircumference is provided, use it as birthHeadCircumference too
        newChildData.birthHeadCircumference = newChildData.headCircumference;
      }

      const createdChild = await apiCreateChild(newChildData, token);

      // Update local state with the new child
      setChildren((prevChildren) => [...prevChildren, createdChild]);

      // If this is the first child, set it as current
      if (childrenData.length === 0) {
        setCurrentChildId(createdChild.id);
        await AsyncStorage.setItem("currentChildId", String(createdChild.id));
      }

      return createdChild.id;
    } catch (err) {
      console.error("Error adding child:", err);
      setError(err.message || "Failed to add child");
      return null;
    }
  };

  // Function to update a child's data
  const updateChildData = async (childId, updatedData) => {
    if (!token) {
      console.error("No token available, cannot update child");
      return false;
    }

    try {
      const updatedChild = await apiUpdateChild(childId, updatedData, token);

      // Update local state
      setChildren((prevChildren) =>
        prevChildren.map((child) =>
          String(child.id) === String(childId)
            ? { ...child, ...updatedChild }
            : child
        )
      );

      return true;
    } catch (err) {
      console.error("Error updating child:", err);
      setError(err.message || "Failed to update child");
      return false;
    }
  };

  // Function to remove a child - MODIFIED to allow removing all children
  const removeChild = async (childId) => {
    if (!token) {
      console.error("No token available, cannot delete child");
      return false;
    }

    try {
      await apiDeleteChild(childId, token);

      // Update local state
      const updatedChildren = childrenData.filter(
        (child) => String(child.id) !== String(childId)
      );
      setChildren(updatedChildren);

      // If the removed child was the current child, switch to the first available child if any
      if (String(childId) === String(currentChildId)) {
        if (updatedChildren.length > 0) {
          const firstRemainingChild = updatedChildren[0];
          setCurrentChildId(firstRemainingChild.id);
          await AsyncStorage.setItem(
            "currentChildId",
            String(firstRemainingChild.id)
          );
        } else {
          // No children left, clear currentChildId
          setCurrentChildId(null);
          await AsyncStorage.removeItem("currentChildId");
        }
      }

      return true;
    } catch (err) {
      console.error("Error removing child:", err);
      setError(err.message || "Failed to remove child");
      return false;
    }
  };

  // Initialize child activities for a new child
  const initializeChildActivities = () => {
    return {
      sleep: {
        data: [0, 0, 0, 0, 0, 0, 0],
        average: "0",
        trend: "0%",
        quality: "No data",
        bestDay: "No data",
        worstDay: "No data",
      },
      feeding: {
        data: [0, 0, 0, 0, 0, 0, 0],
        average: "0",
        trend: "0%",
        quality: "No data",
        bestDay: "No data",
        worstDay: "No data",
      },
      growth: {
        height: "0 cm",
        weight: "0 kg",
        bmi: "0",
        trend: "0%",
        percentile: "0th",
        birthWeight: null,
        birthHeight: null,
        birthHeadCircumference: null,
        weight: null,
        height: null,
        headCircumference: null,
      },
      playtime: {
        data: [0, 0, 0, 0, 0, 0, 0],
        average: "0 min",
        trend: "0%",
        types: {
          physical: 0,
          creative: 0,
          educational: 0,
          social: 0,
        },
      },
      health: {
        lastCheckup: "None",
        nextCheckup: "None",
        vaccinations: "None",
        allergies: "None",
        medications: "None",
        trend: "0%",
      },
      social: {
        data: [0, 0, 0, 0, 0, 0, 0],
        average: "0",
        trend: "0%",
        quality: "No data",
        bestDay: "No data",
        worstDay: "No data",
      },
    };
  };

  return (
    <ChildActivityContext.Provider
      value={{
        children: childrenData,
        currentChild,
        currentChildId,
        isLoading,
        error,
        switchChild,
        addChild,
        updateChildData,
        removeChild,
      }}
    >
      {children}
    </ChildActivityContext.Provider>
  );
};

// Custom hook to use the child activity context
export const useChildActivity = () => {
  const context = useContext(ChildActivityContext);
  if (context === undefined) {
    throw new Error(
      "useChildActivity must be used within a ChildActivityProvider"
    );
  }
  return context;
};
