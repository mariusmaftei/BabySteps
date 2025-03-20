import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BarChart, LineChart } from "react-native-chart-kit";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

const screenWidth = Dimensions.get("window").width;

export default function GrowthDetailsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Get child's age as a number for recommendations
  const childAgeText = currentChild.age;
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;

  // Growth inputs state
  const [currentWeight, setCurrentWeight] = useState("0");
  const [previousWeight, setPreviousWeight] = useState("0");
  const [currentHeight, setCurrentHeight] = useState("0");
  const [previousHeight, setPreviousHeight] = useState("0");
  const [currentHeadCirc, setCurrentHeadCirc] = useState("0");
  const [previousHeadCirc, setPreviousHeadCirc] = useState("0");

  // Calculate weight gain in grams
  const [weightGain, setWeightGain] = useState(0);
  const [heightGain, setHeightGain] = useState(0);
  const [headCircGain, setHeadCircGain] = useState(0);

  // Update gains when inputs change
  useEffect(() => {
    const currWeight = Number.parseFloat(currentWeight) || 0;
    const prevWeight = Number.parseFloat(previousWeight) || 0;
    setWeightGain(Math.round((currWeight - prevWeight) * 1000)); // Convert kg to grams

    const currHeight = Number.parseFloat(currentHeight) || 0;
    const prevHeight = Number.parseFloat(previousHeight) || 0;
    setHeightGain(Math.round((currHeight - prevHeight) * 10)); // Convert cm to mm

    const currHeadCirc = Number.parseFloat(currentHeadCirc) || 0;
    const prevHeadCirc = Number.parseFloat(previousHeadCirc) || 0;
    setHeadCircGain(Math.round((currHeadCirc - prevHeadCirc) * 10)); // Convert cm to mm
  }, [
    currentWeight,
    previousWeight,
    currentHeight,
    previousHeight,
    currentHeadCirc,
    previousHeadCirc,
  ]);

  // Growth recommendations based on age
  const getGrowthRecommendations = (ageInMonths) => {
    if (ageInMonths < 3) {
      // 0-3 months
      return {
        ageGroup: "Newborn (0-3 months)",
        weightGainPerWeek: "150-200 grams",
        heightGainPerMonth: "2.5-3.0 cm",
        headCircGainPerMonth: "1.5-2.0 cm",
        minWeightGain: 150,
        maxWeightGain: 200,
        minHeightGain: 6, // mm per week
        maxHeightGain: 7.5, // mm per week
        minHeadCircGain: 3.5, // mm per week
        maxHeadCircGain: 5, // mm per week
        expectedWeight: {
          min: 3.0, // kg
          max: 6.0, // kg
        },
        expectedHeight: {
          min: 49, // cm
          max: 60, // cm
        },
        expectedHeadCirc: {
          min: 35, // cm
          max: 40, // cm
        },
      };
    } else if (ageInMonths >= 3 && ageInMonths < 6) {
      // 3-6 months
      return {
        ageGroup: "Infant (3-6 months)",
        weightGainPerWeek: "100-150 grams",
        heightGainPerMonth: "1.5-2.0 cm",
        headCircGainPerMonth: "1.0-1.5 cm",
        minWeightGain: 100,
        maxWeightGain: 150,
        minHeightGain: 3.5, // mm per week
        maxHeightGain: 5, // mm per week
        minHeadCircGain: 2.5, // mm per week
        maxHeadCircGain: 3.5, // mm per week
        expectedWeight: {
          min: 5.5, // kg
          max: 8.0, // kg
        },
        expectedHeight: {
          min: 59, // cm
          max: 68, // cm
        },
        expectedHeadCirc: {
          min: 39, // cm
          max: 44, // cm
        },
      };
    } else if (ageInMonths >= 6 && ageInMonths < 12) {
      // 6-12 months
      return {
        ageGroup: "Infant (6-12 months)",
        weightGainPerWeek: "50-100 grams",
        heightGainPerMonth: "1.0-1.5 cm",
        headCircGainPerMonth: "0.5-1.0 cm",
        minWeightGain: 50,
        maxWeightGain: 100,
        minHeightGain: 2.5, // mm per week
        maxHeightGain: 3.5, // mm per week
        minHeadCircGain: 1, // mm per week
        maxHeadCircGain: 2.5, // mm per week
        expectedWeight: {
          min: 7.0, // kg
          max: 10.5, // kg
        },
        expectedHeight: {
          min: 65, // cm
          max: 76, // cm
        },
        expectedHeadCirc: {
          min: 43, // cm
          max: 47, // cm
        },
      };
    } else if (ageInMonths >= 12 && ageInMonths < 24) {
      // 12-24 months
      return {
        ageGroup: "Toddler (1-2 years)",
        weightGainPerWeek: "30-60 grams",
        heightGainPerMonth: "0.7-1.0 cm",
        headCircGainPerMonth: "0.3-0.5 cm",
        minWeightGain: 30,
        maxWeightGain: 60,
        minHeightGain: 1.5, // mm per week
        maxHeightGain: 2.5, // mm per week
        minHeadCircGain: 0.7, // mm per week
        maxHeadCircGain: 1.2, // mm per week
        expectedWeight: {
          min: 9.0, // kg
          max: 13.0, // kg
        },
        expectedHeight: {
          min: 74, // cm
          max: 88, // cm
        },
        expectedHeadCirc: {
          min: 46, // cm
          max: 49, // cm
        },
      };
    } else if (ageInMonths >= 24 && ageInMonths < 60) {
      // 2-5 years
      return {
        ageGroup: "Preschooler (2-5 years)",
        weightGainPerWeek: "20-40 grams",
        heightGainPerMonth: "0.5-0.7 cm",
        headCircGainPerMonth: "0.1-0.2 cm",
        minWeightGain: 20,
        maxWeightGain: 40,
        minHeightGain: 1, // mm per week
        maxHeightGain: 1.7, // mm per week
        minHeadCircGain: 0.2, // mm per week
        maxHeadCircGain: 0.5, // mm per week
        expectedWeight: {
          min: 12.0, // kg
          max: 19.0, // kg
        },
        expectedHeight: {
          min: 86, // cm
          max: 110, // cm
        },
        expectedHeadCirc: {
          min: 48, // cm
          max: 51, // cm
        },
      };
    } else {
      // 6+ years
      return {
        ageGroup: "School-age (6+ years)",
        weightGainPerWeek: "10-30 grams",
        heightGainPerMonth: "0.3-0.5 cm",
        headCircGainPerMonth: "Minimal",
        minWeightGain: 10,
        maxWeightGain: 30,
        minHeightGain: 0.7, // mm per week
        maxHeightGain: 1.2, // mm per week
        minHeadCircGain: 0, // mm per week
        maxHeadCircGain: 0.2, // mm per week
        expectedWeight: {
          min: 18.0, // kg
          max: 30.0, // kg
        },
        expectedHeight: {
          min: 108, // cm
          max: 130, // cm
        },
        expectedHeadCirc: {
          min: 50, // cm
          max: 52, // cm
        },
      };
    }
  };

  const recommendations = getGrowthRecommendations(childAgeInMonths);

  // Handle input change with validation for weight (kg)
  const handleWeightChange = (type, value) => {
    // Validate input to only allow numbers with max 4 digits total
    const validatedValue = value.replace(/[^0-9.]/g, "");

    // Limit to max 4 digits total (including decimal part)
    if (validatedValue.includes(".")) {
      const [whole, decimal] = validatedValue.split(".");
      if (whole.length > 4 || whole.length + decimal.length > 4) {
        return;
      }
      if (type === "current") {
        setCurrentWeight(whole + "." + decimal);
      } else {
        setPreviousWeight(whole + "." + decimal);
      }
    } else if (validatedValue.length > 4) {
      return;
    } else {
      if (type === "current") {
        setCurrentWeight(validatedValue);
      } else {
        setPreviousWeight(validatedValue);
      }
    }
  };

  // Handle input change with validation for height and head circumference (cm)
  const handleMeasurementChange = (type, value, setter) => {
    // Validate input to only allow numbers with max 3 digits total
    const validatedValue = value.replace(/[^0-9.]/g, "");

    // Limit to max 3 digits total (including decimal part)
    if (validatedValue.includes(".")) {
      const [whole, decimal] = validatedValue.split(".");
      if (whole.length > 3 || whole.length + decimal.length > 3) {
        return;
      }
      setter(whole + "." + decimal);
    } else if (validatedValue.length > 3) {
      return;
    } else {
      setter(validatedValue);
    }
  };

  // Check if growth meets recommendations
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

  // Calculate the percentage difference from recommended growth
  const calculateGrowthDifferencePercentage = (actual, min) => {
    if (min === 0) return 0; // If minimum is 0, no difference
    const diff = actual - min;
    const percentage = Math.round((diff / min) * 100);
    return percentage;
  };

  const weightDiffPercentage = calculateGrowthDifferencePercentage(
    weightGain,
    recommendations.minWeightGain
  );
  const heightDiffPercentage = calculateGrowthDifferencePercentage(
    heightGain,
    recommendations.minHeightGain
  );
  const headCircDiffPercentage = calculateGrowthDifferencePercentage(
    headCircGain,
    recommendations.minHeadCircGain
  );

  // Format percentage text with + or - sign
  const formatPercentageText = (percentage) => {
    return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
  };

  // Prepare data for bar chart comparison
  const getBarChartData = () => {
    return {
      labels: ["Previous", "Current"],
      datasets: [
        {
          data: [
            Number.parseFloat(previousWeight) || 0,
            Number.parseFloat(currentWeight) || 0,
          ],
          colors: [
            (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          ],
        },
      ],
    };
  };

  // Prepare data for growth trend line chart
  const getGrowthTrendData = () => {
    // Sample data - in a real app, this would come from a database of historical measurements
    return {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      datasets: [
        {
          data: [
            Number.parseFloat(previousWeight) - 0.5 || 0,
            Number.parseFloat(previousWeight) - 0.3 || 0,
            Number.parseFloat(previousWeight) - 0.1 || 0,
            Number.parseFloat(previousWeight) || 0,
            Number.parseFloat(currentWeight) || 0,
            // Projected next week based on current growth rate
            Number.parseFloat(currentWeight) + weightGain / 1000 || 0,
          ],
          color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Weight (kg)"],
    };
  };

  // Set up the notification button in the header
  React.useLayoutEffect(() => {
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Age Group Info */}
        <View style={styles.ageGroupContainer}>
          <Text style={[styles.ageGroupLabel, { color: theme.textSecondary }]}>
            Age Group:
          </Text>
          <View
            style={[
              styles.ageGroupInfo,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={18}
              color={theme.primary}
              style={styles.ageGroupIcon}
            />
            <Text style={[styles.ageGroupText, { color: theme.text }]}>
              {recommendations.ageGroup}
            </Text>
          </View>
        </View>

        {/* Weight Comparison Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="bar-chart"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Weight Comparison
            </Text>
          </View>

          <View style={styles.chartWrapper}>
            <BarChart
              data={getBarChartData()}
              width={screenWidth - 64}
              height={220}
              yAxisSuffix=" kg"
              chartConfig={{
                backgroundGradientFrom: theme.cardBackground,
                backgroundGradientTo: theme.cardBackground,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.7,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>

          <View
            style={[
              styles.weightGainContainer,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <Text
              style={[styles.weightGainLabel, { color: theme.textSecondary }]}
            >
              Weekly Weight Gain
            </Text>
            <Text
              style={[
                styles.weightGainValue,
                {
                  color: isWeightGainSufficient ? theme.success : theme.danger,
                },
              ]}
            >
              {weightGain} g
            </Text>
            <Text
              style={[styles.recommendedGain, { color: theme.textSecondary }]}
            >
              Recommended: {recommendations.weightGainPerWeek}
            </Text>
          </View>
        </View>

        {/* Growth Trend Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="trending-up"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Growth Trend
            </Text>
          </View>

          <View style={styles.chartWrapper}>
            <LineChart
              data={getGrowthTrendData()}
              width={screenWidth - 64}
              height={220}
              yAxisSuffix=" kg"
              chartConfig={{
                backgroundGradientFrom: theme.cardBackground,
                backgroundGradientTo: theme.cardBackground,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: theme.cardBackground,
                },
              }}
              style={styles.chart}
              bezier
            />
          </View>

          <View
            style={[
              styles.trendInfoContainer,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <Text
              style={[styles.trendInfoText, { color: theme.textSecondary }]}
            >
              {weightGain > 0
                ? `Growing at ${weightGain} grams per week`
                : weightGain === 0
                ? "No weight change detected"
                : `Weight decreased by ${Math.abs(weightGain)} grams`}
            </Text>
          </View>
        </View>

        {/* Growth Measurements Input */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.inputTitle, { color: theme.text }]}>
            Record Growth Measurements
          </Text>
          <Text style={[styles.inputSubtitle, { color: theme.textSecondary }]}>
            Enter current and previous week's measurements
          </Text>

          {/* Weight Inputs */}
          <View
            style={[
              styles.measurementSection,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <View style={styles.measurementHeader}>
              <Ionicons
                name="fitness"
                size={20}
                color="#5A87FF"
                style={styles.measurementIcon}
              />
              <Text style={[styles.measurementTitle, { color: theme.text }]}>
                Weight
              </Text>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Previous Week
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={previousWeight}
                    onChangeText={(value) =>
                      handleWeightChange("previous", value)
                    }
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    kg
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Current Week
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={currentWeight}
                    onChangeText={(value) =>
                      handleWeightChange("current", value)
                    }
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    kg
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Height Inputs */}
          <View
            style={[
              styles.measurementSection,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <View style={styles.measurementHeader}>
              <Ionicons
                name="resize"
                size={20}
                color="#FF9500"
                style={styles.measurementIcon}
              />
              <Text style={[styles.measurementTitle, { color: theme.text }]}>
                Height
              </Text>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Previous Week
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={previousHeight}
                    onChangeText={(value) =>
                      handleMeasurementChange(
                        "previous",
                        value,
                        setPreviousHeight
                      )
                    }
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    cm
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Current Week
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={currentHeight}
                    onChangeText={(value) =>
                      handleMeasurementChange(
                        "current",
                        value,
                        setCurrentHeight
                      )
                    }
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    cm
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Head Circumference Inputs */}
          <View style={styles.measurementSection}>
            <View style={styles.measurementHeader}>
              <Ionicons
                name="ellipse-outline"
                size={20}
                color="#FF2D55"
                style={styles.measurementIcon}
              />
              <Text style={[styles.measurementTitle, { color: theme.text }]}>
                Head Circumference
              </Text>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Previous Week
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={previousHeadCirc}
                    onChangeText={(value) =>
                      handleMeasurementChange(
                        "previous",
                        value,
                        setPreviousHeadCirc
                      )
                    }
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    cm
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Current Week
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={currentHeadCirc}
                    onChangeText={(value) =>
                      handleMeasurementChange(
                        "current",
                        value,
                        setCurrentHeadCirc
                      )
                    }
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    cm
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={() =>
              console.log("Saved growth data:", {
                weight: {
                  previous: previousWeight,
                  current: currentWeight,
                  gain: weightGain,
                },
                height: {
                  previous: previousHeight,
                  current: currentHeight,
                  gain: heightGain,
                },
                headCirc: {
                  previous: previousHeadCirc,
                  current: currentHeadCirc,
                  gain: headCircGain,
                },
              })
            }
          >
            <Ionicons
              name="save"
              size={16}
              color="#FFFFFF"
              style={styles.saveButtonIcon}
            />
            <Text style={styles.saveButtonText}>Save Growth Data</Text>
          </TouchableOpacity>
        </View>

        {/* Growth Summary */}
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Growth Summary
          </Text>

          {/* Weight Gain Summary */}
          <View
            style={[
              styles.growthSummaryCard,
              {
                borderColor: isWeightGainSufficient
                  ? theme.success
                  : theme.danger,
              },
            ]}
          >
            <View style={styles.growthSummaryHeader}>
              <Ionicons
                name="fitness"
                size={20}
                color="#5A87FF"
                style={styles.growthSummaryIcon}
              />
              <Text style={[styles.growthSummaryTitle, { color: theme.text }]}>
                Weight Gain
              </Text>
              <Text
                style={[
                  styles.growthSummaryValue,
                  {
                    color: isWeightGainSufficient
                      ? theme.success
                      : theme.danger,
                  },
                ]}
              >
                {weightGain} g/week
              </Text>
            </View>

            <Text
              style={[
                styles.growthSummaryRecommended,
                { color: theme.textSecondary },
              ]}
            >
              Recommended: {recommendations.weightGainPerWeek}
            </Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text
                  style={[styles.progressLabel, { color: theme.textSecondary }]}
                >
                  Progress toward minimum goal:
                </Text>
                <Text
                  style={[
                    styles.progressPercentage,
                    {
                      color: isWeightGainSufficient
                        ? theme.success
                        : theme.danger,
                    },
                  ]}
                >
                  {weightGainPercentage}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: `${theme.danger}30` },
                ]}
              >
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${weightGainPercentage}%`,
                      backgroundColor: isWeightGainSufficient
                        ? theme.success
                        : theme.danger,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Difference from recommended */}
            <View style={styles.diffContainer}>
              <Text style={[styles.diffLabel, { color: theme.textSecondary }]}>
                Compared to minimum goal ({recommendations.minWeightGain} g):
              </Text>
              <Text
                style={[
                  styles.diffValue,
                  {
                    color:
                      weightDiffPercentage >= 0 ? theme.success : theme.danger,
                  },
                ]}
              >
                {formatPercentageText(weightDiffPercentage)}
              </Text>
            </View>
          </View>

          {/* Height Gain Summary */}
          <View
            style={[
              styles.growthSummaryCard,
              {
                borderColor: isHeightGainSufficient
                  ? theme.success
                  : theme.danger,
              },
            ]}
          >
            <View style={styles.growthSummaryHeader}>
              <Ionicons
                name="resize"
                size={20}
                color="#FF9500"
                style={styles.growthSummaryIcon}
              />
              <Text style={[styles.growthSummaryTitle, { color: theme.text }]}>
                Height Gain
              </Text>
              <Text
                style={[
                  styles.growthSummaryValue,
                  {
                    color: isHeightGainSufficient
                      ? theme.success
                      : theme.danger,
                  },
                ]}
              >
                {heightGain} mm/week
              </Text>
            </View>

            <Text
              style={[
                styles.growthSummaryRecommended,
                { color: theme.textSecondary },
              ]}
            >
              Recommended: {recommendations.minHeightGain}-
              {recommendations.maxHeightGain} mm/week
            </Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text
                  style={[styles.progressLabel, { color: theme.textSecondary }]}
                >
                  Progress toward minimum goal:
                </Text>
                <Text
                  style={[
                    styles.progressPercentage,
                    {
                      color: isHeightGainSufficient
                        ? theme.success
                        : theme.danger,
                    },
                  ]}
                >
                  {heightGainPercentage}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: `${theme.danger}30` },
                ]}
              >
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${heightGainPercentage}%`,
                      backgroundColor: isHeightGainSufficient
                        ? theme.success
                        : theme.danger,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Difference from recommended */}
            <View style={styles.diffContainer}>
              <Text style={[styles.diffLabel, { color: theme.textSecondary }]}>
                Compared to minimum goal ({recommendations.minHeightGain} mm):
              </Text>
              <Text
                style={[
                  styles.diffValue,
                  {
                    color:
                      heightDiffPercentage >= 0 ? theme.success : theme.danger,
                  },
                ]}
              >
                {formatPercentageText(heightDiffPercentage)}
              </Text>
            </View>
          </View>

          {/* Head Circumference Gain Summary */}
          <View
            style={[
              styles.growthSummaryCard,
              {
                borderColor: isHeadCircGainSufficient
                  ? theme.success
                  : theme.danger,
              },
            ]}
          >
            <View style={styles.growthSummaryHeader}>
              <Ionicons
                name="ellipse-outline"
                size={20}
                color="#FF2D55"
                style={styles.growthSummaryIcon}
              />
              <Text style={[styles.growthSummaryTitle, { color: theme.text }]}>
                Head Circumference Gain
              </Text>
              <Text
                style={[
                  styles.growthSummaryValue,
                  {
                    color: isHeadCircGainSufficient
                      ? theme.success
                      : theme.danger,
                  },
                ]}
              >
                {headCircGain} mm/week
              </Text>
            </View>

            <Text
              style={[
                styles.growthSummaryRecommended,
                { color: theme.textSecondary },
              ]}
            >
              Recommended: {recommendations.minHeadCircGain}-
              {recommendations.maxHeadCircGain} mm/week
            </Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text
                  style={[styles.progressLabel, { color: theme.textSecondary }]}
                >
                  Progress toward minimum goal:
                </Text>
                <Text
                  style={[
                    styles.progressPercentage,
                    {
                      color: isHeadCircGainSufficient
                        ? theme.success
                        : theme.danger,
                    },
                  ]}
                >
                  {headCircGainPercentage}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: `${theme.danger}30` },
                ]}
              >
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${headCircGainPercentage}%`,
                      backgroundColor: isHeadCircGainSufficient
                        ? theme.success
                        : theme.danger,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Difference from recommended */}
            <View style={styles.diffContainer}>
              <Text style={[styles.diffLabel, { color: theme.textSecondary }]}>
                Compared to minimum goal ({recommendations.minHeadCircGain} mm):
              </Text>
              <Text
                style={[
                  styles.diffValue,
                  {
                    color:
                      headCircDiffPercentage >= 0
                        ? theme.success
                        : theme.danger,
                  },
                ]}
              >
                {formatPercentageText(headCircDiffPercentage)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expected Measurements */}
        <View
          style={[
            styles.expectedContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Expected Measurements
          </Text>
          <Text
            style={[styles.expectedSubtitle, { color: theme.textSecondary }]}
          >
            Typical ranges for {recommendations.ageGroup}
          </Text>

          <View style={styles.expectedTable}>
            <View
              style={[
                styles.expectedTableHeader,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <Text
                style={[
                  styles.expectedTableHeaderCell,
                  { color: theme.textSecondary },
                ]}
              >
                Measurement
              </Text>
              <Text
                style={[
                  styles.expectedTableHeaderCell,
                  { color: theme.textSecondary },
                ]}
              >
                Expected Range
              </Text>
              <Text
                style={[
                  styles.expectedTableHeaderCell,
                  { color: theme.textSecondary },
                ]}
              >
                Current
              </Text>
            </View>

            <View
              style={[
                styles.expectedTableRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <Text style={[styles.expectedTableCell, { color: theme.text }]}>
                Weight
              </Text>
              <Text
                style={[
                  styles.expectedTableCell,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.expectedWeight.min}-
                {recommendations.expectedWeight.max} kg
              </Text>
              <Text
                style={[styles.expectedTableCell, { color: theme.primary }]}
              >
                {currentWeight || "0"} kg
              </Text>
            </View>

            <View
              style={[
                styles.expectedTableRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <Text style={[styles.expectedTableCell, { color: theme.text }]}>
                Height
              </Text>
              <Text
                style={[
                  styles.expectedTableCell,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.expectedHeight.min}-
                {recommendations.expectedHeight.max} cm
              </Text>
              <Text
                style={[styles.expectedTableCell, { color: theme.primary }]}
              >
                {currentHeight || "0"} cm
              </Text>
            </View>

            <View style={styles.expectedTableRow}>
              <Text style={[styles.expectedTableCell, { color: theme.text }]}>
                Head Circ.
              </Text>
              <Text
                style={[
                  styles.expectedTableCell,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.expectedHeadCirc.min}-
                {recommendations.expectedHeadCirc.max} cm
              </Text>
              <Text
                style={[styles.expectedTableCell, { color: theme.primary }]}
              >
                {currentHeadCirc || "0"} cm
              </Text>
            </View>
          </View>
        </View>

        {/* Growth Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Growth & Development Tips
          </Text>
          <View style={styles.tipsList}>
            {childAgeInMonths < 6 ? (
              // 0-6 months tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Ensure adequate feeding - breastfeed on demand or follow
                    formula feeding guidelines
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Position baby on their tummy during awake time to strengthen
                    neck and shoulder muscles
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Track wet diapers to ensure baby is getting enough milk (6+
                    per day)
                  </Text>
                </View>
              </>
            ) : childAgeInMonths >= 6 && childAgeInMonths < 12 ? (
              // 6-12 months tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Introduce iron-rich solid foods around 6 months to support
                    growth and brain development
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Encourage movement and crawling to develop gross motor
                    skills
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Continue breast milk or formula as the primary source of
                    nutrition
                  </Text>
                </View>
              </>
            ) : childAgeInMonths >= 12 && childAgeInMonths < 24 ? (
              // 12-24 months tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Offer a variety of nutrient-dense foods from all food groups
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Encourage walking, climbing, and other physical activities
                    to build strength
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Provide opportunities for fine motor skill development with
                    finger foods and simple toys
                  </Text>
                </View>
              </>
            ) : childAgeInMonths >= 24 && childAgeInMonths < 60 ? (
              // 2-5 years tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Establish regular meal and snack times with balanced
                    nutrition
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Ensure adequate sleep (10-13 hours) for optimal growth
                    hormone release
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Encourage daily physical activity (at least 3 hours) through
                    active play
                  </Text>
                </View>
              </>
            ) : (
              // 6+ years tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Provide a balanced diet with adequate protein, calcium, and
                    other nutrients for bone growth
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Encourage at least 60 minutes of moderate to vigorous
                    physical activity daily
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Limit screen time and ensure adequate sleep (9-12 hours) for
                    optimal growth
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
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
  ageGroupContainer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  ageGroupLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginRight: 8,
  },
  ageGroupInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ageGroupIcon: {
    marginRight: 6,
  },
  ageGroupText: {
    fontSize: 15,
    fontWeight: "600",
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  weightGainContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  weightGainLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  weightGainValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  recommendedGain: {
    fontSize: 14,
  },
  trendInfoContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  trendInfoText: {
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  measurementSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  measurementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  measurementIcon: {
    marginRight: 8,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    width: "48%",
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    textAlign: "right",
  },
  inputUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  growthSummaryCard: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  growthSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  growthSummaryIcon: {
    marginRight: 8,
  },
  growthSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  growthSummaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  growthSummaryRecommended: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  diffContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  diffLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  diffValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  expectedContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expectedSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  expectedTable: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    overflow: "hidden",
  },
  expectedTableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  expectedTableHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  expectedTableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  expectedTableCell: {
    flex: 1,
    fontSize: 14,
  },
  tipsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsList: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
