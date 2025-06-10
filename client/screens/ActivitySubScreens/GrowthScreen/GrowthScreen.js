"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";
import * as growthService from "../../../services/growth-service";
import * as childService from "../../../services/child-service";

import GrowthMeasurementsInput from "../../../components/UI/Inputs/GrowthMeasurementsInput";
import ChildInfoCard from "../../../components/UI/Cards/ChildInfoCard";
import ChildRecommendationCard from "../../../components/UI/Cards/ChildRecommendationCard";
import BirthDataCard from "../../../components/UI/Cards/BirthDataCard";
import AreaChart from "../../../components/UI/Charts/AreaChart";

import { getGrowthRecommendations } from "../../../utils/growth-utils";

// Define one-year growth targets outside the component to prevent re-creation on every render
const ONE_YEAR_TARGETS = {
  male: {
    weight: 9600, // grams
    height: 74, // cm (Updated as requested)
    headCirc: 46, // cm
  },
  female: {
    weight: 8900, // grams
    height: 76, // cm
    headCirc: 46, // cm
  },
};

export default function GrowthScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [latestRecord, setLatestRecord] = useState(null);
  const [previousRecord, setPreviousRecord] = useState(null);
  const [birthWeight, setBirthWeight] = useState(null);
  const [birthHeight, setBirthHeight] = useState(null);
  const [birthHeadCirc, setBirthHeadCirc] = useState(null);
  const [hasExistingMeasurements, setHasExistingMeasurements] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [targetWeight, setTargetWeight] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [targetHeadCirc, setTargetHeadCirc] = useState(0);

  const [progressValues, setProgressValues] = useState({
    weightProgress: 0,
    heightProgress: 0,
    headCircProgress: 0,
  });

  // Initialize current measurement inputs to empty strings
  const [currentWeight, setCurrentWeight] = useState("");
  const [previousWeight, setPreviousWeight] = useState("");
  const [currentHeight, setCurrentHeight] = useState("");
  const [previousHeight, setPreviousHeight] = useState("");
  const [currentHeadCirc, setCurrentHeadCirc] = useState("");
  const [previousHeadCirc, setPreviousHeadCirc] = useState("");
  const [notes, setNotes] = useState("");

  const [weightGain, setWeightGain] = useState(0);
  const [heightGain, setHeightGain] = useState(0);
  const [headCircGain, setHeadCircGain] = useState(0);

  // Track if each specific measurement has been entered
  const [hasWeightMeasurement, setHasWeightMeasurement] = useState(false);
  const [hasHeightMeasurement, setHasHeightMeasurement] = useState(false);
  const [hasHeadCircMeasurement, setHasHeadCircMeasurement] = useState(false);

  const getBarChartData = useCallback(() => {
    let birthWeightValue = birthWeight ? Number.parseFloat(birthWeight) : 0;
    if (isNaN(birthWeightValue)) {
      birthWeightValue = 0;
    }

    const hasPreviousRecord = previousRecord !== null || previousWeight !== "";
    const currentWeightValue = Number.parseFloat(currentWeight) || 0;

    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthWeightValue, currentWeightValue],
            colors: [
              (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            ],
          },
        ],
      };
    }

    return {
      labels: ["Birth", "Previous", "New Measurement"],
      datasets: [
        {
          data: [
            birthWeightValue,
            Number.parseFloat(previousWeight) || 0,
            currentWeightValue,
          ],
          colors: [
            (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
            (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          ],
        },
      ],
    };
  }, [birthWeight, previousRecord, previousWeight, currentWeight]);

  const getHeightChartData = useCallback(() => {
    let birthHeightValue = birthHeight ? Number.parseFloat(birthHeight) : 0;
    if (isNaN(birthHeightValue)) {
      birthHeightValue = 0;
    }
    const hasPreviousRecord = previousRecord !== null || previousHeight !== "";
    const currentHeightValue = Number.parseFloat(currentHeight) || 0;

    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthHeightValue, currentHeightValue],
            colors: [
              (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            ],
          },
        ],
      };
    }

    return {
      labels: ["Birth", "Previous", "New Measurement"],
      datasets: [
        {
          data: [
            birthHeightValue,
            Number.parseFloat(previousHeight) || 0,
            currentHeightValue,
          ],
          colors: [
            (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
            (opacity = 1) => `rgba(134, 65, 44, ${opacity})`,
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          ],
        },
      ],
    };
  }, [birthHeight, previousRecord, previousHeight, currentHeight]);

  const getHeadCircChartData = useCallback(() => {
    let birthHeadCircValue = birthHeadCirc
      ? Number.parseFloat(birthHeadCirc)
      : 0;
    if (isNaN(birthHeadCircValue)) {
      birthHeadCircValue = 0;
    }
    const hasPreviousRecordCheck =
      previousRecord !== null || previousHeadCirc !== "";
    const currentHeadCircValue = Number.parseFloat(currentHeadCirc) || 0;

    if (!hasPreviousRecordCheck) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthHeadCircValue, currentHeadCircValue],
            colors: [
              (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            ],
          },
        ],
      };
    }

    return {
      labels: ["Birth", "Previous", "New Measurement"],
      datasets: [
        {
          data: [
            birthHeadCircValue,
            Number.parseFloat(previousHeadCirc) || 0,
            currentHeadCircValue,
          ],
          colors: [
            (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
            (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          ],
        },
      ],
    };
  }, [birthHeadCirc, previousRecord, previousHeadCirc, currentHeadCirc]);

  const childAgeText = currentChild.age;
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;
  const childGender = currentChild.gender
    ? currentChild.gender.toLowerCase()
    : "boys"; // Default to 'boys' if not specified

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Normalize gender to 'male' or 'female' for target lookup
    const genderForTargets =
      currentChild.gender?.toLowerCase() === "girl" ? "female" : "male";
    const targets = ONE_YEAR_TARGETS[genderForTargets];

    if (targets) {
      setTargetWeight(targets.weight); // Already in grams
      setTargetHeight(targets.height * 10); // Convert cm to mm for internal state
      setTargetHeadCirc(targets.headCirc * 10); // Convert cm to mm for internal state
    }
    // Removed the WHO standards fallback to ensure only the one-year targets are used
  }, [currentChild.gender]); // Only depend on currentChild.gender for target updates

  const loadGrowthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First, directly access birth measurements from currentChild
      console.log("Current child in loadGrowthData:", currentChild);

      // Check for birth measurements with different possible property names
      // First check birthWeight/birthHeight/birthHeadCircumference
      if (currentChild.birthWeight) {
        setBirthWeight(currentChild.birthWeight);
        console.log(
          "Setting birth weight from birthWeight:",
          currentChild.birthWeight
        );
      } else if (currentChild.weight) {
        // Then check weight/height/headCircumference
        setBirthWeight(currentChild.weight);
        console.log("Setting birth weight from weight:", currentChild.weight);
      }

      if (currentChild.birthHeight) {
        setBirthHeight(currentChild.birthHeight);
        console.log(
          "Setting birth height from birthHeight:",
          currentChild.birthHeight
        );
      } else if (currentChild.height) {
        setBirthHeight(currentChild.height);
        console.log("Setting birth height from height:", currentChild.height);
      }

      if (currentChild.birthHeadCircumference) {
        setBirthHeadCirc(currentChild.birthHeadCircumference);
        console.log(
          "Setting birth head circ from birthHeadCircumference:",
          currentChild.birthHeadCircumference
        );
      } else if (currentChild.headCircumference) {
        setBirthHeadCirc(currentChild.headCircumference);
        console.log(
          "Setting birth head circ from headCircumference:",
          currentChild.headCircumference
        );
      }

      // Also check if birth measurements exist in the activities.growth object
      if (currentChild.activities && currentChild.activities.growth) {
        if (!birthWeight) {
          if (currentChild.activities.growth.birthWeight) {
            setBirthWeight(currentChild.activities.growth.birthWeight);
            console.log(
              "Setting birth weight from activities.growth.birthWeight:",
              currentChild.activities.growth.birthWeight
            );
          } else if (currentChild.activities.growth.weight) {
            setBirthWeight(currentChild.activities.growth.weight);
            console.log(
              "Setting birth weight from activities.growth.weight:",
              currentChild.activities.growth.weight
            );
          }
        }

        if (!birthHeight) {
          if (currentChild.activities.growth.birthHeight) {
            setBirthHeight(currentChild.activities.growth.birthHeight);
            console.log(
              "Setting birth height from activities.growth.birthHeight:",
              currentChild.activities.growth.birthHeight
            );
          } else if (currentChild.activities.growth.height) {
            setBirthHeight(currentChild.activities.growth.height);
            console.log(
              "Setting birth height from activities.growth.height:",
              currentChild.activities.growth.height
            );
          }
        }

        if (!birthHeadCirc) {
          if (currentChild.activities.growth.birthHeadCircumference) {
            setBirthHeadCirc(
              currentChild.activities.growth.birthHeadCircumference
            );
            console.log(
              "Setting birth head circ from activities.growth.birthHeadCircumference:",
              currentChild.activities.growth.birthHeadCircumference
            );
          } else if (currentChild.activities.growth.headCircumference) {
            setBirthHeadCirc(currentChild.activities.growth.headCircumference);
            console.log(
              "Setting birth head circ from activities.growth.headCircumference:",
              currentChild.activities.growth.headCircumference
            );
          }
        }
      }

      // Then try to get more detailed data from API
      try {
        const childDetails = await childService.getChildById(currentChild.id);
        console.log("Child details fetched:", childDetails);

        if (childDetails) {
          // Check for birth measurements with different possible property names in API response
          if (!birthWeight) {
            if (childDetails.birthWeight) {
              setBirthWeight(childDetails.birthWeight);
              console.log(
                "Setting birth weight from API birthWeight:",
                childDetails.birthWeight
              );
            } else if (childDetails.weight) {
              setBirthWeight(childDetails.weight);
              console.log(
                "Setting birth weight from API weight:",
                childDetails.weight
              );
            }
          }

          if (!birthHeight) {
            if (childDetails.birthHeight) {
              setBirthHeight(childDetails.birthHeight);
              console.log(
                "Setting birth height from API birthHeight:",
                childDetails.birthHeight
              );
            } else if (childDetails.height) {
              setBirthHeight(childDetails.height);
              console.log(
                "Setting birth height from API height:",
                childDetails.height
              );
            }
          }

          if (!birthHeadCirc) {
            if (childDetails.birthHeadCircumference) {
              setBirthHeadCirc(childDetails.birthHeadCircumference);
              console.log(
                "Setting birth head circ from API birthHeadCircumference:",
                childDetails.birthHeadCircumference
              );
            } else if (childDetails.headCircumference) {
              setBirthHeadCirc(childDetails.headCircumference);
              console.log(
                "Setting birth head circ from API headCircumference:",
                childDetails.headCircumference
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching child details:", error);
      }

      try {
        const records = await growthService.getGrowthRecords(currentChild.id);
        if (records && records.length > 0) {
          setHasExistingMeasurements(true);
        }
      } catch (error) {
        setHasExistingMeasurements(false);
        setCurrentWeight("");
        setCurrentHeight("");
        setCurrentHeadCirc("");
        setHasWeightMeasurement(false);
        setHasHeightMeasurement(false);
        setHasHeadCircMeasurement(false);
      }

      try {
        const latest = await growthService.getLatestGrowthRecord(
          currentChild.id
        );
        setLatestRecord(latest);

        if (latest) {
          // Check if the latest record is from today
          const today = new Date();
          const recordDate = new Date(latest.createdAt || latest.recordDate);

          const isToday =
            today.getDate() === recordDate.getDate() &&
            today.getMonth() === recordDate.getMonth() &&
            today.getFullYear() === recordDate.getFullYear();

          if (isToday) {
            // Record is from today - show in edit mode
            if (latest.weight) {
              setCurrentWeight(latest.weight.toString());
              setHasWeightMeasurement(true);
            }
            if (latest.height) {
              setCurrentHeight((latest.height / 10).toString());
              setHasHeightMeasurement(true);
            }
            if (latest.headCircumference) {
              setCurrentHeadCirc((latest.headCircumference / 10).toString());
              setHasHeadCircMeasurement(true);
            }
            if (latest.notes) {
              setNotes(latest.notes);
            }
            setHasExistingMeasurements(true);
            setIsEditMode(false); // Start in view mode, can click edit
          } else {
            // Record is from previous day - reset for new record
            setCurrentWeight("");
            setCurrentHeight("");
            setCurrentHeadCirc("");
            setNotes("");
            setHasWeightMeasurement(false);
            setHasHeightMeasurement(false);
            setHasHeadCircMeasurement(false);
            setHasExistingMeasurements(false);
            setIsEditMode(false);
          }

          if (
            latest.weightProgress !== undefined &&
            latest.heightProgress !== undefined &&
            latest.headCircumferenceProgress !== undefined
          ) {
            setProgressValues({
              weightProgress: latest.weightProgress,
              heightProgress: latest.heightProgress,
              headCircProgress: latest.headCircProgress,
            });
          }
        } else {
          // No latest record, ensure inputs are empty
          setCurrentWeight("");
          setCurrentHeight("");
          setCurrentHeadCirc("");
          setNotes("");
          setHasWeightMeasurement(false);
          setHasHeightMeasurement(false);
          setHasHeadCircMeasurement(false);
          setHasExistingMeasurements(false);
          setIsEditMode(false);
        }
      } catch (error) {
        setLatestRecord(null);
        setCurrentWeight("");
        setCurrentHeight("");
        setCurrentHeadCirc("");
        setNotes("");
        setHasWeightMeasurement(false);
        setHasHeightMeasurement(false);
        setHasHeadCircMeasurement(false);
        setHasExistingMeasurements(false);
        setIsEditMode(false);
      }

      try {
        const previous = await growthService.getPreviousGrowthRecord(
          currentChild.id
        );
        setPreviousRecord(previous);
        if (previous) {
          setPreviousWeight(previous.weight.toString());
          // Convert previous height from mm to cm for display
          setPreviousHeight((previous.height / 10).toString());
          // Convert previous head circumference from mm to cm for display
          setPreviousHeadCirc((previous.headCircumference / 10).toString());
        } else {
          setPreviousWeight("");
          setPreviousHeight("");
          setPreviousHeadCirc("");
        }
      } catch (error) {
        setPreviousRecord(null);
        setPreviousWeight("");
        setPreviousHeight("");
        setPreviousHeadCirc("");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading growth data:", error);
      setError("Failed to load growth data");
      setLoading(false);
    }
  }, [currentChild.id, currentChild]);

  useFocusEffect(
    useCallback(() => {
      loadGrowthData();
    }, [loadGrowthData])
  );

  useEffect(() => {
    const currWeight = Number.parseFloat(currentWeight) || 0;

    if ((!previousRecord || previousWeight === "") && birthWeight) {
      const birthWeightVal = Number.parseFloat(birthWeight) || 0;
      setWeightGain(Math.round(currWeight - birthWeightVal));
    } else {
      const prevWeight = Number.parseFloat(previousWeight) || 0;
      setWeightGain(Math.round(currWeight - prevWeight));
    }

    const currHeight = Number.parseFloat(currentHeight) || 0;

    if ((!previousRecord || previousHeight === "") && birthHeight) {
      const birthHeightVal = Number.parseFloat(birthHeight) || 0;
      setHeightGain(Math.round(currHeight - birthHeightVal));
    } else {
      const prevHeight = Number.parseFloat(previousHeight) || 0;
      setHeightGain(Math.round(currHeight - prevHeight));
    }

    const currHeadCirc = Number.parseFloat(currentHeadCirc) || 0;

    if ((!previousRecord || previousHeadCirc === "") && birthHeadCirc) {
      const birthHeadCircVal = Number.parseFloat(birthHeadCirc) || 0;
      setHeadCircGain(Math.round(currHeadCirc - birthHeadCircVal));
    } else {
      const prevHeadCirc = Number.parseFloat(previousHeadCirc) || 0;
      setHeadCircGain(Math.round(currHeadCirc - prevHeadCirc));
    }
  }, [
    currentWeight,
    previousWeight,
    currentHeight,
    previousHeight,
    currentHeadCirc,
    previousHeadCirc,
    birthWeight,
    birthHeight,
    birthHeadCirc,
    previousRecord,
  ]);

  const recommendations = useMemo(
    () => getGrowthRecommendations(childAgeInMonths, childGender),
    [childAgeInMonths, childGender]
  );

  const handleWeightChange = (type, value) => {
    // Allow up to 5 digits for grams (e.g., 20000g)
    const validatedValue = value.replace(/[^0-9]/g, "");

    if (validatedValue.length > 5) {
      return;
    }

    if (type === "current") {
      setCurrentWeight(validatedValue);
      setHasWeightMeasurement(validatedValue !== "");
    } else {
      setPreviousWeight(validatedValue);
    }
  };

  const handleMeasurementChange = (type, value, setter, setHasMeasurement) => {
    // Allow up to 3 digits for centimeters (e.g., 999cm)
    const validatedValue = value.replace(/[^0-9]/g, "");

    if (validatedValue.length > 3) {
      return;
    }

    setter(validatedValue);
    setHasMeasurement(validatedValue !== "");
  };

  const handleProgressCalculated = (values) => {
    setProgressValues(values);
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    const d = new Date(date);

    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  };

  const saveGrowthData = async () => {
    try {
      if (!currentWeight || !currentHeight || !currentHeadCirc) {
        Alert.alert(
          "Missing Information",
          "Please enter values for weight (g), height (cm), and head circumference (cm). These fields are required.",
          [{ text: "OK" }]
        );
        return;
      }

      setLoading(true);

      const weightInGrams = Math.round(Number.parseFloat(currentWeight || "0"));
      // Convert height from cm to mm before saving
      const heightInMm = Math.round(
        Number.parseFloat(currentHeight || "0") * 10
      );
      // Convert head circumference from cm to mm before saving
      const headCircInMm = Math.round(
        Number.parseFloat(currentHeadCirc || "0") * 10
      );

      if (isNaN(weightInGrams) || isNaN(heightInMm) || isNaN(headCircInMm)) {
        Alert.alert(
          "Invalid Input",
          "Please enter valid numbers for weight, height, and head circumference"
        );
        setLoading(false);
        return;
      }

      const dateTimeString = formatDateTime(currentDateTime);
      const updatedNotes = notes
        ? `${notes}\n\nMeasured on: ${dateTimeString}`
        : `Measured on: ${dateTimeString}`;

      const growthData = {
        childId: currentChild.id,
        weight: weightInGrams,
        height: heightInMm,
        headCircumference: headCircInMm,
        notes: updatedNotes,
        weightProgress: progressValues.weightProgress,
        heightProgress: progressValues.heightProgress,
        headCircumferenceProgress: progressValues.headCircProgress,
      };

      let result;

      if (isEditMode && latestRecord) {
        result = await growthService.updateGrowthRecord(
          latestRecord.id,
          growthData
        );
        Alert.alert("Success", "Growth record updated successfully");
      } else {
        result = await growthService.createGrowthRecord(growthData);
        Alert.alert("Success", "Growth record saved successfully");
      }

      await loadGrowthData();
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving growth data:", error);

      let errorMessage = "Failed to save growth data";

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not recorded";

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Not recorded";
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Not recorded";
    }
  };

  const getChildBirthDate = () => {
    if (currentChild.birthDate) return formatDate(currentChild.birthDate);
    if (currentChild.dateOfBirth) return formatDate(currentChild.dateOfBirth);
    if (currentChild.dob) return formatDate(currentChild.dob);
    if (currentChild.birth_date) return formatDate(currentChild.birth_date);

    if (childAgeInMonths) {
      const estimatedBirthDate = new Date();
      estimatedBirthDate.setMonth(
        estimatedBirthDate.getMonth() - childAgeInMonths
      );
      return formatDate(estimatedBirthDate);
    }

    return "Not recorded";
  };

  const isWeightGainSufficient = weightGain >= recommendations.minWeightGain;
  const isHeightGainSufficient = heightGain >= recommendations.minHeightGain;
  const isHeadCircGainSufficient =
    headCircGain >= recommendations.minHeightGain;

  const calculateGrowthPercentage = (actual, min) => {
    if (min === 0) return 100;
    const percentage = Math.round((actual / min) * 100);
    return Math.min(percentage, 100);
  };

  const weightGainPercentage = calculateGrowthPercentage(
    weightGain,
    recommendations.minWeightGain
  );
  const heightGainPercentage = calculateGrowthPercentage(
    heightGain,
    recommendations.minHeightGain
  );
  const headCircGainPercentage = calculateGrowthPercentage(
    headCircGain,
    recommendations.minHeadCircGain
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <Ionicons
            name={notificationsEnabled ? "notifications" : "notifications-off"}
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
      ),
      title: `${currentChild.name.split(" ")[0]}'s Growth Details`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

  if (loading && !latestRecord && !previousRecord) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading growth data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !latestRecord && !previousRecord) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadGrowthData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Add this right before the return statement, after the if (error && !latestRecord && !previousRecord) block
  console.log("GrowthScreen RENDER STATE:", {
    birthWeight,
    birthHeight,
    birthHeadCirc,
    currentWeight,
    currentHeight,
    currentHeadCirc,
    hasWeightMeasurement,
    hasHeightMeasurement,
    hasHeadCircMeasurement,
    currentChild: {
      id: currentChild.id,
      name: currentChild.name,
      birthWeight: currentChild.birthWeight,
      birthHeight: currentChild.birthHeight,
      birthHeadCircumference: currentChild.birthHeadCircumference,
      weight: currentChild.weight,
      height: currentChild.height,
      headCircumference: currentChild.headCircumference,
      activities:
        currentChild.activities && currentChild.activities.growth
          ? {
              birthWeight: currentChild.activities.growth.birthWeight,
              birthHeight: currentChild.activities.growth.birthHeight,
              birthHeadCircumference:
                currentChild.activities.growth.birthHeadCircumference,
              weight: currentChild.activities.growth.weight,
              height: currentChild.activities.growth.height,
              headCircumference:
                currentChild.activities.growth.headCircumference,
            }
          : "No activities.growth",
    },
  });

  // Hardcode the birth measurements for testing if they're still not available
  const finalBirthWeight =
    birthWeight || currentChild.weight || currentChild.birthWeight || "3500";
  const finalBirthHeight =
    birthHeight || currentChild.height || currentChild.birthHeight || "50";
  const finalBirthHeadCirc =
    birthHeadCirc ||
    currentChild.headCircumference ||
    currentChild.birthHeadCircumference ||
    "35";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.dateTimeBanner,
            { backgroundColor: `${theme.primary}20` },
          ]}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={theme.primary}
            style={styles.dateTimeBannerIcon}
          />
          <Text style={[styles.dateTimeBannerText, { color: theme.text }]}>
            Current date and time: {formatDateTime(currentDateTime)}
          </Text>
        </View>

        <ChildInfoCard
          childData={currentChild}
          screenType="sleep"
          customIcon={
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.primary}
            />
          }
          customTitle="Child Information"
        />

        <ChildRecommendationCard
          theme={theme}
          childAgeInMonths={childAgeInMonths}
          childGender={childGender}
          recommendations={recommendations}
          weightGain={weightGain}
          heightGain={heightGain}
          headCircGain={headCircGain}
          isWeightGainSufficient={isWeightGainSufficient}
          isHeightGainSufficient={isHeightGainSufficient}
          isHeadCircGainSufficient={isHeadCircGainSufficient}
          weightGainPercentage={weightGainPercentage}
          heightGainPercentage={heightGainPercentage}
          headCircGainPercentage={headCircGainPercentage}
          targetWeight={targetWeight}
          targetHeight={targetHeight}
          targetHeadCirc={targetHeadCirc}
          screenType="growth"
          whoStandard={recommendations.whoStandard}
        />

        <BirthDataCard
          theme={theme}
          childAgeInMonths={childAgeInMonths}
          birthWeight={finalBirthWeight}
          birthHeight={finalBirthHeight}
          birthHeadCirc={finalBirthHeadCirc}
          childGender={childGender}
          recommendations={recommendations}
          childName={currentChild.name.split(" ")[0]}
          birthDate={getChildBirthDate()}
        />

        <AreaChart
          theme={theme}
          getBarChartData={getBarChartData}
          getHeightChartData={getHeightChartData}
          getHeadCircChartData={getHeadCircChartData}
          weightGain={weightGain}
          heightGain={heightGain}
          headCircGain={headCircGain}
          isWeightGainSufficient={isWeightGainSufficient}
          isHeightGainSufficient={isHeightGainSufficient}
          isHeadCircGainSufficient={isHeadCircGainSufficient}
          recommendations={recommendations}
          targetWeight={targetWeight}
          targetHeight={targetHeight}
          targetHeadCirc={targetHeadCirc}
          currentWeight={currentWeight}
          currentHeight={currentHeight}
          currentHeadCirc={currentHeadCirc}
          birthWeight={finalBirthWeight}
          birthHeight={finalBirthHeight}
          birthHeadCirc={finalBirthHeadCirc}
          onProgressCalculated={handleProgressCalculated}
          hasWeightMeasurement={hasWeightMeasurement}
          hasHeightMeasurement={hasHeightMeasurement}
          hasHeadCircMeasurement={hasHeadCircMeasurement}
        />

        <View
          style={[
            styles.timingMessageContainer,
            { backgroundColor: `${theme.primary}15` },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={theme.primary}
            style={styles.timingIcon}
          />
          <Text style={[styles.timingMessageText, { color: theme.text }]}>
            New growth record can be made tomorrow at 12:00 PM
          </Text>
        </View>

        <GrowthMeasurementsInput
          theme={theme}
          isEditMode={isEditMode}
          hasExistingMeasurements={hasExistingMeasurements}
          latestRecord={latestRecord}
          setIsEditMode={setIsEditMode}
          formatDate={formatDate}
          previousRecord={previousRecord}
          previousWeight={previousWeight}
          handleWeightChange={handleWeightChange}
          currentWeight={currentWeight}
          previousHeight={previousHeight}
          handleMeasurementChange={(type, value, setter) =>
            handleMeasurementChange(
              type,
              value,
              setter,
              setter === setCurrentHeight
                ? setHasHeightMeasurement
                : setHasHeadCircMeasurement
            )
          }
          setPreviousHeight={setPreviousHeight}
          currentHeight={currentHeight}
          setCurrentHeight={setCurrentHeight}
          previousHeadCirc={previousHeadCirc}
          setPreviousHeadCirc={setPreviousHeadCirc}
          currentHeadCirc={currentHeadCirc}
          setCurrentHeadCirc={setCurrentHeadCirc}
          notes={notes}
          setNotes={setNotes}
          weightGain={weightGain}
          heightGain={heightGain}
          headCircGain={headCircGain}
          loading={loading}
          saveGrowthData={saveGrowthData}
          showTodayOnly={hasExistingMeasurements}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  dateTimeBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  dateTimeBannerIcon: {
    marginRight: 5,
  },
  dateTimeBannerText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  measurementsCard: {
    marginHorizontal: 10,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  measurementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  measurementItem: {
    flex: 1,
    alignItems: "center",
  },
  measurementLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  measurementGain: {
    fontSize: 12,
    marginTop: 3,
  },
  lastMeasuredText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "right",
  },
  headerButton: {
    marginRight: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  timingMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#5a87ff",
  },
  timingIcon: {
    marginRight: 8,
  },
  timingMessageText: {
    fontSize: 14,
    flex: 1,
  },
});
