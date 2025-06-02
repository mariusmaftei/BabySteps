import { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./auth-context";
import {
  getUserChildren,
  createChild as apiCreateChild,
  updateChild as apiUpdateChild,
  deleteChild as apiDeleteChild,
} from "../services/child-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChildActivityContext = createContext();

export const ChildActivityProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [childrenData, setChildren] = useState([]);
  const [currentChildId, setCurrentChildId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const processChildData = (childData) => {
    if (!childData) return childData;

    const processedData = { ...childData };

    if (processedData.activities && processedData.activities.growth) {
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

  useEffect(() => {
    const fetchChildren = async () => {
      if (!isAuthenticated || !token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getUserChildren(token);

        if (data && Array.isArray(data)) {
          const processedData = data.map(processChildData);
          setChildren(processedData);

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
        if (err.response?.status === 404) {
          setChildren([]);
          setError(null);
        } else {
          setError(err.message || "Failed to load children");
        }

        if (err.response?.status !== 404) {
          try {
            const storedChildren = await AsyncStorage.getItem("children");
            if (storedChildren) {
              const parsedChildren = JSON.parse(storedChildren);
              setChildren(parsedChildren);

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
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, [isAuthenticated, token]);

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

  const switchChild = async (childId) => {
    if (childrenData.some((child) => String(child.id) === String(childId))) {
      setCurrentChildId(childId);
      await AsyncStorage.setItem("currentChildId", String(childId));
      return true;
    }
    return false;
  };

  const addChild = async (newChildData) => {
    if (!token) {
      return null;
    }

    try {
      if (newChildData.birthWeight) {
        // Birth weight provided
      } else if (newChildData.weight) {
        newChildData.birthWeight = newChildData.weight;
      }

      if (newChildData.birthHeight) {
        // Birth height provided
      } else if (newChildData.height) {
        newChildData.birthHeight = newChildData.height;
      }

      if (newChildData.birthHeadCircumference) {
        // Birth head circumference provided
      } else if (newChildData.headCircumference) {
        newChildData.birthHeadCircumference = newChildData.headCircumference;
      }

      const createdChild = await apiCreateChild(newChildData, token);

      setChildren((prevChildren) => [...prevChildren, createdChild]);

      if (childrenData.length === 0) {
        setCurrentChildId(createdChild.id);
        await AsyncStorage.setItem("currentChildId", String(createdChild.id));
      }

      return createdChild.id;
    } catch (err) {
      setError(err.message || "Failed to add child");
      return null;
    }
  };

  const updateChildData = async (childId, updatedData) => {
    if (!token) {
      return false;
    }

    try {
      const updatedChild = await apiUpdateChild(childId, updatedData, token);

      setChildren((prevChildren) =>
        prevChildren.map((child) =>
          String(child.id) === String(childId)
            ? { ...child, ...updatedChild }
            : child
        )
      );

      return true;
    } catch (err) {
      setError(err.message || "Failed to update child");
      return false;
    }
  };

  const removeChild = async (childId) => {
    if (!token) {
      return false;
    }

    try {
      await apiDeleteChild(childId, token);

      const updatedChildren = childrenData.filter(
        (child) => String(child.id) !== String(childId)
      );
      setChildren(updatedChildren);

      if (String(childId) === String(currentChildId)) {
        if (updatedChildren.length > 0) {
          const firstRemainingChild = updatedChildren[0];
          setCurrentChildId(firstRemainingChild.id);
          await AsyncStorage.setItem(
            "currentChildId",
            String(firstRemainingChild.id)
          );
        } else {
          setCurrentChildId(null);
          await AsyncStorage.removeItem("currentChildId");
        }
      }

      return true;
    } catch (err) {
      setError(err.message || "Failed to remove child");
      return false;
    }
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

export const useChildActivity = () => {
  const context = useContext(ChildActivityContext);
  if (context === undefined) {
    throw new Error(
      "useChildActivity must be used within a ChildActivityProvider"
    );
  }
  return context;
};
