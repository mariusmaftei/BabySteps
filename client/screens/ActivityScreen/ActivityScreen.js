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
  Dimensions,
} from "react-native";
import {
  Ionicons,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import defaultChildImage from "../../assets/images/default-child.png";
import happyChildImage from "../../assets/images/happy-child.png";
import sadChildImage from "../../assets/images/sad-child.png";
import { fetchSleepRecords } from "../../services/sleep-service";
import { getDiaperChanges } from "../../services/diaper-service";
import * as feedingService from "../../services/feeding-service";

import { useTheme } from "../../context/theme-context";
import { useChildActivity } from "../../context/child-activity-context";
import { useNotification } from "../../context/notification-context";
import * as VaccinationService from "../../services/vaccination-service";
import * as GrowthService from "../../services/growth-service";
import { getProgressColor } from "../../utils/growth-utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;

function ActivityScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild, currentChildId, children, switchChild } =
    useChildActivity();
  const { updateCurrentScreen } = useNotification();

  const [showChildSwitcherModal, setShowChildSwitcherModal] = useState(false);
  const [localChildren, setLocalChildren] = useState([]);
  const [showAddChildPrompt, setShowAddChildPrompt] = useState(false);
  const [sleepData, setSleepData] = useState([]);
  const [sleepPercentage, setSleepPercentage] = useState(0);
  const [vaccinationProgress, setVaccinationProgress] = useState(0);
  const [weightProgress, setWeightProgress] = useState(0);
  const [heightProgress, setHeightProgress] = useState(0);
  const [headCircProgress, setHeadCircProgress] = useState(0);
  const [diaperCount, setDiaperCount] = useState(0);
  const [breastfeedingCount, setBreastfeedingCount] = useState(0);
  const [bottlefeedingCount, setBottlefeedingCount] = useState(0);
  const [solidfoodCount, setSolidfoodCount] = useState(0);
  const [musicPercentage, setMusicPercentage] = useState(75);
  const [latestGrowthRecord, setLatestGrowthRecord] = useState(null);

  const iconSize = isSmallDevice ? 9 : 11;
  const smallIconSize = isSmallDevice ? 8 : 9;

  const noChildren = !currentChild || currentChild.id === "default";

  const getChildImageSource = useCallback((child) => {
    if (child?.imageSrc && child.imageSrc !== "default") {
      return { uri: child.imageSrc };
    } else if (child?.image && child.image !== "default") {
      return { uri: child.image };
    }
    return defaultChildImage;
  }, []);

  const activityCards = useMemo(
    () => [
      {
        title: "Sleep",
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
        title: "Feeding",
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
        feedingIcons: [
          { type: "breastfeeding", icon: "woman" },
          { type: "bottlefeeding", icon: "water" },
          { type: "solidfood", icon: "restaurant" },
        ],
      },
      {
        title: "Growth",
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
        title: "Diaper",
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
        title: "Health",
        subtitle: "Medical checkups",
        icon: "medkit",
        color: "#007AFF",
        gradient: ["#007AFF", "#4DA3FF"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/heatly-child.jpg-kyeSB4d3cISzh9dPjtHnSvLRzZG6D1.jpeg",
        trend: currentChild?.activities?.health?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.health?.trend || "0%",
        screen: "HealthScreen",
      },
      {
        title: "Music",
        subtitle: "Soothing music & sounds",
        icon: "musical-notes",
        color: "#F472B6",
        gradient: ["#F472B6", "#F9A8D4"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/relaxing.jpg-njSGsa3qQi5ELgv3r4dECK349CakfZ.jpeg",
        trend: "up",
        trendValue: `${musicPercentage}%`,
        screen: "MusicScreen",
      },
    ],
    [currentChild, musicPercentage]
  );

  const countRedIcons = useMemo(() => {
    let count = 0;

    if (sleepPercentage <= 0) count++;

    if (heightProgress <= 0 || weightProgress <= 0 || headCircProgress <= 0)
      count++;

    if (diaperCount <= 0) count++;

    if (
      breastfeedingCount <= 0 &&
      bottlefeedingCount <= 0 &&
      solidfoodCount <= 0
    )
      count++;

    return count;
  }, [
    sleepPercentage,
    heightProgress,
    weightProgress,
    headCircProgress,
    diaperCount,
    breastfeedingCount,
    bottlefeedingCount,
    solidfoodCount,
  ]);

  const isHappyMood = useMemo(() => {
    return countRedIcons < 2;
  }, [countRedIcons]);

  const getMoodImage = useMemo(() => {
    return isHappyMood ? happyChildImage : sadChildImage;
  }, [isHappyMood]);

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

  const fetchDataForChild = useCallback(async (childId) => {
    try {
      console.log(`Directly fetching data for child ID: ${childId}`);

      setSleepPercentage(0);
      setVaccinationProgress(0);
      setDiaperCount(0);
      setBreastfeedingCount(0);
      setBottlefeedingCount(0);
      setSolidfoodCount(0);

      const sleepRecords = await fetchSleepRecords(childId);
      setSleepData(sleepRecords);

      const today = new Date().toISOString().split("T")[0];
      const todayRecord = sleepRecords.find((record) => record.date === today);

      if (todayRecord && todayRecord.sleepProgress !== undefined) {
        setSleepPercentage(todayRecord.sleepProgress);
      } else {
        setSleepPercentage(0);
      }

      const vaccProgress = await VaccinationService.getVaccinationProgress(
        childId
      );
      setVaccinationProgress(vaccProgress?.percentage || 0);

      const latestRecord = await GrowthService.getLatestGrowthRecord(childId);
      if (latestRecord) {
        const heightProgressValue = latestRecord.heightProgress || 0;
        const weightProgressValue = latestRecord.weightProgress || 0;
        const headCircProgressValue =
          latestRecord.headCircumferenceProgress || 0;

        setHeightProgress(heightProgressValue);
        setWeightProgress(weightProgressValue);
        setHeadCircProgress(headCircProgressValue);

        setLatestGrowthRecord(latestRecord);
      } else {
        setHeightProgress(0);
        setWeightProgress(0);
        setHeadCircProgress(0);
        setLatestGrowthRecord(null);
      }

      try {
        const diaperChanges = await getDiaperChanges(childId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayDiapers = diaperChanges.filter((diaper) => {
          const diaperDate = new Date(diaper.date);
          diaperDate.setHours(0, 0, 0, 0);
          return diaperDate.getTime() === today.getTime();
        });

        setDiaperCount(todayDiapers.length);
      } catch (error) {
        console.error("Error fetching diaper data:", error);
        setDiaperCount(0);
      }

      try {
        const feedingData = await feedingService.getTodayFeedingData(childId);

        const breastData = feedingData.filter(
          (item) => item.type === "breast"
        ).length;
        const bottleData = feedingData.filter(
          (item) => item.type === "bottle"
        ).length;
        const solidData = feedingData.filter(
          (item) => item.type === "solid"
        ).length;

        setBreastfeedingCount(breastData);
        setBottlefeedingCount(bottleData);
        setSolidfoodCount(solidData);
      } catch (error) {
        console.error("Error fetching feeding data:", error);
        setBreastfeedingCount(0);
        setBottlefeedingCount(0);
        setSolidfoodCount(0);
      }
    } catch (error) {
      console.error("Error fetching data for child:", error);
    }
  }, []);

  const handleSelectChild = useCallback(
    (childId) => {
      console.log(`Attempting to switch to child with ID: ${childId}`);

      const childExists = localChildren.some(
        (child) => String(child.id) === String(childId)
      );

      if (!childExists) {
        console.warn(
          `Child with ID ${childId} not found in local children list`
        );
        return;
      }

      setSleepPercentage(0);
      setVaccinationProgress(0);
      setLatestGrowthRecord(null);
      setDiaperCount(0);

      const success = switchChild(childId);
      if (success) {
        setTimeout(() => {
          console.log("Fetching data for newly selected child:", childId);
          fetchDataForChild(childId);
        }, 300);
      }
      console.log(`Switch child result: ${success ? "success" : "failed"}`);

      setShowChildSwitcherModal(false);
    },
    [switchChild, localChildren, fetchDataForChild]
  );

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

      const today = new Date().toISOString().split("T")[0];
      const todayRecord = records.find((record) => record.date === today);

      if (todayRecord && todayRecord.sleepProgress !== undefined) {
        setSleepPercentage(todayRecord.sleepProgress);
      } else {
        setSleepPercentage(0);
      }
    } catch (error) {
      console.error("Error fetching sleep data:", error);
      setSleepPercentage(0);
    }
  }, [currentChild]);

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

  const fetchGrowthProgress = useCallback(async () => {
    try {
      console.log(`Fetching growth data for child ID: ${currentChild.id}`);

      const latestRecord = await GrowthService.getLatestGrowthRecord(
        currentChild.id
      );

      if (latestRecord) {
        console.log("Latest growth record:", latestRecord);

        const heightProgressValue = latestRecord.heightProgress || 0;
        const weightProgressValue = latestRecord.weightProgress || 0;
        const headCircProgressValue =
          latestRecord.headCircumferenceProgress || 0;

        setHeightProgress(heightProgressValue);
        setWeightProgress(weightProgressValue);
        setHeadCircProgress(headCircProgressValue);

        setLatestGrowthRecord(latestRecord);
      } else {
        console.log("No growth records found");
        setHeightProgress(0);
        setWeightProgress(0);
        setHeadCircProgress(0);
        setLatestGrowthRecord(null);
      }
    } catch (error) {
      console.error("Error fetching growth data:", error);
    }
  }, [currentChild]);

  const fetchDiaperData = useCallback(async () => {
    try {
      console.log(`Fetching diaper data for child ID: ${currentChild.id}`);
      const diaperChanges = await getDiaperChanges(currentChild.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayDiapers = diaperChanges.filter((diaper) => {
        const diaperDate = new Date(diaper.date);
        diaperDate.setHours(0, 0, 0, 0);
        return diaperDate.getTime() === today.getTime();
      });

      setDiaperCount(todayDiapers.length);
    } catch (error) {
      console.error("Error fetching diaper data:", error);
      setDiaperCount(0);
    }
  }, [currentChild]);

  const fetchFeedingData = useCallback(async () => {
    try {
      console.log(`Fetching feeding data for child ID: ${currentChild.id}`);

      const feedingData = await feedingService.getTodayFeedingData(
        currentChild.id
      );

      const breastData = feedingData.filter(
        (item) => item.type === "breast"
      ).length;
      const bottleData = feedingData.filter(
        (item) => item.type === "bottle"
      ).length;
      const solidData = feedingData.filter(
        (item) => item.type === "solid"
      ).length;

      setBreastfeedingCount(breastData);
      setBottlefeedingCount(bottleData);
      setSolidfoodCount(solidData);
    } catch (error) {
      console.error("Error fetching feeding data:", error);
      setBreastfeedingCount(0);
      setBottlefeedingCount(0);
      setSolidfoodCount(0);
    }
  }, [currentChild]);

  useEffect(() => {
    setSleepPercentage(0);
    setVaccinationProgress(0);
    setLatestGrowthRecord(null);
    setDiaperCount(0);
    setBreastfeedingCount(0);
    setBottlefeedingCount(0);
    setSolidfoodCount(0);

    if (currentChild && currentChild.id !== "default") {
      fetchSleepData();
      fetchVaccinationProgress();
      fetchGrowthProgress();
      fetchDiaperData();
      fetchFeedingData();
    }
  }, [
    currentChild,
    currentChildId,
    fetchSleepData,
    fetchVaccinationProgress,
    fetchGrowthProgress,
    fetchDiaperData,
    fetchFeedingData,
  ]);

  useEffect(() => {
    setShowAddChildPrompt(noChildren);
  }, [noChildren]);

  useEffect(() => {
    if (showChildSwitcherModal) {
      console.log("Child switcher modal opened, refreshing children data");
      setLocalChildren([...children]);
    }
  }, [showChildSwitcherModal, children]);

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

    updateCurrentScreen("Activity");
  }, [navigation, theme, currentChild, noChildren, updateCurrentScreen]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("Activity screen focused, refreshing data");
      setLocalChildren([...children]);

      if (currentChild && currentChild.id !== "default") {
        fetchDataForChild(currentChild.id);
      }
    });

    return unsubscribe;
  }, [navigation, children, currentChild, fetchDataForChild]);

  const renderActivityCard = useCallback(
    (item, index) => {
      if (item.title === "Sleep") {
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
              {item.trend && (
                <View style={styles.trendIconContainer}>
                  <View
                    style={[
                      styles.trendIconBackground,
                      {
                        backgroundColor:
                          sleepPercentage > 0 ? "#4CD964" : "#FF3B30",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        sleepPercentage >= 0 ? "trending-up" : "trending-down"
                      }
                      size={iconSize}
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
              <View style={styles.trendIconContainer}>
                <View
                  style={[
                    styles.trendIconBackground,
                    {
                      backgroundColor: "#007AFF",
                    },
                  ]}
                >
                  <Ionicons name="medical" size={iconSize} color="#FFFFFF" />
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

      if (item.title === "Growth") {
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
              <View style={styles.growthProgressContainer}>
                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor:
                        heightProgress > 0
                          ? getProgressColor(heightProgress, theme)
                          : "#FF3B30",
                    },
                  ]}
                >
                  <Ionicons
                    name="resize-outline"
                    size={smallIconSize}
                    color="#FFFFFF"
                  />
                  <Text style={styles.growthBadgeText}>
                    {heightProgress > 0
                      ? `+${heightProgress}%`
                      : `${heightProgress}%`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor:
                        weightProgress > 0
                          ? getProgressColor(weightProgress, theme)
                          : "#FF3B30",
                    },
                  ]}
                >
                  <Ionicons
                    name="barbell-outline"
                    size={smallIconSize}
                    color="#FFFFFF"
                  />
                  <Text style={styles.growthBadgeText}>
                    {weightProgress > 0
                      ? `+${weightProgress}%`
                      : `${weightProgress}%`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor:
                        headCircProgress > 0
                          ? getProgressColor(headCircProgress, theme)
                          : "#FF3B30",
                    },
                  ]}
                >
                  <Ionicons
                    name="ellipse-outline"
                    size={smallIconSize}
                    color="#FFFFFF"
                  />
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

      if (item.title === "Music") {
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
              <View style={styles.trendIconContainer}>
                <View
                  style={[
                    styles.musicIconBackground,
                    {
                      backgroundColor: "#007AFF",
                    },
                  ]}
                >
                  <Ionicons
                    name="musical-notes"
                    size={iconSize}
                    color="#FFFFFF"
                  />
                  <Ionicons
                    name="musical-note"
                    size={iconSize}
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

      if (item.title === "Diaper") {
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
              <View style={styles.trendIconContainer}>
                <View
                  style={[
                    styles.trendIconBackground,
                    {
                      backgroundColor: diaperCount > 0 ? "#00B4D8" : "#FF3B30",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="human-baby-changing-table"
                    size={iconSize}
                    color="#FFFFFF"
                  />
                  <Text style={styles.trendText}>{diaperCount}</Text>
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

      if (item.title === "Feeding") {
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
              <View style={styles.feedingStatsContainer}>
                <View
                  style={[
                    styles.feedingStatBadge,
                    {
                      backgroundColor:
                        breastfeedingCount > 0 ? "#FF9500" : "#FF3B30",
                    },
                  ]}
                >
                  <FontAwesome6
                    name="person-breastfeeding"
                    size={smallIconSize}
                    color="#FFFFFF"
                  />
                  <Text style={styles.feedingStatText}>
                    {breastfeedingCount}
                  </Text>
                </View>

                <View
                  style={[
                    styles.feedingStatBadge,
                    {
                      backgroundColor:
                        bottlefeedingCount > 0 ? "#5A87FF" : "#FF3B30",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="baby-bottle-outline"
                    size={smallIconSize}
                    color="#FFFFFF"
                  />
                  <Text style={styles.feedingStatText}>
                    {bottlefeedingCount}
                  </Text>
                </View>

                <View
                  style={[
                    styles.feedingStatBadge,
                    {
                      backgroundColor:
                        solidfoodCount > 0 ? "#4CD964" : "#FF3B30",
                    },
                  ]}
                >
                  <Ionicons
                    name="nutrition"
                    size={smallIconSize}
                    color="#FFFFFF"
                  />
                  <Text style={styles.feedingStatText}>{solidfoodCount}</Text>
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
              {item.trend && (
                <View style={styles.trendIconContainer}>
                  <View
                    style={[
                      styles.trendIconBackground,
                      {
                        backgroundColor:
                          item.title === "Health"
                            ? "#007AFF"
                            : item.title === "Music"
                            ? "#007AFF"
                            : item.trend === "up" ||
                              (item.trendValue &&
                                Number.parseFloat(item.trendValue) > 0)
                            ? "#4CD964"
                            : "#FF3B30",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        item.trend === "up" ? "trending-up" : "trending-down"
                      }
                      size={iconSize}
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
          {item.trend && (
            <View style={styles.trendIconContainer}>
              <View
                style={[
                  styles.trendIconBackground,
                  {
                    backgroundColor:
                      item.title === "Health"
                        ? "#007AFF"
                        : item.title === "Music"
                        ? "#007AFF"
                        : item.trend === "up" ||
                          (item.trendValue &&
                            Number.parseFloat(item.trendValue) > 0)
                        ? "#4CD964"
                        : "#FF3B30",
                  },
                ]}
              >
                <Ionicons
                  name={item.trend === "up" ? "trending-up" : "trending-down"}
                  size={iconSize}
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
      diaperCount,
      breastfeedingCount,
      bottlefeedingCount,
      solidfoodCount,
      iconSize,
      smallIconSize,
    ]
  );

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

const styles = StyleSheet.create({
  growthProgressContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    zIndex: 10,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    minWidth: 28,
    justifyContent: "center",
  },
  growthBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 2,
    flexShrink: 1,
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
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  imageCardSubtitle: {
    fontSize: 11,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
  },
  trendIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  trendIconBackground: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    minWidth: 28,
    justifyContent: "center",
  },
  trendText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 2,
    flexShrink: 1,
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
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    minWidth: 28,
    justifyContent: "center",
  },
  trebleClefIcon: {
    marginLeft: 2,
  },
  smallChildImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  feedingIconsContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    zIndex: 10,
  },
  feedingIconBackground: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  feedingStatsContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    zIndex: 10,
  },
  feedingStatBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    minWidth: 28,
    justifyContent: "center",
  },
  feedingStatText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 2,
    flexShrink: 1,
  },
});

export default ActivityScreen;
