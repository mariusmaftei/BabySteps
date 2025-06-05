"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import CustomButton from "../../../components/UI/Button/Button";
import ChildRecommendationCard from "../../../components/UI/Cards/ChildRecommendationCard";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

import ChildInfoCard from "../../../components/UI/Cards/ChildInfoCard";
import ColumnChart from "../../../components/UI/Charts/ColumnChart";
import RecentActivityCard from "../../../components/UI/Cards/RecentActivityCard";
import * as feedingService from "../../../services/feeding-service";
import SummaryCards from "../../../components/UI/Cards/SummaryCards";
import { getCurrentDateTimeString } from "../../../services/feeding-service";

export default function FeedingScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const childAgeText = currentChild?.age || "0 months";
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;

  const [breastFeedings, setBreastFeedings] = useState([]);
  const [bottleFeedings, setBottleFeedings] = useState([]);
  const [solidFoodFeedings, setSolidFoodFeedings] = useState([]);

  const [currentFeeding, setCurrentFeeding] = useState({
    type: "breast",
    startTime: null,
    endTime: null,
    duration: 0,
    amount: "",
    note: "",
  });

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeBreast, setActiveBreast] = useState(null);

  useEffect(() => {
    if (currentChild?.id) {
      loadFeedingData();
    }
  }, [currentChild]);

  const loadFeedingData = async () => {
    if (!currentChild?.id) return;

    setIsLoading(true);

    try {
      const todayData = await feedingService.getTodayFeedingData(
        currentChild.id
      );

      const breastData = todayData.filter((item) => item.type === "breast");
      const bottleData = todayData.filter((item) => item.type === "bottle");
      const solidData = todayData.filter((item) => item.type === "solid");

      const formattedBreastData = breastData.map((item) => ({
        id: item.id,
        type: "breast",
        startTime: item.startTime,
        endTime: item.endTime,
        duration: item.duration || 0,
        side: item.side || "left",
        note: item.notes || item.note || "",
        timestamp: item.timestamp,
      }));

      const formattedBottleData = bottleData.map((item) => ({
        id: item.id,
        type: "bottle",
        amount: item.amount || 0,
        note: item.notes || item.note || "",
        timestamp: item.timestamp,
      }));

      const formattedSolidData = solidData.map((item) => ({
        id: item.id,
        type: "solid",
        amount: item.amount || 0,
        note: item.notes || item.note || "",
        timestamp: item.timestamp,
      }));

      setBreastFeedings(formattedBreastData);
      setBottleFeedings(formattedBottleData);
      setSolidFoodFeedings(formattedSolidData);

      await feedingService.getWeeklyFeedingData(currentChild.id);
    } catch (err) {
      console.error("Error loading feeding data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTimer = async (breast) => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      setActiveBreast(breast);
      setCurrentFeeding({
        ...currentFeeding,
        type: "breast",
        startTime: new Date(),
        side: breast,
      });
    } else {
      setIsTimerRunning(false);
      const endTime = new Date();
      const durationInMinutes = Math.round(timerSeconds / 60);

      if (durationInMinutes <= 0) {
        Alert.alert(
          "Invalid Duration",
          "Breastfeeding duration must be greater than 0 minutes."
        );
        setTimerSeconds(0);
        setActiveBreast(null);
        return;
      }

      const newFeeding = {
        ...currentFeeding,
        endTime,
        duration: durationInMinutes,
        side: activeBreast,
        timestamp: endTime.toISOString(),
      };

      setBreastFeedings([...breastFeedings, newFeeding]);
      setTimerSeconds(0);
      setActiveBreast(null);

      try {
        const feedingData = {
          childId: currentChild.id,
          startTime: currentFeeding.startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: durationInMinutes,
          side: activeBreast,
          notes: currentFeeding.note || "",
          // Use full datetime format
          timestamp: getCurrentDateTimeString(),
        };

        await feedingService.saveBreastfeedingData(feedingData);
        await loadFeedingData();
      } catch (err) {
        console.error("Error saving breastfeeding data:", err);
      }

      Alert.alert(
        "Feeding Recorded",
        `${
          activeBreast.charAt(0).toUpperCase() + activeBreast.slice(1)
        } breast feeding recorded for ${durationInMinutes} minutes.`,
        [{ text: "OK" }]
      );
    }
  };

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((seconds) => {
          const newSeconds = seconds + 1;

          if (newSeconds >= 2700) {
            clearInterval(interval);

            const endTime = new Date();
            const durationInMinutes = 45;

            const newFeeding = {
              ...currentFeeding,
              endTime,
              duration: durationInMinutes,
              side: activeBreast,
              timestamp: endTime.toISOString(),
            };

            setBreastFeedings((prevFeedings) => [...prevFeedings, newFeeding]);

            const feedingData = {
              childId: currentChild.id,
              startTime: currentFeeding.startTime.toISOString(),
              endTime: endTime.toISOString(),
              duration: durationInMinutes,
              side: activeBreast,
              notes: currentFeeding.note || "Auto-stopped after 45 minutes",
              // Use full datetime format
              timestamp: getCurrentDateTimeString(),
            };

            setTimeout(async () => {
              try {
                await feedingService.saveBreastfeedingData(feedingData);
                await loadFeedingData();

                Alert.alert(
                  "Timer Auto-Stopped",
                  `Breastfeeding timer automatically stopped after ${durationInMinutes} minutes.`,
                  [{ text: "OK" }]
                );
              } catch (err) {
                console.error("Error auto-saving breastfeeding data:", err);
              }
            }, 100);

            setIsTimerRunning(false);
            setTimerSeconds(0);
            setActiveBreast(null);

            return 0;
          }

          return newSeconds;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentFeeding, activeBreast, currentChild]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const addBottleFeeding = async () => {
    if (
      !currentFeeding.amount ||
      isNaN(Number.parseInt(currentFeeding.amount)) ||
      Number.parseInt(currentFeeding.amount) <= 0 ||
      currentFeeding.amount.length > 4
    ) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount between 1 and 9999 milliliters."
      );
      return;
    }

    const now = new Date();
    const newFeeding = {
      ...currentFeeding,
      type: "bottle",
      amount: Number.parseInt(currentFeeding.amount),
      timestamp: now.toISOString(),
    };

    setBottleFeedings([...bottleFeedings, newFeeding]);

    setCurrentFeeding({
      ...currentFeeding,
      amount: "",
      note: "",
    });

    try {
      const feedingData = {
        childId: currentChild.id,
        amount: Number.parseInt(currentFeeding.amount),
        unit: "ml",
        notes: currentFeeding.note || "",
        // Use full datetime format
        timestamp: getCurrentDateTimeString(),
      };

      await feedingService.saveBottleFeedingData(feedingData);
      await loadFeedingData();
    } catch (err) {
      console.error("Error saving bottle feeding data:", err);
    }

    Alert.alert(
      "Feeding Recorded",
      `Bottle feeding recorded: ${newFeeding.amount} ml.`,
      [{ text: "OK" }]
    );
  };

  const addSolidFeeding = async () => {
    if (
      !currentFeeding.amount ||
      isNaN(Number.parseInt(currentFeeding.amount)) ||
      Number.parseInt(currentFeeding.amount) <= 0 ||
      currentFeeding.amount.length > 3
    ) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount between 1 and 999 grams."
      );
      return;
    }

    const now = new Date();
    const newFeeding = {
      ...currentFeeding,
      type: "solid",
      amount: Number.parseInt(currentFeeding.amount),
      timestamp: now.toISOString(),
    };

    setSolidFoodFeedings([...solidFoodFeedings, newFeeding]);

    setCurrentFeeding({
      ...currentFeeding,
      amount: "",
      note: "",
    });

    try {
      const feedingData = {
        childId: currentChild.id,
        foodType: currentFeeding.note || "Solid food",
        amount: Number.parseInt(currentFeeding.amount),
        unit: "g",
        notes: currentFeeding.note || "",
        // Use full datetime format
        timestamp: getCurrentDateTimeString(),
      };

      await feedingService.saveSolidFoodData(feedingData);
      await loadFeedingData();
    } catch (err) {
      console.error("Error saving solid food data:", err);
    }

    Alert.alert(
      "Feeding Recorded",
      `Solid food feeding recorded: ${newFeeding.amount} grams.`,
      [{ text: "OK" }]
    );
  };

  const dailyTotals = {
    breastCount: breastFeedings.length,
    breastMinutes: breastFeedings.reduce(
      (total, feeding) => total + (Number.parseInt(feeding.duration) || 0),
      0
    ),
    bottleCount: bottleFeedings.length,
    bottleMl: bottleFeedings.reduce(
      (total, feeding) => total + (Number.parseInt(feeding.amount) || 0),
      0
    ),
    solidCount: solidFoodFeedings.length,
    solidGrams: solidFoodFeedings.reduce(
      (total, feeding) => total + (Number.parseInt(feeding.amount) || 0),
      0
    ),
  };

  const getFeedingRecommendations = (ageInMonths) => {
    if (ageInMonths < 6) {
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
        recommendedBreastMinutes: 240,
        recommendedBottleMl: 750,
        recommendedSolidGrams: 0,
      };
    } else if (ageInMonths >= 6 && ageInMonths < 12) {
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
        recommendedBreastMinutes: 180,
        recommendedBottleMl: 800,
        recommendedSolidGrams: 150,
      };
    } else {
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
        recommendedBreastMinutes: 120,
        recommendedBottleMl: 450,
        recommendedSolidGrams: 300,
      };
    }
  };

  const recommendations = getFeedingRecommendations(childAgeInMonths);

  const breastColor = "#FF9500";
  const bottleColor = "#5A87FF";
  const solidColor = "#4CD964";

  const getMaxChartValue = () => {
    const breastValue = dailyTotals.breastMinutes;
    const bottleValue = dailyTotals.bottleMl / 10;
    const solidValue = childAgeInMonths >= 6 ? dailyTotals.solidGrams / 5 : 0;

    const recBreastValue = recommendations.recommendedBreastMinutes;
    const recBottleValue = recommendations.recommendedBottleMl / 10;
    const recSolidValue =
      childAgeInMonths >= 6 ? recommendations.recommendedSolidGrams / 5 : 0;

    return Math.max(
      breastValue,
      bottleValue,
      solidValue,
      recBreastValue,
      recBottleValue,
      recSolidValue,
      10
    );
  };

  const calculateBarHeight = (value, maxValue) => {
    const maxDisplayHeight = 150;
    const scaleFactor = maxDisplayHeight / maxValue;
    return value * scaleFactor;
  };

  const chartData = [
    {
      value: dailyTotals.breastMinutes,
      label: "Breastfeeding",
      color: breastColor,
      unit: "min",
      icon: (
        <FontAwesome6
          name="person-breastfeeding"
          size={16}
          color={breastColor}
        />
      ),
    },
    {
      value: dailyTotals.bottleMl,
      label: "Bottle Feeding",
      color: bottleColor,
      unit: "ml",
      icon: (
        <MaterialCommunityIcons
          name="baby-bottle-outline"
          size={16}
          color={bottleColor}
        />
      ),
    },
  ];

  if (childAgeInMonths >= 6) {
    chartData.push({
      value: dailyTotals.solidGrams,
      label: "Solid Food",
      color: solidColor,
      unit: "g",
      icon: <Ionicons name="nutrition" size={16} color={solidColor} />,
    });
  }

  const targetValues = [
    recommendations.recommendedBreastMinutes,
    recommendations.recommendedBottleMl,
    childAgeInMonths >= 6 ? recommendations.recommendedSolidGrams : 0,
  ];

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={loadFeedingData}
          >
            <Ionicons name="refresh" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <Ionicons
              name={
                notificationsEnabled ? "notifications" : "notifications-off"
              }
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      ),
      title: `${currentChild?.name?.split(" ")[0] || "Baby"}'s Feeding`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

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
            {feeding.type === "breast" ? (
              <FontAwesome6
                name="person-breastfeeding"
                size={16}
                color="#FF9500"
              />
            ) : feeding.type === "bottle" ? (
              <MaterialCommunityIcons
                name="baby-bottle-outline"
                size={16}
                color="#5A87FF"
              />
            ) : (
              <Ionicons name="nutrition" size={16} color="#4CD964" />
            )}
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

  const deleteFeeding = async (item) => {
    try {
      setIsLoading(true);
      await feedingService.deleteFeedingData(item.id);
      await loadFeedingData();
      Alert.alert("Success", "Feeding record deleted successfully");
    } catch (error) {
      console.error("Error deleting feeding record:", error);
      Alert.alert("Error", "Failed to delete feeding record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

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

        <ColumnChart
          title="Daily Feeding Chart"
          data={chartData}
          targetValues={targetValues}
          calculateBarHeight={calculateBarHeight}
          getMaxValue={getMaxChartValue}
          targetLegendText="Recommended Daily Target"
        />

        <View
          style={[
            styles.recordContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Record Feeding
          </Text>

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
                <FontAwesome6
                  name="person-breastfeeding"
                  size={24}
                  color="#FF9500"
                />
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
                <MaterialCommunityIcons
                  name="baby-bottle-outline"
                  size={24}
                  color="#5A87FF"
                />
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
                  onChangeText={(value) => {
                    const numericValue = value.replace(/[^0-9]/g, "");
                    if (numericValue.length <= 4) {
                      setCurrentFeeding({
                        ...currentFeeding,
                        type: "bottle",
                        amount: numericValue,
                      });
                    }
                  }}
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
                  <Ionicons name="nutrition" size={24} color="#4CD964" />
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
                    onChangeText={(value) => {
                      const numericValue = value.replace(/[^0-9]/g, "");
                      if (numericValue.length <= 3) {
                        setCurrentFeeding({
                          ...currentFeeding,
                          type: "solid",
                          amount: numericValue,
                        });
                      }
                    }}
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
          showDeleteButton={true}
          onDeleteItem={deleteFeeding}
          deleteConfirmTitle="Delete Feeding Record"
          deleteConfirmMessage="Are you sure you want to delete this feeding record? This action cannot be undone."
        />

        <SummaryCards
          title="Today's Feeding Summary"
          data={dailyTotals}
          theme={theme}
          showSolidFood={childAgeInMonths >= 6}
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
    padding: 16,
    paddingBottom: 30,
  },
  headerButton: {
    padding: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
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
