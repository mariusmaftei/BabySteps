import React, { useState, useEffect, useCallback } from "react";
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

// Import components
import GrowthCharts from "../../../components/growth/growth-charts";
import GrowthMeasurementsInput from "../../../components/growth/growth-measurements-input";

import GrowthTips from "../../../components/growth/growth-tips";
import BirthDataCard from "../../../components/growth/birth-data-card";
// WHO Growth Standards for Infants (0-12 months)
// WHO Growth Standards for Infants (0-12 months)
const WHO_STANDARDS = {
  boys: [
    { age: 0, weight: 3.3, height: 49.9, headCirc: 34.5 }, // Newborn
    { age: 1, weight: 4.5, height: 54.7, headCirc: 37.1 }, // 1 month
    { age: 2, weight: 5.6, height: 58.4, headCirc: 39.1 }, // 2 months
    { age: 3, weight: 6.4, height: 61.4, headCirc: 40.5 }, // 3 months
    { age: 4, weight: 7.0, height: 63.9, headCirc: 41.7 }, // 4 months
    { age: 5, weight: 7.5, height: 65.9, headCirc: 42.5 }, // 5 months
    { age: 6, weight: 7.9, height: 67.6, headCirc: 43.2 }, // 6 months
    { age: 7, weight: 8.3, height: 69.2, headCirc: 43.8 }, // 7 months
    { age: 8, weight: 8.6, height: 70.6, headCirc: 44.3 }, // 8 months
    { age: 9, weight: 8.9, height: 72.0, headCirc: 44.7 }, // 9 months
    { age: 10, weight: 9.2, height: 73.3, headCirc: 45.2 }, // 10 months
    { age: 11, weight: 9.4, height: 74.5, headCirc: 45.6 }, // 11 months
    { age: 12, weight: 9.6, height: 75.7, headCirc: 46.0 }, // 12 months
  ],
  girls: [
    { age: 0, weight: 3.2, height: 49.1, headCirc: 33.9 }, // Newborn
    { age: 1, weight: 4.2, height: 53.7, headCirc: 36.0 }, // 1 month
    { age: 2, weight: 5.1, height: 57.1, headCirc: 37.9 }, // 2 months
    { age: 3, weight: 5.8, height: 59.8, headCirc: 39.3 }, // 3 months
    { age: 4, weight: 6.4, height: 62.1, headCirc: 40.5 }, // 4 months
    { age: 5, weight: 6.9, height: 64.0, headCirc: 41.3 }, // 5 months
    { age: 6, weight: 7.3, height: 65.7, headCirc: 42.0 }, // 6 months
    { age: 7, weight: 7.6, height: 67.3, headCirc: 42.6 }, // 7 months
    { age: 8, weight: 7.9, height: 68.7, headCirc: 43.1 }, // 8 months
    { age: 9, weight: 8.2, height: 70.1, headCirc: 43.6 }, // 9 months
    { age: 10, weight: 8.5, height: 71.5, headCirc: 44.0 }, // 10 months
    { age: 11, weight: 8.7, height: 72.8, headCirc: 44.4 }, // 11 months
    { age: 12, weight: 8.9, height: 74.0, headCirc: 44.8 }, // 12 months
  ],
};

// Helper function to get simplified age group label (only 0-3 and 4-12)
const getAgeGroupLabel = (ageInMonths) => {
  if (ageInMonths <= 3) return "0-3 months";
  if (ageInMonths <= 12) return "4-12 months";
  return "Over 12 months";
};

