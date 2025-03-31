import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../../../components/UI/Button/Button";
import ChildRecommendationCard from "../../../components/UI/Cards/ChildRecommendationCard";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

import ChildInfoCard from "../../../components/UI/Cards/ChildInfoCard";
import ColumnChart from "../../../components/UI/Charts/ColumnChart";
import RecentActivityCard from "../../../components/UI/Cards/RecentActivityCard";

const screenWidth = Dimensions.get("window").width;

export default function FeedingScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("today");
  const [activeInfoTab, setActiveInfoTab] = useState("recommended");

  // Get child's age as a number for recommendations
  const childAgeText = currentChild?.age || "0 months";
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;

  // State for feeding inputs
  const [breastFeedings, setBreastFeedings] = useState([]);
  const [bottleFeedings, setBottleFeedings] = useState([]);
  const [solidFoodFeedings, setSolidFoodFeedings] = useState([]);

  // Current feeding input state
  const [currentFeeding, setCurrentFeeding] = useState({
    type: "breast", // 'breast', 'bottle', 'solid'
    startTime: null,
    endTime: null,
    duration: 0, // in minutes for breast feeding
    amount: "", // in ml for bottle, grams for solid
    note: "",
  });

  // Mock data for the past week (in a real app, this would come from an API)
  const [weeklyData, setWeeklyData] = useState({
    breast: [
      { day: "Mon", count: 8, totalMinutes: 120 },
      { day: "Tue", count: 7, totalMinutes: 105 },
      { day: "Wed", count: 9, totalMinutes: 135 },
      { day: "Thu", count: 8, totalMinutes: 120 },
      { day: "Fri", count: 7, totalMinutes: 105 },
      { day: "Sat", count: 8, totalMinutes: 120 },
      { day: "Sun", count: 6, totalMinutes: 90 },
    ],
    bottle: [
      { day: "Mon", count: 2, totalMl: 180 },
      { day: "Tue", count: 3, totalMl: 270 },
      { day: "Wed", count: 2, totalMl: 180 },
      { day: "Thu", count: 3, totalMl: 270 },
      { day: "Fri", count: 2, totalMl: 180 },
      { day: "Sat", count: 3, totalMl: 270 },
      { day: "Sun", count: 2, totalMl: 180 },
    ],
    solid:
      childAgeInMonths >= 6
        ? [
            { day: "Mon", count: 1, totalGrams: 30 },
            { day: "Tue", count: 1, totalGrams: 35 },
            { day: "Wed", count: 2, totalGrams: 45 },
            { day: "Thu", count: 2, totalGrams: 50 },
            { day: "Fri", count: 2, totalGrams: 55 },
            { day: "Sat", count: 3, totalGrams: 60 },
            { day: "Sun", count: 3, totalGrams: 65 },
          ]
        : [],
  });

  // Timer for breastfeeding
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeBreast, setActiveBreast] = useState(null); // 'left', 'right', or null

  // Start/stop timer for breastfeeding
  const toggleTimer = (breast) => {
    if (!isTimerRunning) {
      // Start timer
      setIsTimerRunning(true);
      setActiveBreast(breast);
      setCurrentFeeding({
        ...currentFeeding,
        type: "breast",
        startTime: new Date(),
        side: breast,
      });
    } else {
      // Stop timer
      setIsTimerRunning(false);
      const endTime = new Date();
      const durationInMinutes = Math.round(timerSeconds / 60);

      // Add to breastFeedings array
      const newFeeding = {
        ...currentFeeding,
        endTime,
        duration: durationInMinutes,
        side: activeBreast,
        timestamp: endTime.toISOString(),
      };

      setBreastFeedings([...breastFeedings, newFeeding]);

      // Reset timer and active breast
      setTimerSeconds(0);
      setActiveBreast(null);

      // Show confirmation
      Alert.alert(
        "Feeding Recorded",
        `${
          activeBreast.charAt(0).toUpperCase() + activeBreast.slice(1)
        } breast feeding recorded for ${durationInMinutes} minutes.`,
        [{ text: "OK" }]
      );
    }
  };

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((seconds) => seconds + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format timer display
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Add bottle feeding
  const addBottleFeeding = () => {
    if (
      !currentFeeding.amount ||
      isNaN(Number.parseInt(currentFeeding.amount)) ||
      Number.parseInt(currentFeeding.amount) <= 0
    ) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount in milliliters."
      );
      return;
    }

    const newFeeding = {
      ...currentFeeding,
      type: "bottle",
      amount: Number.parseInt(currentFeeding.amount),
      timestamp: new Date().toISOString(),
    };

    setBottleFeedings([...bottleFeedings, newFeeding]);

    // Reset input
    setCurrentFeeding({
      ...currentFeeding,
      amount: "",
      note: "",
    });

    // Show confirmation
    Alert.alert(
      "Feeding Recorded",
      `Bottle feeding recorded: ${newFeeding.amount} ml.`,
      [{ text: "OK" }]
    );
  };

  // Add solid food feeding
  const addSolidFeeding = () => {
    if (
      !currentFeeding.amount ||
      isNaN(Number.parseInt(currentFeeding.amount)) ||
      Number.parseInt(currentFeeding.amount) <= 0
    ) {
      Alert.alert("Invalid Amount", "Please enter a valid amount in grams.");
      return;
    }

    const newFeeding = {
      ...currentFeeding,
      type: "solid",
      amount: Number.parseInt(currentFeeding.amount),
      timestamp: new Date().toISOString(),
    };

    setSolidFoodFeedings([...solidFoodFeedings, newFeeding]);

    // Reset input
    setCurrentFeeding({
      ...currentFeeding,
      amount: "",
      note: "",
    });

    // Show confirmation
    Alert.alert(
      "Feeding Recorded",
      `Solid food feeding recorded: ${newFeeding.amount} grams.`,
      [{ text: "OK" }]
    );
  };

  // Calculate daily totals
  const dailyTotals = {
    breastCount: breastFeedings.length,
    breastMinutes: breastFeedings.reduce(
      (total, feeding) => total + (feeding.duration || 0),
      0
    ),
    bottleCount: bottleFeedings.length,
    bottleMl: bottleFeedings.reduce(
      (total, feeding) => total + (feeding.amount || 0),
      0
    ),
    solidCount: solidFoodFeedings.length,
    solidGrams: solidFoodFeedings.reduce(
      (total, feeding) => total + (feeding.amount || 0),
      0
    ),
  };

  // Get feeding recommendations based on age
  const getFeedingRecommendations = (ageInMonths) => {
    if (ageInMonths < 6) {
      // 0-6 months
      return {
        ageGroup: "Infant (0-6 months)",
        feedingType: "Breast milk or formula only",
        milkAmount: "550-900 ml/day",
        feedingFrequency: "8-12 feedings/day",
        feedingDuration: "15-20 minutes per breast",
        feedingInterval: "Every 2-3 hours",
        solidFoods: "Not recommended before 6 months",
        tips: [
          "Feed on demand, watching for hunger cues",
          "Exclusively breastfeed or formula feed",
          "Burp baby during and after feedings",
        ],
        recommendedBreastMinutes: 240, // 4 hours total (both breasts)
        recommendedBottleMl: 750, // ml per day
        recommendedSolidGrams: 0, // not recommended
      };
    } else if (ageInMonths >= 6 && ageInMonths < 12) {
      // 6-12 months
      return {
        ageGroup: "Infant (6-12 months)",
        feedingType: "Breast milk/formula + complementary foods",
        milkAmount: "750-900 ml/day",
        feedingFrequency: "4-6 milk feedings/day",
        feedingDuration: "10-15 minutes per breast",
        feedingInterval: "Every 3-4 hours",
        solidFoods:
          "Start with single-ingredient purees, gradually increase variety and texture",
        solidAmount:
          "2-3 tablespoons per meal, gradually increasing to 4-6 tablespoons",
        solidFrequency:
          "1-2 meals/day at 6 months, increasing to 3 meals/day by 9 months",
        tips: [
          "Introduce one new food at a time, waiting 3-5 days between new foods",
          "Continue breast milk or formula as the primary nutrition source",
          "Progress from purees to mashed and soft finger foods",
        ],
        recommendedBreastMinutes: 180, // 3 hours total (both breasts)
        recommendedBottleMl: 800, // ml per day
        recommendedSolidGrams: 150, // grams per day (increasing with age)
      };
    } else {
      // 12+ months
      return {
        ageGroup: "Toddler (12+ months)",
        feedingType: "Family foods + milk",
        milkAmount: "350-500 ml/day",
        feedingFrequency: "3-4 milk feedings/day",
        solidFoods: "Chopped table foods with varied textures",
        solidAmount: "¼ to ½ cup (60-120g) per meal",
        solidFrequency: "3 meals + 2 snacks/day",
        tips: [
          "Transition to whole milk (if appropriate)",
          "Offer a variety of foods from all food groups",
          "Expect food jags and pickiness; continue to offer rejected foods",
        ],
        recommendedBreastMinutes: 120, // 2 hours total (both breasts)
        recommendedBottleMl: 450, // ml per day
        recommendedSolidGrams: 300, // grams per day
      };
    }
  };

  // Get unrecommended foods based on age
  const getUnrecommendedFoods = (ageInMonths) => {
    const commonUnrecommendedFoods = [
      {
        name: "Honey",
        reason: "Risk of infant botulism",
        alternative: "Mashed banana or applesauce for sweetness",
        safeAge: 12,
      },
      {
        name: "Cow's milk (as main drink)",
        reason: "Hard to digest and lacks proper nutrients for infants",
        alternative: "Breast milk or formula",
        safeAge: 12,
      },
      {
        name: "Added salt or sugar",
        reason:
          "Harmful for developing kidneys and promotes poor eating habits",
        alternative: "Natural flavors from fruits and vegetables",
        safeAge: 24,
      },
      {
        name: "Fruit juice",
        reason: "High in sugar and low in fiber",
        alternative: "Water and whole fruits (pureed if needed)",
        safeAge: 12,
      },
      {
        name: "Choking hazards (nuts, grapes, popcorn, etc.)",
        reason: "Risk of choking",
        alternative: "Finely ground nuts, quartered grapes (for 12+ months)",
        safeAge: 48,
      },
      {
        name: "Unpasteurized foods",
        reason: "Risk of harmful bacteria",
        alternative: "Pasteurized versions",
        safeAge: 60,
      },
      {
        name: "Highly allergenic foods without medical guidance",
        reason: "Risk of severe allergic reactions",
        alternative: "Introduce one at a time with pediatrician guidance",
        safeAge: "Varies",
      },
      {
        name: "Processed foods with additives",
        reason: "Contain unhealthy levels of salt, sugar, and preservatives",
        alternative: "Homemade foods with simple ingredients",
        safeAge: "Limit at all ages",
      },
    ];

    // Filter based on age
    return commonUnrecommendedFoods.filter(
      (food) => typeof food.safeAge === "number" && food.safeAge > ageInMonths
    );
  };

  const recommendations = getFeedingRecommendations(childAgeInMonths);
  const unrecommendedFoods = getUnrecommendedFoods(childAgeInMonths);

  // Define colors for different feeding types
  const breastColor = "#FF9500"; // Orange/yellow color
  const bottleColor = "#5A87FF"; // Blue color
  const solidColor = "#4CD964"; // Green color

  // Get the maximum value for scaling the chart
  const getMaxChartValue = () => {
    const breastValue = dailyTotals.breastMinutes;
    const bottleValue = dailyTotals.bottleMl / 10; // Scale down ml for better visualization
    const solidValue = childAgeInMonths >= 6 ? dailyTotals.solidGrams / 5 : 0; // Scale down grams for better visualization

    // Get recommended values (scaled the same way)
    const recBreastValue = recommendations.recommendedBreastMinutes;
    const recBottleValue = recommendations.recommendedBottleMl / 10;
    const recSolidValue =
      childAgeInMonths >= 6 ? recommendations.recommendedSolidGrams / 5 : 0;

    // Find the maximum value among actual and recommended values
    return Math.max(
      breastValue,
      bottleValue,
      solidValue,
      recBreastValue,
      recBottleValue,
      recSolidValue,
      10 // Minimum value to avoid division by zero
    );
  };

  // Calculate bar height with proper scaling
  const calculateBarHeight = (value, maxValue) => {
    const maxDisplayHeight = 150; // Maximum height in pixels
    const scaleFactor = maxDisplayHeight / maxValue;

    // Scale the value based on the maximum
    return value * scaleFactor;
  };

  // Prepare chart data for the ColumnChart component
  const chartData = [
    {
      value: dailyTotals.breastMinutes,
      label: "Breastfeeding",
      color: breastColor,
      unit: "min",
      icon: <Ionicons name="woman-outline" size={16} color={breastColor} />,
    },
    {
      value: dailyTotals.bottleMl,
      label: "Bottle Feeding",
      color: bottleColor,
      unit: "ml",
      icon: <Ionicons name="flask-outline" size={16} color={bottleColor} />,
    },
  ];

  // Add solid food data if age appropriate
  if (childAgeInMonths >= 6) {
    chartData.push({
      value: dailyTotals.solidGrams,
      label: "Solid Food",
      color: solidColor,
      unit: "g",
      icon: <Ionicons name="nutrition-outline" size={16} color={solidColor} />,
    });
  }

  // Prepare target values for the chart
  const targetValues = [
    recommendations.recommendedBreastMinutes,
    recommendations.recommendedBottleMl,
    childAgeInMonths >= 6 ? recommendations.recommendedSolidGrams : 0,
  ];

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
      title: `${currentChild?.name?.split(" ")[0] || "Baby"}'s Feeding`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

  // Render feeding item for the RecentActivityCard
  const renderFeedingItem = (feeding, index) => {
    return (
      <View style={styles.feedingItem}>
        <View style={styles.feedingItemLeft}>
          <View
            style={[
              styles.feedingTypeIcon,
              {
                backgroundColor:
                  feeding.type === "breast"
                    ? "#FF950020"
                    : feeding.type === "bottle"
                    ? "#5A87FF20"
                    : "#4CD96420",
              },
            ]}
          >
            <Ionicons
              name={
                feeding.type === "breast"
                  ? "woman-outline"
                  : feeding.type === "bottle"
                  ? "flask-outline"
                  : "nutrition-outline"
              }
              size={16}
              color={
                feeding.type === "breast"
                  ? "#FF9500"
                  : feeding.type === "bottle"
                  ? "#5A87FF"
                  : "#4CD964"
              }
            />
          </View>

          <View style={styles.feedingDetails}>
            <Text style={[styles.feedingTitle, { color: theme.text }]}>
              {feeding.type === "breast"
                ? `Breastfeeding (${feeding.side})`
                : feeding.type === "bottle"
                ? "Bottle Feeding"
                : "Solid Food"}
            </Text>

            <Text style={[styles.feedingTime, { color: theme.textSecondary }]}>
              {new Date(feeding.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        <Text style={[styles.feedingAmount, { color: theme.primary }]}>
          {feeding.type === "breast"
            ? `${feeding.duration} min`
            : feeding.type === "bottle"
            ? `${feeding.amount} ml`
            : `${feeding.amount} g`}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Child Info Card */}
        <ChildInfoCard
          childData={currentChild}
          customTitle="Child Information"
          customIcon={
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={theme.primary}
            />
          }
        />

        {/* Child Recommendation Card */}
        <ChildRecommendationCard
          childData={currentChild}
          screenType="feeding"
          customIcon={
            <Ionicons
              name="nutrition-outline"
              size={24}
              color={theme.primary}
            />
          }
        />

        {/* Feeding Chart using the new ColumnChart component */}
        <ColumnChart
          title="Daily Feeding Chart"
          data={chartData}
          targetValues={targetValues}
          calculateBarHeight={calculateBarHeight}
          getMaxValue={getMaxChartValue}
          targetLegendText="Recommended Daily Target"
        />

        {/* Record Feeding Section */}
        <View
          style={[
            styles.recordContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Record Feeding
          </Text>

          {/* Breastfeeding Timer */}
          <View
            style={[
              styles.timerContainer,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View style={styles.timerHeader}>
              <View
                style={[
                  styles.timerIconContainer,
                  { backgroundColor: "#FF950020" },
                ]}
              >
                <Ionicons name="time" size={24} color="#FF9500" />
              </View>
              <Text style={[styles.timerTitle, { color: theme.text }]}>
                Breastfeeding Timer
              </Text>
            </View>

            <View style={styles.timerDisplay}>
              <Text style={[styles.timerText, { color: theme.primary }]}>
                {formatTime(timerSeconds)}
              </Text>
              {activeBreast && (
                <Text
                  style={[
                    styles.activeBreastText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {activeBreast.charAt(0).toUpperCase() + activeBreast.slice(1)}{" "}
                  breast
                </Text>
              )}
            </View>

            <View style={styles.breastButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.breastButton,
                  {
                    backgroundColor:
                      activeBreast === "left"
                        ? theme.primary
                        : `${theme.primary}30`,
                  },
                  {
                    opacity:
                      isTimerRunning && activeBreast !== "left" ? 0.5 : 1,
                  },
                ]}
                onPress={() => toggleTimer("left")}
                disabled={isTimerRunning && activeBreast !== "left"}
              >
                <Ionicons
                  name={
                    isTimerRunning && activeBreast === "left" ? "pause" : "play"
                  }
                  size={20}
                  color={activeBreast === "left" ? "#fff" : theme.primary}
                />
                <Text
                  style={[
                    styles.breastButtonText,
                    { color: activeBreast === "left" ? "#fff" : theme.primary },
                  ]}
                >
                  {isTimerRunning && activeBreast === "left"
                    ? "Pause Left"
                    : "Left Breast"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.breastButton,
                  {
                    backgroundColor:
                      activeBreast === "right"
                        ? theme.primary
                        : `${theme.primary}30`,
                  },
                  {
                    opacity:
                      isTimerRunning && activeBreast !== "right" ? 0.5 : 1,
                  },
                ]}
                onPress={() => toggleTimer("right")}
                disabled={isTimerRunning && activeBreast !== "right"}
              >
                <Ionicons
                  name={
                    isTimerRunning && activeBreast === "right"
                      ? "pause"
                      : "play"
                  }
                  size={20}
                  color={activeBreast === "right" ? "#fff" : theme.primary}
                />
                <Text
                  style={[
                    styles.breastButtonText,
                    {
                      color: activeBreast === "right" ? "#fff" : theme.primary,
                    },
                  ]}
                >
                  {isTimerRunning && activeBreast === "right"
                    ? "Pause Right"
                    : "Right Breast"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottle Feeding Input */}
          <View
            style={[
              styles.inputSection,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View style={styles.inputHeader}>
              <View
                style={[
                  styles.inputIconContainer,
                  { backgroundColor: "#5A87FF20" },
                ]}
              >
                <Ionicons name="flask-outline" size={24} color="#5A87FF" />
              </View>
              <Text style={[styles.inputTitle, { color: theme.text }]}>
                Bottle Feeding
              </Text>
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Amount (ml):
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: theme.borderLight,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={
                    currentFeeding.type === "bottle"
                      ? currentFeeding.amount
                      : ""
                  }
                  onChangeText={(value) =>
                    setCurrentFeeding({
                      ...currentFeeding,
                      type: "bottle",
                      amount: value.replace(/[^0-9]/g, ""),
                    })
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  ml
                </Text>
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Note:
              </Text>
              <View
                style={[
                  styles.noteInputWrapper,
                  {
                    borderColor: theme.borderLight,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={
                    currentFeeding.type === "bottle" ? currentFeeding.note : ""
                  }
                  onChangeText={(value) =>
                    setCurrentFeeding({
                      ...currentFeeding,
                      type: "bottle",
                      note: value,
                    })
                  }
                  placeholder="Formula, pumped milk, etc."
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            <CustomButton
              title="Record Bottle Feeding"
              onPress={addBottleFeeding}
              icon="flask-outline"
              style={{ marginTop: 12 }}
            />
          </View>

          {/* Solid Food Input (only for 6+ months) */}
          {childAgeInMonths >= 6 && (
            <View
              style={[
                styles.inputSection,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View style={styles.inputHeader}>
                <View
                  style={[
                    styles.inputIconContainer,
                    { backgroundColor: "#4CD96420" },
                  ]}
                >
                  <Ionicons
                    name="nutrition-outline"
                    size={24}
                    color="#4CD964"
                  />
                </View>
                <Text style={[styles.inputTitle, { color: theme.text }]}>
                  Solid Food
                </Text>
              </View>

              <View style={styles.inputRow}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Amount (g):
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.background,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={
                      currentFeeding.type === "solid"
                        ? currentFeeding.amount
                        : ""
                    }
                    onChangeText={(value) =>
                      setCurrentFeeding({
                        ...currentFeeding,
                        type: "solid",
                        amount: value.replace(/[^0-9]/g, ""),
                      })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    g
                  </Text>
                </View>
              </View>

              <View style={styles.inputRow}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Note:
                </Text>
                <View
                  style={[
                    styles.noteInputWrapper,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.background,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={
                      currentFeeding.type === "solid" ? currentFeeding.note : ""
                    }
                    onChangeText={(value) =>
                      setCurrentFeeding({
                        ...currentFeeding,
                        type: "solid",
                        note: value,
                      })
                    }
                    placeholder="Puree, cereal, fruit, etc."
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
              </View>

              <CustomButton
                title="Record Solid Feeding"
                onPress={addSolidFeeding}
                icon="restaurant-outline"
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </View>

        {/* Recent Feedings */}
        <RecentActivityCard
          title="Recent Feedings"
          activities={[
            ...breastFeedings,
            ...bottleFeedings,
            ...solidFoodFeedings,
          ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))}
          emptyStateMessage="No feedings recorded today"
          emptyStateIcon={
            <Ionicons
              name="nutrition-outline"
              size={24}
              color={theme.textSecondary}
            />
          }
          onViewAll={() => console.log("View all feedings")}
          renderActivityItem={renderFeedingItem}
        />

        {/* Daily Summary */}
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Today's Feeding Summary
          </Text>

          <View style={styles.summaryGrid}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: `${theme.backgroundSecondary}` },
              ]}
            >
              <View
                style={[styles.iconCircle, { backgroundColor: "#FF950020" }]}
              >
                <Ionicons name="woman-outline" size={24} color="#FF9500" />
              </View>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {dailyTotals.breastCount}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Breastfeedings
              </Text>
              <Text style={[styles.summarySubvalue, { color: theme.primary }]}>
                {dailyTotals.breastMinutes} min
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: `${theme.backgroundSecondary}` },
              ]}
            >
              <View
                style={[styles.iconCircle, { backgroundColor: "#5A87FF20" }]}
              >
                <Ionicons name="body-outline" size={24} color="#5A87FF" />
              </View>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {dailyTotals.bottleCount}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Bottle Feeds
              </Text>
              <Text style={[styles.summarySubvalue, { color: theme.primary }]}>
                {dailyTotals.bottleMl} ml
              </Text>
            </View>

            {childAgeInMonths >= 6 && (
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: `${theme.backgroundSecondary}` },
                ]}
              >
                <View
                  style={[styles.iconCircle, { backgroundColor: "#4CD96420" }]}
                >
                  <Ionicons name="nutrition" size={24} color="#4CD964" />
                </View>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {dailyTotals.solidCount}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: theme.textSecondary }]}
                >
                  Solid Feeds
                </Text>
                <Text
                  style={[styles.summarySubvalue, { color: theme.primary }]}
                >
                  {dailyTotals.solidGrams} g
                </Text>
              </View>
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
  avoidFoodsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avoidFoodsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avoidFoodsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avoidFoodsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  avoidFoodsList: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
  },
  avoidFoodItem: {
    marginBottom: 4,
  },
  avoidFoodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  avoidFoodIcon: {
    marginRight: 6,
  },
  avoidFoodName: {
    fontSize: 14,
    fontWeight: "600",
  },
  avoidFoodReason: {
    fontSize: 13,
    marginLeft: 22,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summarySubvalue: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  recordContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  timerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  timerDisplay: {
    alignItems: "center",
    marginBottom: 16,
  },
  timerText: {
    fontSize: 36,
    fontWeight: "700",
  },
  activeBreastText: {
    fontSize: 14,
    marginTop: 4,
  },
  breastButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breastButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "48%",
  },
  breastButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  inputSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    width: "30%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    width: "65%",
  },
  noteInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    width: "65%",
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  inputUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  feedingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  feedingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  feedingTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  feedingDetails: {
    flex: 1,
  },
  feedingTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  feedingTime: {
    fontSize: 12,
    marginTop: 2,
  },
  feedingAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
});
