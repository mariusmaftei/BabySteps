"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import defaultChildImage from "../../assets/images/default-child.png";
import happyChildImage from "../../assets/images/happy-child.png";
import sadChildImage from "../../assets/images/sad-child.png";
import { fetchSleepRecords } from "../../services/sleep-service";

import { useTheme } from "../../context/theme-context";
import { useChildActivity } from "../../context/child-activity-context";
import { useNotification } from "../../context/notification-context";
import { getChildAgeInMonths } from "../../utils/age-calculator";
import { getSleepRecommendation } from "../../utils/sleep-recommendations";
import * as VaccinationService from "../../services/vaccination-service";
import * as GrowthService from "../../services/growth-service";
import { WHO_STANDARDS, getProgressColor } from "../../utils/growth-utils";
function ActivityScreen({ navigation }) {
  // All hooks must be called at the top level, before any conditional logic
  const { theme } = useTheme();
  const { currentChild, currentChildId, children, switchChild } =
    useChildActivity();
  const { updateCurrentScreen } = useNotification();

  // State hooks
  const [showChildSwitcherModal, setShowChildSwitcherModal] = useState(false);
  const [localChildren, setLocalChildren] = useState([]);
  const [showAddChildPrompt, setShowAddChildPrompt] = useState(false);
  const [sleepData, setSleepData] = useState([]);
  const [sleepPercentage, setSleepPercentage] = useState(0);
  const [vaccinationProgress, setVaccinationProgress] = useState(0);
  // Add state variables for growth progress after the existing state declarations
  const [weightGain, setWeightGain] = useState(0);
  const [heightGain, setHeightGain] = useState(0);
  const [headCircGain, setHeadCircGain] = useState(0);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [latestGrowthRecord, setLatestGrowthRecord] = useState(null);
  const [growthStatistics, setGrowthStatistics] = useState(null);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [showGrowthDetailsModal, setShowGrowthDetailsModal] = useState(false);
  // Add these state variables after the existing growth-related state variables (around line 60)
  const [weightProgress, setWeightProgress] = useState(0);
  const [heightProgress, setHeightProgress] = useState(0);
  const [headCircProgress, setHeadCircProgress] = useState(0);
  const [musicPercentage, setMusicPercentage] = useState(0);

  // Derived state
  const noChildren = !currentChild || currentChild.id === "default";

  // Helper function to get the correct image source
  const getChildImageSource = useCallback((child) => {
    // Check for imageSrc first (this is what's used in your database)
    if (child?.imageSrc && child.imageSrc !== "default") {
      return { uri: child.imageSrc };
    }
    // Then check for image (alternative property name)
    else if (child?.image && child.image !== "default") {
      return { uri: child.image };
    }
    // Use default image if no valid image URL is found
    return defaultChildImage;
  }, []);

  // Activity card data with trend information
  const activityCards = useMemo(
    () => [
      {
        title: "SleepScreen",
        subtitle: "Track sleep patterns",
        icon: "moon",
        color: "#5A87FF",
        gradient: ["#5A87FF", "#709DFF"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleeping-child.jpg-kFbvedsqniZ96VLUXSOV0eJkAur7TZ.jpeg",
        trend: currentChild?.activities?.sleep?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.sleep?.trend || "0%",
        screen: "SleepScreen",
      },
      {
        title: "FeedingScreen",
        subtitle: "Meal tracking",
        icon: "restaurant",
        color: "#FF9500",
        gradient: ["#FF9500", "#FFAC30"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Feeding-child.jpg-zD7Y5eQyPiLnGi7o7ph6xNgLw9bdVW.jpeg",
        trend: currentChild?.activities?.feeding?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.feeding?.trend || "0%",
        screen: "FeedingScreen",
      },
      {
        title: "GrowthScreen",
        subtitle: "Track development",
        icon: "trending-up",
        color: "#4CD964",
        gradient: ["#4CD964", "#7AE28C"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/child-growth.jpg-UWt4Kw8CtpknvXrh0f4NDTDbNovWuy.jpeg",
        trend: currentChild?.activities?.growth?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.growth?.trend || "0%",
        screen: "GrowthScreen",
      },
      {
        title: "DiaperScreen",
        subtitle: "Track changes & hygiene",
        icon: "water",
        color: "#00B4D8",
        gradient: ["#00B4D8", "#48CAE4"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
        trend: currentChild?.activities?.diaper?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.diaper?.trend || "0%",
        screen: "DiaperScreen",
      },
      {
        title: "HealthScreen",
        subtitle: "Medical checkups",
        icon: "medkit",
        color: "#007AFF", // Changed to blue
        gradient: ["#007AFF", "#4DA3FF"], // Changed to blue gradient
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/heatly-child.jpg-kyeSB4d3cISzh9dPjtHnSvLRzZG6D1.jpeg",
        trend: currentChild?.activities?.health?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.health?.trend || "0%",
        screen: "HealthScreen",
      },
      {
        title: "MusicScreen",
        subtitle: "Soothing music & sounds",
        icon: "musical-notes",
        color: "#F472B6",
        gradient: ["#F472B6", "#F9A8D4"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/relaxing.jpg-njSGsa3qQi5ELgv3r4dECK349CakfZ.jpeg",
        trend: "up", // Add trend property
        trendValue: `${musicPercentage}%`, // Add trendValue property
        screen: "MusicScreen",
      },
    ],
    [currentChild, musicPercentage]
  );

  // Calculate overall mood based on trends
  const isHappyMood = useMemo(() => {
    const positiveCount = activityCards.filter(
      (card) => card.trend === "up"
    ).length;
    const negativeCount = activityCards.filter(
      (card) => card.trend === "down"
    ).length;
    return positiveCount > negativeCount;
  }, [activityCards]);

  // Get mood image source based on mood - now using local images
  const getMoodImage = useMemo(() => {
    return isHappyMood ? happyChildImage : sadChildImage;
  }, [isHappyMood]);

  // Handle card press
  const handleCardPress = useCallback(
    (item) => {
      if (item.screen) {
        navigation.navigate(item.screen);
      } else {
        console.log(`${item.title} pressed`);
      }
    },
    [navigation]
  );

  // Add this function to handle child selection with improved logging
  const fetchDataForChild = useCallback(
    async (childId) => {
      try {
        console.log(`Directly fetching data for child ID: ${childId}`);

        // Reset all progress values
        setGrowthProgress(0);
        setWeightProgress(0);
        setHeightProgress(0);
        setHeadCircProgress(0);
        setSleepPercentage(0);
        setVaccinationProgress(0);

        // Fetch sleep data
        const sleepRecords = await fetchSleepRecords(childId);
        setSleepData(sleepRecords);

        // Get the child from local children to calculate sleep percentage
        const selectedChild = localChildren.find(
          (child) => String(child.id) === String(childId)
        );
        if (selectedChild && sleepRecords) {
          calculateSleepPercentageForChild(sleepRecords, selectedChild);
        }

        // Fetch vaccination progress
        const vaccProgress = await VaccinationService.getVaccinationProgress(
          childId
        );
        setVaccinationProgress(vaccProgress?.percentage || 0);

        // Fetch growth data
        const latestRecord = await GrowthService.getLatestGrowthRecord(childId);
        if (latestRecord) {
          console.log("Latest growth record for new child:", latestRecord);

          // Extract the progress percentages
          const heightProgressValue = latestRecord.heightProgress || 0;
          const weightProgressValue = latestRecord.weightProgress || 0;
          const headCircProgressValue =
            latestRecord.headCircumferenceProgress || 0;

          // Update the state
          setHeightProgress(heightProgressValue);
          setWeightProgress(weightProgressValue);
          setHeadCircProgress(headCircProgressValue);
          setGrowthProgress(heightProgressValue); // For backward compatibility
          setLatestGrowthRecord(latestRecord);

          try {
            const statistics = await GrowthService.getGrowthStatistics(childId);
            setGrowthStatistics(statistics);
          } catch (error) {
            console.log("Could not fetch growth statistics for new child");
          }
        } else {
          // Reset all growth-related values when no records are found
          setHeightProgress(0);
          setWeightProgress(0);
          setHeadCircProgress(0);
          setGrowthProgress(0);
          setLatestGrowthRecord(null);
          setGrowthStatistics(null);
        }
      } catch (error) {
        console.error("Error fetching data for child:", error);
      }
    },
    [localChildren]
  );

  const handleSelectChild = useCallback(
    (childId) => {
      console.log(`Attempting to switch to child with ID: ${childId}`);

      // Check if the child exists in our local children array
      const childExists = localChildren.some(
        (child) => String(child.id) === String(childId)
      );

      if (!childExists) {
        console.warn(
          `Child with ID ${childId} not found in local children list`
        );
        return;
      }

      // Reset progress values before switching child
      setGrowthProgress(0);
      setWeightProgress(0);
      setHeightProgress(0);
      setHeadCircProgress(0);
      setSleepPercentage(0);
      setVaccinationProgress(0);
      setLatestGrowthRecord(null);
      setGrowthStatistics(null);

      // Call the switchChild function from context
      const success = switchChild(childId);
      // If switch was successful, fetch the new child's data
      if (success) {
        // Use setTimeout to ensure the child context has updated before fetching
        setTimeout(() => {
          console.log("Fetching data for newly selected child:", childId);
          // Fetch data directly using the childId instead of relying on context
          fetchDataForChild(childId);
        }, 300); // Increased timeout to give more time for context to update
      }
      console.log(`Switch child result: ${success ? "success" : "failed"}`);

      // Close the modal
      setShowChildSwitcherModal(false);
    },
    [switchChild, localChildren, fetchDataForChild]
  );

  // Add a function to calculate sleep percentage for a specific child
  const calculateSleepPercentageForChild = useCallback((records, child) => {
    if (!records || records.length === 0 || !child) {
      setSleepPercentage(0);
      return;
    }

    // Get today's records
    const today = new Date();
    const todayRecords = records.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() === today.toDateString();
    });

    if (todayRecords.length === 0) {
      setSleepPercentage(0);
      return;
    }

    // Calculate total sleep hours
    const totalNapHours = todayRecords.reduce(
      (sum, record) => sum + (Number.parseFloat(record.napHours) || 0),
      0
    );
    const totalNightHours = todayRecords.reduce(
      (sum, record) => sum + (Number.parseFloat(record.nightHours) || 0),
      0
    );
    const totalSleepHours = totalNapHours + totalNightHours;

    // Get recommended sleep hours
    const ageInMonths = getChildAgeInMonths(child.birthDate);
    const { minHours } = getSleepRecommendation(ageInMonths);

    // Calculate percentage
    const percentage = Math.round(
      ((totalSleepHours - minHours) / minHours) * 100
    );
    setSleepPercentage(percentage || 0);
  }, []);

  // Update local children whenever the children prop changes
  useEffect(() => {
    if (children && Array.isArray(children)) {
      console.log(
        "Children updated in Activity screen:",
        children.length,
        "children"
      );
      setLocalChildren(children);
    }
  }, [children]);

  const fetchSleepData = useCallback(async () => {
    try {
      console.log(`Fetching sleep data for child ID: ${currentChild.id}`);
      const records = await fetchSleepRecords(currentChild.id);
      setSleepData(records);
      calculateSleepPercentage(records);
    } catch (error) {
      console.error("Error fetching sleep data:", error);
      setSleepPercentage(0);
    }
  }, [currentChild, calculateSleepPercentage]);

  const fetchVaccinationProgress = useCallback(async () => {
    try {
      console.log(
        `Fetching vaccination progress for child ID: ${currentChild.id}`
      );
      const progressData = await VaccinationService.getVaccinationProgress(
        currentChild.id
      );
      setVaccinationProgress(progressData.percentage || 0);
    } catch (error) {
      console.error("Error fetching vaccination progress:", error);
      setVaccinationProgress(0);
    }
  }, [currentChild]);

  // Update the fetchGrowthProgress function to get the percentages directly from the database
  const fetchGrowthProgress = useCallback(async () => {
    try {
      console.log(`Fetching growth data for child ID: ${currentChild.id}`);

      // Get the latest growth record which contains the progress percentages
      const latestRecord = await GrowthService.getLatestGrowthRecord(
        currentChild.id
      );

      if (latestRecord) {
        console.log("Latest growth record:", latestRecord);

        // Extract the progress percentages from the latest record
        const heightProgressValue = latestRecord.heightProgress || 0;
        const weightProgressValue = latestRecord.weightProgress || 0;
        const headCircProgressValue =
          latestRecord.headCircumferenceProgress || 0;

        console.log("Growth progress percentages from database:", {
          heightProgress: heightProgressValue,
          weightProgress: weightProgressValue,
          headCircProgress: headCircProgressValue,
        });

        // Update the state with the progress percentages
        setHeightProgress(heightProgressValue);
        setWeightProgress(weightProgressValue);
        setHeadCircProgress(headCircProgressValue);

        // For backward compatibility, still set the overall growth progress
        setGrowthProgress(heightProgressValue);

        // Store the latest record for reference
        setLatestGrowthRecord(latestRecord);

        // For backward compatibility, still try to get the statistics
        try {
          const statistics = await GrowthService.getGrowthStatistics(
            currentChild.id
          );
          setGrowthStatistics(statistics);
        } catch (error) {
          console.log(
            "Could not fetch growth statistics, using percentages from latest record only"
          );
        }
      } else {
        console.log("No growth records found");
        // Reset all growth-related values when no records are found
        setHeightProgress(0);
        setWeightProgress(0);
        setHeadCircProgress(0);
        setGrowthProgress(0);
        setLatestGrowthRecord(null);
        setGrowthStatistics(null);
      }
    } catch (error) {
      console.error("Error fetching growth data:", error);
    }
  }, [currentChild]);

  // Update the useEffect that calls fetch functions to include fetchGrowthProgress
  useEffect(() => {
    // Reset all progress values immediately when child changes
    setGrowthProgress(0);
    setWeightProgress(0);
    setHeightProgress(0);
    setHeadCircGain(0);
    setWeightGain(0);
    setHeightGain(0);
    setSleepPercentage(0);
    setVaccinationProgress(0);
    setLatestGrowthRecord(null);
    setGrowthStatistics(null);

    if (currentChild && currentChild.id !== "default") {
      // Then fetch the new data
      fetchSleepData();
      fetchVaccinationProgress();
      fetchGrowthProgress();
    }
  }, [
    currentChild,
    currentChildId,
    fetchSleepData,
    fetchVaccinationProgress,
    fetchGrowthProgress,
  ]);

  const calculateSleepPercentage = useCallback(
    (records) => {
      if (!records || records.length === 0 || !currentChild) {
        setSleepPercentage(0);
        return;
      }

      // Get today's records
      const today = new Date();
      const todayRecords = records.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === today.toDateString();
      });

      if (todayRecords.length === 0) {
        setSleepPercentage(0);
        return;
      }

      // Calculate total sleep hours
      const totalNapHours = todayRecords.reduce(
        (sum, record) => sum + (Number.parseFloat(record.napHours) || 0),
        0
      );
      const totalNightHours = todayRecords.reduce(
        (sum, record) => sum + (Number.parseFloat(record.nightHours) || 0),
        0
      );
      const totalSleepHours = totalNapHours + totalNightHours;

      // Get recommended sleep hours
      const ageInMonths = getChildAgeInMonths(currentChild.birthDate);
      const { minHours } = getSleepRecommendation(ageInMonths);

      // Calculate percentage
      const percentage = Math.round(
        ((totalSleepHours - minHours) / minHours) * 100
      );
      setSleepPercentage(percentage || 0);
    },
    [currentChild]
  );

  // Show the add child prompt when there are no children
  useEffect(() => {
    setShowAddChildPrompt(noChildren);
  }, [noChildren]);

  // Add this useEffect to refresh the modal data when it's opened
  useEffect(() => {
    if (showChildSwitcherModal) {
      console.log("Child switcher modal opened, refreshing children data");
      // This ensures we have the latest children data when the modal opens
      setLocalChildren([...children]);
    }
  }, [showChildSwitcherModal, children]);

  // Add this useLayoutEffect to set up the header right button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowChildSwitcherModal(true)}
          disabled={noChildren}
        >
          <Ionicons
            name="people"
            size={24}
            color={noChildren ? theme.textTertiary : theme.primary}
          />
        </TouchableOpacity>
      ),
      title: noChildren
        ? "Add a Child"
        : `${currentChild.name.split(" ")[0]}'s Activity`,
      headerTitle: () => (
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {noChildren
            ? "Add a Child"
            : `${currentChild.name.split(" ")[0]}'s Activity`}
        </Text>
      ),
    });

    // Update current screen to Activity
    updateCurrentScreen("Activity");
  }, [navigation, theme, currentChild, noChildren, updateCurrentScreen]);

  // Update the focus listener to also refresh growth data
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("Activity screen focused, refreshing data");
      // This will ensure we have the latest children data when returning to this screen
      setLocalChildren([...children]);

      // Also refresh all data when returning to this screen
      if (currentChild && currentChild.id !== "default") {
        fetchDataForChild(currentChild.id);
      }
    });

    return unsubscribe;
  }, [navigation, children, currentChild, fetchDataForChild]);

  // Render activity card - defined as a memoized function to avoid recreating on every render
  const renderActivityCard = useCallback(
    (item, index) => {
      if (item.title === "SleepScreen") {
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              {
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              {/* Trend Icon - Only show if trend property exists */}
              {item.trend && (
                <View style={styles.trendIconContainer}>
                  <View
                    style={[
                      styles.trendIconBackground,
                      {
                        backgroundColor:
                          item.title === "HealthScreen"
                            ? "#007AFF" // Blue for Health card regardless of trend
                            : sleepPercentage >= 0
                            ? "#4CD964" // Green for positive percentage
                            : "#FF3B30", // Red for negative percentage
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        sleepPercentage >= 0 ? "trending-up" : "trending-down"
                      }
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.trendText}>
                      {sleepPercentage >= 0
                        ? `+${sleepPercentage}%`
                        : `${sleepPercentage}%`}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.imageTextContainer}>
                <Text style={styles.imageCardTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        );
      }

      if (item.title === "Health") {
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              {
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              {/* Vaccination Progress Badge */}
              <View style={styles.trendIconContainer}>
                <View
                  style={[
                    styles.trendIconBackground,
                    {
                      backgroundColor: "#007AFF", // Blue for Health card
                    },
                  ]}
                >
                  <Ionicons name="medical" size={14} color="#FFFFFF" />
                  <Text style={styles.trendText}>{vaccinationProgress}%</Text>
                </View>
              </View>

              <View style={styles.imageTextContainer}>
                <Text style={styles.imageCardTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        );
      }

      // Add this condition inside the renderActivityCard function where it checks for item.image
      // Update the Growth card to clearly show it's height progress
      if (item.title === "GrowthScreen") {
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              {
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              {/* Growth Progress Badges */}
              <View style={styles.growthProgressContainer}>
                {/* Height Progress Badge */}
                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor: getProgressColor(heightProgress, theme),
                    },
                  ]}
                >
                  <Ionicons name="resize-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.growthBadgeText}>
                    {heightProgress > 0
                      ? `+${heightProgress}%`
                      : `${heightProgress}%`}
                  </Text>
                </View>

                {/* Weight Progress Badge */}
                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor: getProgressColor(weightProgress, theme),
                    },
                  ]}
                >
                  <Ionicons name="barbell-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.growthBadgeText}>
                    {weightProgress > 0
                      ? `+${weightProgress}%`
                      : `${weightProgress}%`}
                  </Text>
                </View>

                {/* Head Circumference Progress Badge */}
                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor: getProgressColor(
                        headCircProgress,
                        theme
                      ),
                    },
                  ]}
                >
                  <Ionicons name="ellipse-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.growthBadgeText}>
                    {headCircProgress > 0
                      ? `+${headCircProgress}%`
                      : `${headCircProgress}%`}
                  </Text>
                </View>
              </View>

              <View style={styles.imageTextContainer}>
                <Text style={styles.imageCardTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        );
      }

      if (item.title === "MusicScreen") {
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              {
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              {/* Music Icon Badge */}
              <View style={styles.trendIconContainer}>
                <View
                  style={[
                    styles.musicIconBackground,
                    {
                      backgroundColor: "#007AFF", // Blue background
                    },
                  ]}
                >
                  <Ionicons name="musical-notes" size={14} color="#FFFFFF" />
                  <Ionicons
                    name="musical-note"
                    size={14}
                    color="#FFFFFF"
                    style={styles.trebleClefIcon}
                  />
                </View>
              </View>

              <View style={styles.imageTextContainer}>
                <Text style={styles.imageCardTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        );
      }

      if (item.image) {
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              {
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              {/* Trend Icon - Only show if trend property exists */}
              {item.trend && (
                <View style={styles.trendIconContainer}>
                  <View
                    style={[
                      styles.trendIconBackground,
                      {
                        backgroundColor:
                          item.title === "HealthScreen"
                            ? "#007AFF" // Blue for Health card regardless of trend
                            : item.trend === "up"
                            ? "#4CD964" // Green for up trend (other cards)
                            : "#FF3B30", // Red for down trend (other cards)
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        item.trend === "up" ? "trending-up" : "trending-down"
                      }
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.trendText}>{item.trendValue}</Text>
                  </View>
                </View>
              )}

              <View style={styles.imageTextContainer}>
                <Text style={styles.imageCardTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        );
      }

      // Also update the second part (for cards without images):
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: item.color,
              shadowColor: theme.isDark ? "#000" : "#000",
            },
          ]}
          activeOpacity={0.9}
          onPress={() => handleCardPress(item)}
        >
          {/* Trend Icon - Only show if trend property exists */}
          {item.trend && (
            <View style={styles.trendIconContainer}>
              <View
                style={[
                  styles.trendIconBackground,
                  {
                    backgroundColor:
                      item.title === "HealthScreen"
                        ? "#007AFF" // Blue for Health card regardless of trend
                        : item.trend === "up"
                        ? "#4CD964" // Green for up trend (other cards)
                        : "#FF3B30", // Red for down trend (other cards)
                  },
                ]}
              >
                <Ionicons
                  name={item.trend === "up" ? "trending-up" : "trending-down"}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.trendText}>{item.trendValue}</Text>
              </View>
            </View>
          )}

          <View style={styles.cardContent}>
            <Ionicons name={item.icon} size={36} color="#FFFFFF" />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [
      theme,
      handleCardPress,
      sleepPercentage,
      vaccinationProgress,
      heightProgress,
      weightProgress,
      headCircProgress,
      musicPercentage,
    ]
  );

  // Child switcher modal component - memoized to avoid recreating on every render
  const childSwitcherModal = useMemo(
    () => (
      <Modal
        visible={showChildSwitcherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChildSwitcherModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.modalBackground,
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Switch Child
              </Text>
              <TouchableOpacity
                onPress={() => setShowChildSwitcherModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.childList}>
              {localChildren.length === 0 ? (
                <Text
                  style={[
                    styles.noChildrenText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No children found. Add a child in settings.
                </Text>
              ) : (
                localChildren.map((child) => {
                  // For debugging - log the child data to see what properties are available
                  console.log(
                    `Rendering child in switcher: ${child.id}, name: ${child.name}`
                  );

                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childSwitcherItem,
                        String(child.id) === String(currentChildId) && {
                          backgroundColor: `${theme.primary}15`,
                        },
                        { borderBottomColor: theme.borderLight },
                      ]}
                      onPress={() => handleSelectChild(child.id)}
                    >
                      <Image
                        source={getChildImageSource(child)}
                        style={styles.childSwitcherImage}
                        defaultSource={defaultChildImage}
                        onError={(e) => {
                          console.log(
                            "Error loading child image:",
                            e.nativeEvent.error
                          );
                        }}
                      />
                      <View style={styles.childSwitcherInfo}>
                        <Text
                          style={[
                            styles.childSwitcherName,
                            { color: theme.text },
                          ]}
                        >
                          {child.name}
                        </Text>
                        <Text
                          style={[
                            styles.childSwitcherAge,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {child.age}
                        </Text>
                      </View>
                      {String(child.id) === String(currentChildId) && (
                        <View
                          style={[
                            styles.currentChildIndicator,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.addChildButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setShowChildSwitcherModal(false);
                navigation.navigate("Settings");
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.addChildText}>Manage Children</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [
      showChildSwitcherModal,
      theme,
      localChildren,
      currentChildId,
      getChildImageSource,
      handleSelectChild,
      navigation,
    ]
  );

  // Main render
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {noChildren ? (
        <View style={styles.noChildContainer}>
          <Ionicons
            name="person-add"
            size={60}
            color={theme.primary}
            style={styles.noChildIcon}
          />
          <Text style={[styles.noChildTitle, { color: theme.text }]}>
            No Children Added
          </Text>
          <Text
            style={[styles.noChildSubtitle, { color: theme.textSecondary }]}
          >
            Add a child in the settings to start tracking their activities
          </Text>
          <TouchableOpacity
            style={[styles.addChildButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color="#FFFFFF"
              style={styles.addChildButtonIcon}
            />
            <Text style={styles.addChildButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            {/* Profile image with mood image in bottom right */}
            <View style={styles.profileImageContainer}>
              <Image
                source={getChildImageSource(currentChild)}
                style={[
                  styles.childProfileImage,
                  { borderColor: theme.background },
                ]}
                defaultSource={defaultChildImage}
                onError={(e) => {
                  console.log(
                    "Error loading child profile image:",
                    e.nativeEvent.error
                  );
                }}
              />
              {/* Mood image in bottom right of profile image */}
              <View style={styles.smallImageContainer}>
                <Image
                  source={getMoodImage}
                  style={styles.smallChildImage}
                  resizeMode="contain"
                  onError={(e) => {
                    console.log(
                      "Error loading mood image:",
                      e.nativeEvent.error
                    );
                  }}
                />
              </View>
            </View>

            <Text style={[styles.headerText, { color: theme.text }]}>
              {currentChild.name.split(" ")[0]}'s Activity
            </Text>
            <Text
              style={[styles.subHeaderText, { color: theme.textSecondary }]}
            >
              Monitor and record daily activities
            </Text>
          </View>

          <View style={styles.cardGrid}>
            {activityCards.map((item, index) =>
              renderActivityCard(item, index)
            )}
          </View>
        </ScrollView>
      )}
      {childSwitcherModal}
    </SafeAreaView>
  );
}

// Add these utility functions after the existing utility functions
const calculateHeightProgressFromWHO = (height, ageInMonths, gender) => {
  // Cap age at 12 months for now since we only have data up to 12 months
  const cappedAge = Math.min(ageInMonths, 12);

  // Get WHO standards for the child's gender
  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  // Find the closest age in the standards
  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  // Convert height from mm to cm for comparison with WHO standards
  const heightInCm = height / 10;

  // Calculate percentage based on WHO standard (100% means exactly at the standard)
  const percentage = Math.round((heightInCm / closestStandard.height) * 100);

  // Return a value between 0 and 100
  return Math.min(Math.max(percentage, 0), 100);
};

const calculateWeightProgressFromWHO = (weight, ageInMonths, gender) => {
  // Cap age at 12 months for now since we only have data up to 12 months
  const cappedAge = Math.min(ageInMonths, 12);

  // Get WHO standards for the child's gender
  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  // Find the closest age in the standards
  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  // Convert weight from grams to kg for comparison with WHO standards
  const weightInKg = weight / 1000;

  // Calculate percentage based on WHO standard (100% means exactly at the standard)
  const percentage = Math.round((weightInKg / closestStandard.weight) * 100);

  // Return a value between 0 and 100
  return Math.min(Math.max(percentage, 0), 100);
};

const calculateHeadCircProgressFromWHO = (headCirc, ageInMonths, gender) => {
  // Cap age at 12 months for now since we only have data up to 12 months
  const cappedAge = Math.min(ageInMonths, 12);

  // Get WHO standards for the child's gender
  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  // Find the closest age in the standards
  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  // Convert head circumference from mm to cm for comparison with WHO standards
  const headCircInCm = headCirc / 10;

  // Calculate percentage based on WHO standard (100% means exactly at the standard)
  const percentage = Math.round(
    (headCircInCm / closestStandard.headCirc) * 100
  );

  // Return a value between 0 and 100
  return Math.min(Math.max(percentage, 0), 100);
};

// Add WHO standards data after the existing constants
// const WHO_STANDARDS = {
//   boys: [
//     { age: 0, weight: 3.3, height: 49.9, headCirc: 34.5 }, // Newborn
//     { age: 1, weight: 4.5, height: 54.7, headCirc: 37.1 }, // 1 month
//     { age: 2, weight: 5.6, height: 58.4, headCirc: 39.1 }, // 2 months
//     { age: 3, weight: 6.4, height: 61.4, headCirc: 40.5 }, // 3 months
//     { age: 4, weight: 7.0, height: 63.9, headCirc: 41.7 }, // 4 months
//     { age: 5, weight: 7.5, height: 65.9, headCirc: 42.5 }, // 5 months
//     { age: 6, weight: 7.9, height: 67.6, headCirc: 43.2 }, // 6 months
//     { age: 7, weight: 8.3, height: 69.2, headCirc: 43.8 }, // 7 months
//     { age: 8, weight: 8.6, height: 70.6, headCirc: 44.3 }, // 8 months
//     { age: 9, weight: 8.9, height: 72.0, headCirc: 44.7 }, // 9 months
//     { age: 10, weight: 9.2, height: 73.3, headCirc: 45.2 }, // 10 months
//     { age: 11, weight: 9.4, height: 74.5, headCirc: 45.6 }, // 11 months
//     { age: 12, weight: 9.6, height: 75.7, headCirc: 46.0 }, // 12 months
//   ],
//   girls: [
//     { age: 0, weight: 3.2, height: 49.1, headCirc: 33.9 }, // Newborn
//     { age: 1, weight: 4.2, height: 53.7, headCirc: 36.0 }, // 1 month
//     { age: 2, weight: 5.1, height: 57.1, headCirc: 37.9 }, // 2 months
//     { age: 3, weight: 5.8, height: 59.8, headCirc: 39.3 }, // 3 months
//     { age: 4, weight: 6.4, height: 62.1, headCirc: 40.5 }, // 4 months
//     { age: 5, weight: 6.9, height: 64.0, headCirc: 41.3 }, // 5 months
//     { age: 6, weight: 7.3, height: 65.7, headCirc: 42.0 }, // 6 months
//     { age: 7, weight: 7.6, height: 67.3, headCirc: 42.6 }, // 7 months
//     { age: 8, weight: 7.9, height: 68.7, headCirc: 43.1 }, // 8 months
//     { age: 9, weight: 8.2, height: 70.1, headCirc: 43.6 }, // 9 months
//     { age: 10, weight: 8.5, height: 71.5, headCirc: 44.0 }, // 10 months
//     { age: 11, weight: 8.7, height: 72.8, headCirc: 44.4 }, // 11 months
//     { age: 12, weight: 8.9, height: 74.0, headCirc: 44.8 }, // 12 months
//   ],
// };

// Add these styles to the StyleSheet
const styles = StyleSheet.create({
  // ... existing styles

  growthProgressContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    zIndex: 10,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  growthBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 2,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
    width: "100%",
  },
  profileImageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  childProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  smallImageContainer: {
    position: "absolute",
    bottom: -10,
    right: -10,
    zIndex: 10,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallChildImage: {
    width: 56,
    height: 56,
  },
  childSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: "600",
  },
  childAge: {
    fontSize: 12,
  },
  moodImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 14,
    textAlign: "center",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardImage: {
    borderRadius: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 12,
  },
  imageTextContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  imageCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageCardSubtitle: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trendIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  trendIconBackground: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  trendText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
  headerButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    width: "85%",
    maxHeight: "70%",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  childList: {
    maxHeight: 300,
  },
  childSwitcherItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  childSwitcherImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  childSwitcherInfo: {
    flex: 1,
    marginLeft: 16,
  },
  childSwitcherName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  childSwitcherAge: {
    fontSize: 14,
  },
  currentChildIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
  },
  addChildText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    textAlign: "center",
  },
  noChildContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noChildIcon: {
    marginBottom: 20,
  },
  noChildTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  noChildSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addChildButtonIcon: {
    marginRight: 8,
  },
  addChildButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noChildrenText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  musicIconBackground: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  trebleClefIcon: {
    marginLeft: 4,
  },
});

export default ActivityScreen;