export default function GrowthDetailsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [previousRecord, setPreviousRecord] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [birthWeight, setBirthWeight] = useState(null);
  const [birthHeight, setBirthHeight] = useState(null);
  const [birthHeadCirc, setBirthHeadCirc] = useState(null);
  const [hasExistingMeasurements, setHasExistingMeasurements] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState("weight"); // Options: "weight", "height", "headCirc"
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [targetWeight, setTargetWeight] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [targetHeadCirc, setTargetHeadCirc] = useState(0);

  // Growth inputs state - always start with "0" for new measurements
  const [currentWeight, setCurrentWeight] = useState("0");
  const [previousWeight, setPreviousWeight] = useState("0");
  const [currentHeight, setCurrentHeight] = useState("0");
  const [previousHeight, setPreviousHeight] = useState("0");
  const [currentHeadCirc, setCurrentHeadCirc] = useState("0");
  const [previousHeadCirc, setPreviousHeadCirc] = useState("0");
  const [notes, setNotes] = useState("");

  // Calculate weight gain in grams
  const [weightGain, setWeightGain] = useState(0);
  const [heightGain, setHeightGain] = useState(0);
  const [headCircGain, setHeadCircGain] = useState(0);

  // Prepare data for bar chart comparison
  const getBarChartData = () => {
    // Get birth weight from child data (Child table)
    let birthWeightValue = birthWeight ? Number.parseFloat(birthWeight) : 0;
    if (isNaN(birthWeightValue)) {
      console.log("Birth weight is NaN, using 0 instead");
      birthWeightValue = 0;
    }
    console.log("Chart using birth weight:", birthWeightValue);

    const hasPreviousRecord = previousRecord !== null || previousWeight !== "";
    const currentWeightValue = Number.parseFloat(currentWeight) || 0;

    // If we don't have a previous record yet, only show Birth and New Measurement
    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthWeightValue, currentWeightValue],
            colors: [
              (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Orange for birth
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`, // Blue for new measurement
            ],
          },
        ],
      };
    }

    // Otherwise show all three values
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
            (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Orange for birth
            (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // Purple for previous
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`, // Blue for new measurement
          ],
        },
      ],
    };
  };

  // Prepare data for height comparison chart
  const getHeightChartData = () => {
    // Get birth height or use 0 if not available
    let birthHeightValue = birthHeight ? Number.parseFloat(birthHeight) : 0;
    if (isNaN(birthHeightValue)) {
      console.log("Birth height is NaN, using 0 instead");
      birthHeightValue = 0;
    }
    const hasPreviousRecord = previousRecord !== null || previousHeight !== "";
    const currentHeightValue = Number.parseFloat(currentHeight) || 0;

    // If we don't have a previous record yet, only show Birth and New Measurement
    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthHeightValue, currentHeightValue],
            colors: [
              (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Orange for birth
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`, // Blue for new measurement
            ],
          },
        ],
      };
    }

    // Otherwise show all three values
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
            (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Orange for birth
            (opacity = 1) => `rgba(134, 65, 44, ${opacity})`, // Purple for previous
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`, // Blue for new measurement
          ],
        },
      ],
    };
  };

  // Prepare data for head circumference comparison chart
  const getHeadCircChartData = () => {
    // Get birth head circumference or use 0 if not available
    let birthHeadCircValue = birthHeadCirc
      ? Number.parseFloat(birthHeadCirc)
      : 0;
    if (isNaN(birthHeadCircValue)) {
      console.log("Birth head circumference is NaN, using 0 instead");
      birthHeadCircValue = 0;
    }
    const hasPreviousRecord =
      previousRecord !== null || previousHeadCirc !== "";
    const currentHeadCircValue = Number.parseFloat(currentHeadCirc) || 0;

    // If we don't have a previous record yet, only show Birth and New Measurement
    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthHeadCircValue, currentHeadCircValue],
            colors: [
              (opacity = 1) => `rgba(255, 45, 85, ${opacity})`, // Pink for birth
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`, // Blue for new measurement
            ],
          },
        ],
      };
    }

    // Otherwise show all three values
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
            (opacity = 1) => `rgba(255, 45, 85, ${opacity})`, // Pink for birth
            (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // Purple for previous
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`, // Blue for new measurement
          ],
        },
      ],
    };
  };

  // Debug child data to see what fields are available
  useEffect(() => {
    console.log("Current child data:", JSON.stringify(currentChild, null, 2));
  }, [currentChild]);

  // Get child's age as a number for recommendations
  const childAgeText = currentChild.age;
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;

  // Get child's gender for WHO standards
  const childGender = currentChild.gender
    ? currentChild.gender.toLowerCase()
    : "boys"; // Default to boys if gender not specified

  // Update current date and time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Calculate dynamic target values based on WHO standards and child's age
  useEffect(() => {
    // Get WHO standards for current age
    const currentStandards = getWHOStandards(childAgeInMonths, childGender);

    // Get WHO standards for next month
    const nextMonthStandards = getWHOStandards(
      childAgeInMonths + 1,
      childGender
    );

    // Calculate target values (difference between current and next month standards)
    const birthWeightValue = Number.parseFloat(birthWeight) || 0;
    const birthHeightValue = Number.parseFloat(birthHeight) || 0;
    const birthHeadCircValue = Number.parseFloat(birthHeadCirc) || 0;

    // Calculate target weight in grams
    const whoWeightTarget = Math.round(
      (nextMonthStandards.weight - currentStandards.weight) * 1000
    );
    setTargetWeight(whoWeightTarget > 0 ? whoWeightTarget : 500); // Minimum 500g per month if WHO target is too small

    // Calculate target height in mm
    const whoHeightTarget = Math.round(
      (nextMonthStandards.height - currentStandards.height) * 10
    );
    setTargetHeight(whoHeightTarget > 0 ? whoHeightTarget : 10); // Minimum 10mm per month if WHO target is too small

    // Calculate target head circumference in mm
    const whoHeadCircTarget = Math.round(
      (nextMonthStandards.headCirc - currentStandards.headCirc) * 10
    );
    setTargetHeadCirc(whoHeadCircTarget > 0 ? whoHeadCircTarget : 5); // Minimum 5mm per month if WHO target is too small

    console.log("Dynamic targets calculated:", {
      weight: whoWeightTarget,
      height: whoHeightTarget,
      headCirc: whoHeadCircTarget,
    });
  }, [childAgeInMonths, childGender, birthWeight, birthHeight, birthHeadCirc]);

  // Load growth data
  const loadGrowthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading growth data for child ID:", currentChild.id);

      // Set birth measurements from child data
      if (currentChild.birthWeight) {
        setBirthWeight(currentChild.birthWeight.toString());
      }
      if (currentChild.birthHeight) {
        setBirthHeight(currentChild.birthHeight.toString());
      }
      if (currentChild.birthHeadCircumference) {
        setBirthHeadCirc(currentChild.birthHeadCircumference.toString());
      }

      // Set birth measurements from child data - these come from the Child table
      console.log("Child data:", currentChild);
      if (currentChild.weight) {
        // Use weight in grams directly
        setBirthWeight(currentChild.weight.toString());
        console.log("Setting birth weight to:", currentChild.weight, "g");
      }
      if (currentChild.height) {
        // Use height in mm directly
        setBirthHeight(currentChild.height.toString());
        console.log("Setting birth height to:", currentChild.height, "mm");
      }
      if (currentChild.headCircumference) {
        // Use head circumference in mm directly
        setBirthHeadCirc(currentChild.headCircumference.toString());
        console.log(
          "Setting birth head circumference to:",
          currentChild.headCircumference,
          "mm"
        );
      }

      // Get all growth records
      try {
        const records = await growthService.getGrowthRecords(currentChild.id);
        setGrowthRecords(records);

        // If we have records, we have existing measurements
        if (records && records.length > 0) {
          setHasExistingMeasurements(true);
        }
      } catch (error) {
        console.log(
          "No growth records found, will create initial record if needed"
        );
        setGrowthRecords([]);
        setHasExistingMeasurements(false);
        // Ensure inputs are set to 0 for new users
        setCurrentWeight("0");
        setCurrentHeight("0");
        setCurrentHeadCirc("0");
      }

      // Get latest record
      try {
        const latest = await growthService.getLatestGrowthRecord(
          currentChild.id
        );
        setLatestRecord(latest);
        // Display values in their original units (g and mm)
        setCurrentWeight(latest.weight.toString());
        setCurrentHeight(latest.height.toString());
        setCurrentHeadCirc(latest.headCircumference.toString());
        setHasExistingMeasurements(true);
      } catch (error) {
        console.log(
          "No latest growth record found - this is normal for new users"
        );
        setLatestRecord(null);
        // Always set current values to 0 for new input
        setCurrentWeight("0");
        setCurrentHeight("0");
        setCurrentHeadCirc("0");
        setHasExistingMeasurements(false);
      }

      // Get previous record
      try {
        const previous = await growthService.getPreviousGrowthRecord(
          currentChild.id
        );
        setPreviousRecord(previous);
        // Display values in their original units (g and mm)
        setPreviousWeight(previous.weight.toString());
        setPreviousHeight(previous.height.toString());
        setPreviousHeadCirc(previous.headCircumference.toString());
      } catch (error) {
        console.log(
          "No previous growth record found - this is expected for new users"
        );
        // If no previous record, don't set previous values
        // This will hide the previous values until a second record is added
        setPreviousRecord(null);
        setPreviousWeight("");
        setPreviousHeight("");
        setPreviousHeadCirc("");
      }

      // Get statistics
      try {
        const stats = await growthService.getGrowthStatistics(currentChild.id);
        setStatistics(stats);
      } catch (error) {
        console.log(
          "No growth statistics found - this is normal for new users"
        );
        // Set default empty statistics
        setStatistics({
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

      setLoading(false);
    } catch (error) {
      console.error("Error loading growth data:", error);
      setError("Failed to load growth data");
      setLoading(false);
    }
  }, [currentChild.id, currentChild]);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadGrowthData();
    }, [loadGrowthData])
  );

  // Update gains when inputs change
  useEffect(() => {
    const currWeight = Number.parseFloat(currentWeight) || 0;

    // If there's no previous record or previous weight is empty, compare with birth weight
    if ((!previousRecord || previousWeight === "") && birthWeight) {
      const birthWeightVal = Number.parseFloat(birthWeight) || 0;
      setWeightGain(Math.round(currWeight - birthWeightVal)); // Calculate gain in grams
    } else {
      const prevWeight = Number.parseFloat(previousWeight) || 0;
      setWeightGain(Math.round(currWeight - prevWeight)); // Calculate gain in grams
    }

    const currHeight = Number.parseFloat(currentHeight) || 0;

    // If there's no previous record or previous height is empty, compare with birth height
    if ((!previousRecord || previousHeight === "") && birthHeight) {
      const birthHeightVal = Number.parseFloat(birthHeight) || 0;
      setHeightGain(Math.round(currHeight - birthHeightVal)); // Calculate gain in mm
    } else {
      const prevHeight = Number.parseFloat(previousHeight) || 0;
      setHeightGain(Math.round(currHeight - prevHeight)); // Calculate gain in mm
    }

    const currHeadCirc = Number.parseFloat(currentHeadCirc) || 0;

    // If there's no previous record or previous head circ is empty, compare with birth head circumference
    if ((!previousRecord || previousHeadCirc === "") && birthHeadCirc) {
      const birthHeadCircVal = Number.parseFloat(birthHeadCirc) || 0;
      setHeadCircGain(Math.round(currHeadCirc - birthHeadCircVal)); // Calculate gain in mm
    } else {
      const prevHeadCirc = Number.parseFloat(previousHeadCirc) || 0;
      setHeadCircGain(Math.round(currHeadCirc - prevHeadCirc)); // Calculate gain in mm
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

  // Get WHO standards for the child's age
  const getWHOStandards = (ageInMonths, gender) => {
    // Cap age at 12 months for now since we only have data up to 12 months
    const cappedAge = Math.min(ageInMonths, 12);

    // Get the standards for the child's gender
    const genderStandards =
      WHO_STANDARDS[gender === "female" ? "girls" : "boys"];

    // Find the closest age in the standards
    // For exact matches
    const exactMatch = genderStandards.find(
      (standard) => standard.age === cappedAge
    );
    if (exactMatch) return exactMatch;

    // For ages between standard measurements, interpolate
    const lowerStandard = genderStandards
      .filter((standard) => standard.age < cappedAge)
      .sort((a, b) => b.age - a.age)[0];
    const upperStandard = genderStandards
      .filter((standard) => standard.age > cappedAge)
      .sort((a, b) => a.age - b.age)[0];

    if (lowerStandard && upperStandard) {
      const ageDiff = upperStandard.age - lowerStandard.age;
      const ageRatio = (cappedAge - lowerStandard.age) / ageDiff;

      return {
        age: cappedAge,
        weight:
          lowerStandard.weight +
          (upperStandard.weight - lowerStandard.weight) * ageRatio,
        height:
          lowerStandard.height +
          (upperStandard.height - lowerStandard.height) * ageRatio,
        headCirc:
          lowerStandard.headCirc +
          (upperStandard.headCirc - lowerStandard.headCirc) * ageRatio,
      };
    }

    // If we can't interpolate, return the closest standard
    return lowerStandard || upperStandard || genderStandards[0];
  };

  // Calculate expected monthly growth based on WHO standards
  const calculateExpectedMonthlyGrowth = (ageInMonths, gender) => {
    const currentStandard = getWHOStandards(ageInMonths, gender);
    const previousStandard = getWHOStandards(
      Math.max(0, ageInMonths - 1),
      gender
    );

    return {
      weight: Math.round(
        (currentStandard.weight - previousStandard.weight) * 1000
      ), // grams per month
      height: Math.round(
        (currentStandard.height - previousStandard.height) * 10
      ), // mm per month
      headCirc: Math.round(
        (currentStandard.headCirc - previousStandard.headCirc) * 10
      ), // mm per month
    };
  };

  // Get growth recommendations based on WHO standards
  const getGrowthRecommendations = (ageInMonths, gender) => {
    // Get WHO standards for current age
    const whoStandard = getWHOStandards(ageInMonths, gender);

    // Calculate expected monthly growth
    const expectedMonthlyGrowth = calculateExpectedMonthlyGrowth(
      ageInMonths,
      gender
    );

    // Convert monthly growth to weekly (divide by ~4.3 weeks per month)
    const weeklyGrowthFactor = 1 / 4.3;
    const expectedWeeklyGrowth = {
      weight: Math.round(expectedMonthlyGrowth.weight * weeklyGrowthFactor), // grams per week
      height: Math.round(expectedMonthlyGrowth.height * weeklyGrowthFactor), // mm per week
      headCirc: Math.round(expectedMonthlyGrowth.headCirc * weeklyGrowthFactor), // mm per week
    };

    // Allow for a range of +/- 15% around the expected growth
    const minGrowth = {
      weight: Math.round(expectedWeeklyGrowth.weight * 0.85),
      height: Math.round(expectedMonthlyGrowth.height * 0.85),
      headCirc: Math.round(expectedMonthlyGrowth.headCirc * 0.85),
    };

    const maxGrowth = {
      weight: Math.round(expectedWeeklyGrowth.weight * 1.15),
      height: Math.round(expectedMonthlyGrowth.height * 1.15),
      headCirc: Math.round(expectedMonthlyGrowth.headCirc * 1.15),
    };

    // Allow for a range of +/- 10% around the expected measurements
    const expectedRange = {
      weight: {
        min: Math.round(whoStandard.weight * 0.9 * 10) / 10, // kg with 1 decimal
        max: Math.round(whoStandard.weight * 1.1 * 10) / 10, // kg with 1 decimal
      },
      height: {
        min: Math.round(whoStandard.height * 0.95),
        max: Math.round(whoStandard.height * 1.05),
      },
      headCirc: {
        min: Math.round(whoStandard.headCirc * 0.95),
        max: Math.round(whoStandard.headCirc * 1.05),
      },
    };

    return {
      ageGroup: getAgeGroupLabel(ageInMonths),
      exactAge: ageInMonths,
      whoStandard: whoStandard,
      weightGainPerWeek: `${minGrowth.weight}-${maxGrowth.weight} grams`,
      heightGainPerMonth: `${expectedMonthlyGrowth.height / 10}-${
        Math.round(expectedMonthlyGrowth.height * 1.15) / 10
      } cm`,
      headCircGainPerMonth: `${expectedMonthlyGrowth.headCirc / 10}-${
        Math.round(expectedMonthlyGrowth.headCirc * 1.15) / 10
      } cm`,
      minWeightGain: minGrowth.weight,
      maxWeightGain: maxGrowth.weight,
      minHeightGain: minGrowth.height,
      maxHeightGain: maxGrowth.height,
      minHeadCircGain: minGrowth.headCirc,
      maxHeadCircGain: maxGrowth.headCirc,
      expectedWeight: expectedRange.weight,
      expectedHeight: expectedRange.height,
      expectedHeadCirc: expectedRange.headCirc,
      // Add dynamic monthly targets
      targetWeightPerMonth: targetWeight,
      targetHeightPerMonth: targetHeight,
      targetHeadCircPerMonth: targetHeadCirc,
    };
  };

  const recommendations = getGrowthRecommendations(
    childAgeInMonths,
    childGender
  );

  // Handle input change with validation for weight (grams)
  const handleWeightChange = (type, value) => {
    // Validate input to only allow whole numbers with max 5 digits total (for grams)
    const validatedValue = value.replace(/[^0-9]/g, "");

    // Limit to max 5 digits for grams
    if (validatedValue.length > 5) {
      return;
    }

    if (type === "current") {
      setCurrentWeight(validatedValue);
    } else {
      setPreviousWeight(validatedValue);
    }
  };

  // Handle input change with validation for height and head circumference (mm)
  const handleMeasurementChange = (type, value, setter) => {
    // Validate input to only allow whole numbers with max 4 digits total (for mm)
    const validatedValue = value.replace(/[^0-9]/g, "");

    // Limit to max 4 digits for mm
    if (validatedValue.length > 4) {
      return;
    }

    setter(validatedValue);
  };

  // Format date and time
  const formatDateTime = (date) => {
    if (!date) return "";
    const d = new Date(date);

    // Format date as DD/MM/YYYY
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    // Format time as HH:MM
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  };

  // Save growth data
  const saveGrowthData = async () => {
    try {
      setLoading(true);

      // Use values directly in grams and mm (no conversion needed)
      const weightInGrams = Math.round(Number.parseFloat(currentWeight || "0"));
      const heightInMm = Math.round(Number.parseFloat(currentHeight || "0"));
      const headCircInMm = Math.round(
        Number.parseFloat(currentHeadCirc || "0")
      );

      // Validate that we have valid numbers
      if (isNaN(weightInGrams) || isNaN(heightInMm) || isNaN(headCircInMm)) {
        Alert.alert(
          "Invalid Input",
          "Please enter valid numbers for weight, height, and head circumference"
        );
        setLoading(false);
        return;
      }

      // Add current date and time to notes
      const dateTimeString = formatDateTime(currentDateTime);
      const updatedNotes = notes
        ? `${notes}\n\nMeasured on: ${dateTimeString}`
        : `Measured on: ${dateTimeString}`;

      const growthData = {
        childId: currentChild.id,
        weight: weightInGrams, // Store in grams
        height: heightInMm, // Store in mm
        headCircumference: headCircInMm, // Store in mm
        notes: updatedNotes,
      };

      console.log("Saving growth data:", growthData);

      let result;

      if (isEditMode && latestRecord) {
        // Update existing record
        result = await growthService.updateGrowthRecord(
          latestRecord.id,
          growthData
        );
        Alert.alert("Success", "Growth record updated successfully");
      } else {
        // Create new record
        result = await growthService.createGrowthRecord(growthData);
        Alert.alert("Success", "Growth record saved successfully");
      }

      // Reload data
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

  // Format date - simplified to just show the date
  const formatDateSimple = (date) => {
    if (!date) return "Not recorded";

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Not recorded";
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Not recorded";
    }
  };

  // Format date - simplified to just show the date in DD/MM/YYYY format
  // Format date - simplified to just show the date
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

  // Get birth date from various possible fields in the child object - simplified
  const getChildBirthDate = () => {
    // Check various possible field names for birth date
    if (currentChild.birthDate) return formatDate(currentChild.birthDate);
    if (currentChild.dateOfBirth) return formatDate(currentChild.dateOfBirth);
    if (currentChild.dob) return formatDate(currentChild.dob);
    if (currentChild.birth_date) return formatDate(currentChild.birth_date);

    // If we have the child's age in months, we can estimate the birth date
    if (childAgeInMonths) {
      const estimatedBirthDate = new Date();
      estimatedBirthDate.setMonth(
        estimatedBirthDate.getMonth() - childAgeInMonths
      );
      return formatDate(estimatedBirthDate);
    }

    return "Not recorded";
  };

  // Check if growth meets WHO recommendations
  const isWeightGainSufficient = weightGain >= recommendations.minWeightGain;
  const isHeightGainSufficient = heightGain >= recommendations.minHeightGain;
  const isHeadCircGainSufficient =
    headCircGain >= recommendations.minHeadCircGain;

  // Calculate the percentage of recommended growth
  const calculateGrowthPercentage = (actual, min) => {
    if (min === 0) return 100; // If minimum is 0, any growth is 100%
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

  // Set up the notification button in the header
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

  // Render loading state
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

  // Render error state
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Date/Time Banner */}
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

        {/* Birth Data Card - New Component */}
        <BirthDataCard
          theme={theme}
          childAgeInMonths={childAgeInMonths}
          birthWeight={birthWeight}
          birthHeight={birthHeight}
          birthHeadCirc={birthHeadCirc}
          childGender={childGender}
          recommendations={recommendations}
          childName={currentChild.name.split(" ")[0]} // Get first name
          birthDate={getChildBirthDate()}
        />

        {/* Charts with Tabs */}
        <GrowthCharts
          theme={theme}
          activeChartTab={activeChartTab}
          setActiveChartTab={setActiveChartTab}
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
          birthWeight={birthWeight}
          birthHeight={birthHeight}
          birthHeadCirc={birthHeadCirc}
        />

        {/* Growth Measurements Input */}
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
          handleMeasurementChange={handleMeasurementChange}
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
        />

        {/* Growth Tips */}
        <GrowthTips theme={theme} childAgeInMonths={childAgeInMonths} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateTimeBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateTimeBannerIcon: {
    marginRight: 8,
  },
  dateTimeBannerText: {
    flex: 1,
    fontSize: 14,
  },
});
