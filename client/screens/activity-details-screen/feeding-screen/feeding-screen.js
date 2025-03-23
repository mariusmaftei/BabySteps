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
import { LineChart, PieChart } from "react-native-chart-kit";
import CustomButton from "../../../components/Button/Button";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

const screenWidth = Dimensions.get("window").width;

export default function FeedingDetailsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("today");

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
      };
    }
  };

  const recommendations = getFeedingRecommendations(childAgeInMonths);

  // Prepare chart data
  const getChartData = () => {
    if (activeTab === "today") {
      // Pie chart data for today's feeding distribution
      const breastMinutes = dailyTotals.breastMinutes;
      const bottleMl = dailyTotals.bottleMl;
      const solidGrams = childAgeInMonths >= 6 ? dailyTotals.solidGrams : 0;

      const data = [
        {
          name: "Breast",
          value: breastMinutes,
          color: "#FF9500",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        },
      ];

      if (bottleMl > 0) {
        data.push({
          name: "Bottle",
          value: bottleMl,
          color: "#5A87FF",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        });
      }

      if (childAgeInMonths >= 6 && solidGrams > 0) {
        data.push({
          name: "Solid",
          value: solidGrams,
          color: "#4CD964",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        });
      }

      return data;
    } else {
      // Line chart data for weekly trends
      return {
        labels: weeklyData.breast.map((item) => item.day),
        datasets: [
          {
            data: weeklyData.breast.map((item) => item.count),
            color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
            strokeWidth: 2,
          },
          {
            data: weeklyData.bottle.map((item) => item.count),
            color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            strokeWidth: 2,
          },
          ...(childAgeInMonths >= 6
            ? [
                {
                  data: weeklyData.solid.map((item) => item.count),
                  color: (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
                  strokeWidth: 2,
                },
              ]
            : []),
        ],
        legend: [
          "Breast",
          "Bottle",
          ...(childAgeInMonths >= 6 ? ["Solid"] : []),
        ],
      };
    }
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
      title: `${currentChild?.name?.split(" ")[0] || "Baby"}'s Feeding`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Age-Appropriate Recommendations Banner */}
        <View
          style={[
            styles.recommendationBanner,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.ageGroupContainer}>
            <Text
              style={[styles.ageGroupLabel, { color: theme.textSecondary }]}
            >
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

          <View style={styles.recommendationContent}>
            <Text
              style={[styles.recommendationTitle, { color: theme.primary }]}
            >
              {recommendations.feedingType}
            </Text>

            <View style={styles.recommendationItem}>
              <Ionicons name="water-outline" size={16} color={theme.primary} />
              <Text style={[styles.recommendationText, { color: theme.text }]}>
                <Text style={{ fontWeight: "600" }}>Milk: </Text>
                {recommendations.milkAmount}
              </Text>
            </View>

            <View style={styles.recommendationItem}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.recommendationText, { color: theme.text }]}>
                <Text style={{ fontWeight: "600" }}>Frequency: </Text>
                {recommendations.feedingFrequency}
              </Text>
            </View>

            {recommendations.feedingDuration && (
              <View style={styles.recommendationItem}>
                <Ionicons
                  name="hourglass-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text
                  style={[styles.recommendationText, { color: theme.text }]}
                >
                  <Text style={{ fontWeight: "600" }}>Duration: </Text>
                  {recommendations.feedingDuration}
                </Text>
              </View>
            )}

            {childAgeInMonths >= 6 && (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.borderLight },
                  ]}
                />

                <View style={styles.recommendationItem}>
                  <Ionicons
                    name="restaurant-outline"
                    size={16}
                    color={theme.primary}
                  />
                  <Text
                    style={[styles.recommendationText, { color: theme.text }]}
                  >
                    <Text style={{ fontWeight: "600" }}>Solid Foods: </Text>
                    {recommendations.solidFoods}
                  </Text>
                </View>

                {recommendations.solidAmount && (
                  <View style={styles.recommendationItem}>
                    <Ionicons
                      name="resize-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[styles.recommendationText, { color: theme.text }]}
                    >
                      <Text style={{ fontWeight: "600" }}>Amount: </Text>
                      {recommendations.solidAmount}
                    </Text>
                  </View>
                )}

                {recommendations.solidFrequency && (
                  <View style={styles.recommendationItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[styles.recommendationText, { color: theme.text }]}
                    >
                      <Text style={{ fontWeight: "600" }}>Meals: </Text>
                      {recommendations.solidFrequency}
                    </Text>
                  </View>
                )}
              </>
            )}

            {childAgeInMonths < 6 && (
              <View
                style={[
                  styles.warningContainer,
                  { backgroundColor: `${theme.warning}20` },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={theme.warning}
                />
                <Text style={[styles.warningText, { color: theme.text }]}>
                  Solid foods are not recommended before 6 months
                </Text>
              </View>
            )}
          </View>
        </View>

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
              <Ionicons name="woman-outline" size={24} color="#FF9500" />
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
              <Ionicons name="flask-outline" size={24} color="#5A87FF" />
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
                <Ionicons name="restaurant-outline" size={24} color="#4CD964" />
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

        {/* Feeding Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Feeding Trends
            </Text>

            <View
              style={[
                styles.tabContainer,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "today" && { backgroundColor: theme.primary },
                ]}
                onPress={() => setActiveTab("today")}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "today" ? "#fff" : theme.textSecondary,
                    },
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "week" && { backgroundColor: theme.primary },
                ]}
                onPress={() => setActiveTab("week")}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "week" ? "#fff" : theme.textSecondary,
                    },
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartWrapper}>
            {activeTab === "today" ? (
              dailyTotals.breastCount === 0 &&
              dailyTotals.bottleCount === 0 &&
              dailyTotals.solidCount === 0 ? (
                <View style={styles.emptyChartContainer}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={48}
                    color={theme.textTertiary}
                  />
                  <Text
                    style={[
                      styles.emptyChartText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    No feedings recorded today
                  </Text>
                </View>
              ) : (
                <PieChart
                  data={getChartData()}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={{
                    backgroundGradientFrom: theme.cardBackground,
                    backgroundGradientTo: theme.cardBackground,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="value"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute={false}
                />
              )
            ) : (
              <LineChart
                data={getChartData()}
                width={screenWidth - 64}
                height={200}
                chartConfig={{
                  backgroundColor: theme.cardBackground,
                  backgroundGradientFrom: theme.cardBackground,
                  backgroundGradientTo: theme.cardBackground,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => theme.textSecondary,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                legend={getChartData().legend}
              />
            )}
          </View>
        </View>

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
            <Text style={[styles.timerTitle, { color: theme.text }]}>
              Breastfeeding Timer
            </Text>

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
            <Text style={[styles.inputTitle, { color: theme.text }]}>
              Bottle Feeding
            </Text>

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
              <Text style={[styles.inputTitle, { color: theme.text }]}>
                Solid Food
              </Text>

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

        {/* Feeding Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Feeding Tips
          </Text>

          <View style={styles.tipsList}>
            {recommendations.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.success}
                  style={styles.tipIcon}
                />
                <Text style={[styles.tipText, { color: theme.text }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Feedings */}
        <View
          style={[
            styles.recentFeedingsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Feedings
          </Text>

          {breastFeedings.length === 0 &&
          bottleFeedings.length === 0 &&
          solidFoodFeedings.length === 0 ? (
            <View style={styles.emptyFeedingsContainer}>
              <Ionicons
                name="list-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text
                style={[
                  styles.emptyFeedingsText,
                  { color: theme.textSecondary },
                ]}
              >
                No feedings recorded today
              </Text>
            </View>
          ) : (
            <View style={styles.feedingsList}>
              {/* Combine and sort all feedings by timestamp */}
              {[...breastFeedings, ...bottleFeedings, ...solidFoodFeedings]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5) // Show only the 5 most recent
                .map((feeding, index) => (
                  <View
                    key={index}
                    style={[
                      styles.feedingItem,
                      index < 4 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderLight,
                      },
                    ]}
                  >
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
                              : "restaurant-outline"
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
                        <Text
                          style={[styles.feedingTitle, { color: theme.text }]}
                        >
                          {feeding.type === "breast"
                            ? `Breastfeeding (${feeding.side})`
                            : feeding.type === "bottle"
                            ? "Bottle Feeding"
                            : "Solid Food"}
                        </Text>

                        <Text
                          style={[
                            styles.feedingTime,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {new Date(feeding.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[styles.feedingAmount, { color: theme.primary }]}
                    >
                      {feeding.type === "breast"
                        ? `${feeding.duration} min`
                        : feeding.type === "bottle"
                        ? `${feeding.amount} ml`
                        : `${feeding.amount} g`}
                    </Text>
                  </View>
                ))}
            </View>
          )}

          {(breastFeedings.length > 0 ||
            bottleFeedings.length > 0 ||
            solidFoodFeedings.length > 0) && (
            <TouchableOpacity
              style={[
                styles.viewAllButton,
                { borderTopColor: theme.borderLight },
              ]}
              onPress={() => console.log("View all feedings")}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                View All Feedings
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.primary}
              />
            </TouchableOpacity>
          )}
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
  recommendationBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ageGroupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  recommendationContent: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 12,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  recordContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
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
  inputTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
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
  recentFeedingsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyFeedingsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyFeedingsText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  feedingsList: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
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
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
});
