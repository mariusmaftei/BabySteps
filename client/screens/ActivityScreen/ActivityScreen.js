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

// Constants for icon sizes
const ICON_SIZE = isSmallDevice ? 9 : 11;
const SMALL_ICON_SIZE = isSmallDevice ? 8 : 9;

// Extracted component for child switcher item
const ChildSwitcherItem = React.memo(
  ({ child, currentChildId, theme, onSelect, getChildImageSource }) => {
    const isSelected = String(child.id) === String(currentChildId);

    return (
      <TouchableOpacity
        style={[
          styles.childSwitcherItem,
          isSelected && { backgroundColor: `${theme.primary}15` },
          { borderBottomColor: theme.borderLight },
        ]}
        onPress={() => onSelect(child.id)}
      >
        <Image
          source={getChildImageSource(child)}
          style={styles.childSwitcherImage}
          defaultSource={defaultChildImage}
        />
        <View style={styles.childSwitcherInfo}>
          <Text style={[styles.childSwitcherName, { color: theme.text }]}>
            {child.name}
          </Text>
          <Text
            style={[styles.childSwitcherAge, { color: theme.textSecondary }]}
          >
            {child.age}
          </Text>
        </View>
        {isSelected && (
          <View
            style={[
              styles.currentChildIndicator,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

// Extracted component for activity card
const ActivityCard = React.memo(({ item, index, onPress, renderContent }) => {
  return (
    <TouchableOpacity
      key={index}
      style={[styles.card, { shadowColor: "#000" }]}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      {renderContent(item)}
    </TouchableOpacity>
  );
});

function ActivityScreen({ navigation }) {
  console.log("ActivityScreen - Component initializing");
  const { theme } = useTheme();
  const { currentChild, currentChildId, children, switchChild } =
    useChildActivity();
  const { updateCurrentScreen } = useNotification();

  // State management
  const [showChildSwitcherModal, setShowChildSwitcherModal] = useState(false);
  const [localChildren, setLocalChildren] = useState([]);
  const [showAddChildPrompt, setShowAddChildPrompt] = useState(false);

  // Activity data state - consolidated into a single object
  const [activityData, setActivityData] = useState({
    sleep: {
      records: [],
      percentage: 0,
    },
    vaccination: {
      progress: 0,
    },
    growth: {
      height: 0,
      weight: 0,
      headCirc: 0,
      latestRecord: null,
    },
    diaper: {
      count: 0,
    },
    feeding: {
      breast: 0,
      bottle: 0,
      solid: 0,
    },
    music: {
      percentage: 75,
    },
  });

  // Derived state
  const noChildren = !currentChild || currentChild.id === "default";

  // Memoized functions
  const getChildImageSource = useCallback((child) => {
    if (!child) return defaultChildImage;
    if (child.imageSrc && child.imageSrc !== "default") {
      return { uri: child.imageSrc };
    } else if (child.image && child.image !== "default") {
      return { uri: child.image };
    }
    return defaultChildImage;
  }, []);

  // Count red icons for mood determination
  const countRedIcons = useMemo(() => {
    let count = 0;
    const { sleep, growth, diaper, feeding } = activityData;

    if (sleep.percentage <= 0) count++;
    if (growth.height <= 0 || growth.weight <= 0 || growth.headCirc <= 0)
      count++;
    if (diaper.count <= 0) count++;
    if (feeding.breast <= 0 && feeding.bottle <= 0 && feeding.solid <= 0)
      count++;

    return count;
  }, [activityData]);

  const isHappyMood = useMemo(() => countRedIcons < 2, [countRedIcons]);
  const getMoodImage = useMemo(
    () => (isHappyMood ? happyChildImage : sadChildImage),
    [isHappyMood]
  );

  // Activity cards data
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
        trend: "dynamic",
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
        trend: "dynamic",
        screen: "FeedingScreen",
      },
      {
        title: "Growth",
        subtitle: "Track development",
        icon: "trending-up",
        color: "#4CD964",
        gradient: ["#4CD964", "#7AE28C"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/child-growth.jpg-UWt4Kw8CtpknvXrh0f4NDTDbNovWuy.jpeg",
        trend: "dynamic",
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
        trend: "dynamic",
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
        trend: "dynamic",
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
        screen: "MusicScreen",
      },
    ],
    []
  );

  // Handlers
  const handleCardPress = useCallback(
    (item) => {
      if (item.screen) {
        navigation.navigate(item.screen);
      }
    },
    [navigation]
  );

  const fetchDataForChild = useCallback(async (childId) => {
    try {
      // Reset data first
      setActivityData((prev) => ({
        ...prev,
        sleep: { ...prev.sleep, percentage: 0 },
        vaccination: { progress: 0 },
        growth: { height: 0, weight: 0, headCirc: 0, latestRecord: null },
        diaper: { count: 0 },
        feeding: { breast: 0, bottle: 0, solid: 0 },
      }));

      // Fetch sleep data
      const sleepRecords = await fetchSleepRecords(childId);
      console.log("📊 ActivityScreen - Sleep records fetched:", sleepRecords);
      const today = new Date().toISOString().split("T")[0];
      console.log("📊 ActivityScreen - Today's date:", today);

      // Extract date from datetime string for comparison
      const todayRecord = sleepRecords.find((record) => {
        const recordDate = record.date ? record.date.split(" ")[0] : null;
        console.log(
          "📊 ActivityScreen - Comparing record date:",
          recordDate,
          "with today:",
          today
        );
        return recordDate === today;
      });

      console.log(
        "📊 ActivityScreen - Today's sleep record found:",
        todayRecord
      );
      const sleepPercentage = todayRecord?.sleepProgress || 0;
      console.log("📊 ActivityScreen - Sleep percentage:", sleepPercentage);

      // Fetch vaccination data
      const vaccProgress = await VaccinationService.getVaccinationProgress(
        childId
      );

      // Fetch growth data
      const latestRecord = await GrowthService.getLatestGrowthRecord(childId);
      const heightProgress = latestRecord?.heightProgress || 0;
      const weightProgress = latestRecord?.weightProgress || 0;
      const headCircProgress = latestRecord?.headCircumferenceProgress || 0;

      // Fetch diaper data
      const diaperChanges = await getDiaperChanges(childId);
      const today2 = new Date();
      today2.setHours(0, 0, 0, 0);
      const todayDiapers = diaperChanges.filter((diaper) => {
        const diaperDate = new Date(diaper.date);
        diaperDate.setHours(0, 0, 0, 0);
        return diaperDate.getTime() === today2.getTime();
      });

      // Fetch feeding data
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

      // Update all data at once
      setActivityData({
        sleep: {
          records: sleepRecords,
          percentage: sleepPercentage,
        },
        vaccination: {
          progress: vaccProgress?.percentage || 0,
        },
        growth: {
          height: heightProgress,
          weight: weightProgress,
          headCirc: headCircProgress,
          latestRecord,
        },
        diaper: {
          count: todayDiapers.length,
        },
        feeding: {
          breast: breastData,
          bottle: bottleData,
          solid: solidData,
        },
        music: {
          percentage: 75, // Default value
        },
      });
    } catch (error) {
      console.error("Error fetching data for child:", error);
    }
  }, []);

  const handleSelectChild = useCallback(
    (childId) => {
      const childExists = localChildren.some(
        (child) => String(child.id) === String(childId)
      );
      if (!childExists) return;

      // Reset activity data
      setActivityData((prev) => ({
        ...prev,
        sleep: { ...prev.sleep, percentage: 0 },
        vaccination: { progress: 0 },
        growth: { height: 0, weight: 0, headCirc: 0, latestRecord: null },
        diaper: { count: 0 },
        feeding: { breast: 0, bottle: 0, solid: 0 },
      }));

      const success = switchChild(childId);
      if (success) {
        setTimeout(() => fetchDataForChild(childId), 300);
      }

      setShowChildSwitcherModal(false);
    },
    [switchChild, localChildren, fetchDataForChild]
  );

  // Render activity card content - extracted for better organization
  const renderActivityCardContent = useCallback(
    (item) => {
      const { sleep, vaccination, growth, diaper, feeding, music } =
        activityData;

      if (item.title === "Sleep") {
        return (
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
                    backgroundColor:
                      sleep.percentage > 0 ? "#4CD964" : "#FF3B30",
                  },
                ]}
              >
                <Ionicons
                  name={sleep.percentage >= 0 ? "trending-up" : "trending-down"}
                  size={ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.trendText}>
                  {sleep.percentage >= 0
                    ? `+${sleep.percentage}%`
                    : `${sleep.percentage}%`}
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
        );
      }

      if (item.title === "Health") {
        return (
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
                  { backgroundColor: "#007AFF" },
                ]}
              >
                <Ionicons name="medical" size={ICON_SIZE} color="#FFFFFF" />
                <Text style={styles.trendText}>{vaccination.progress}%</Text>
              </View>
            </View>
            <View style={styles.imageTextContainer}>
              <Text style={styles.imageCardTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </ImageBackground>
        );
      }

      if (item.title === "Growth") {
        return (
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
                      growth.height > 0
                        ? getProgressColor(growth.height, theme)
                        : "#FF3B30",
                  },
                ]}
              >
                <Ionicons
                  name="resize-outline"
                  size={SMALL_ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.growthBadgeText}>
                  {growth.height > 0
                    ? `+${growth.height}%`
                    : `${growth.height}%`}
                </Text>
              </View>
              <View
                style={[
                  styles.growthBadge,
                  {
                    backgroundColor:
                      growth.weight > 0
                        ? getProgressColor(growth.weight, theme)
                        : "#FF3B30",
                  },
                ]}
              >
                <Ionicons
                  name="barbell-outline"
                  size={SMALL_ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.growthBadgeText}>
                  {growth.weight > 0
                    ? `+${growth.weight}%`
                    : `${growth.weight}%`}
                </Text>
              </View>
              <View
                style={[
                  styles.growthBadge,
                  {
                    backgroundColor:
                      growth.headCirc > 0
                        ? getProgressColor(growth.headCirc, theme)
                        : "#FF3B30",
                  },
                ]}
              >
                <Ionicons
                  name="ellipse-outline"
                  size={SMALL_ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.growthBadgeText}>
                  {growth.headCirc > 0
                    ? `+${growth.headCirc}%`
                    : `${growth.headCirc}%`}
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
        );
      }

      if (item.title === "Music") {
        return (
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
                  { backgroundColor: "#007AFF" },
                ]}
              >
                <Ionicons
                  name="musical-notes"
                  size={ICON_SIZE}
                  color="#FFFFFF"
                />
                <Ionicons
                  name="musical-note"
                  size={ICON_SIZE}
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
        );
      }

      if (item.title === "Diaper") {
        return (
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
                  { backgroundColor: diaper.count > 0 ? "#00B4D8" : "#FF3B30" },
                ]}
              >
                <MaterialCommunityIcons
                  name="human-baby-changing-table"
                  size={ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.trendText}>{diaper.count}</Text>
              </View>
            </View>
            <View style={styles.imageTextContainer}>
              <Text style={styles.imageCardTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </ImageBackground>
        );
      }

      if (item.title === "Feeding") {
        return (
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
                    backgroundColor: feeding.breast > 0 ? "#FF9500" : "#FF3B30",
                  },
                ]}
              >
                <FontAwesome6
                  name="person-breastfeeding"
                  size={SMALL_ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.feedingStatText}>{feeding.breast}</Text>
              </View>
              <View
                style={[
                  styles.feedingStatBadge,
                  {
                    backgroundColor: feeding.bottle > 0 ? "#5A87FF" : "#FF3B30",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="baby-bottle-outline"
                  size={SMALL_ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.feedingStatText}>{feeding.bottle}</Text>
              </View>
              <View
                style={[
                  styles.feedingStatBadge,
                  {
                    backgroundColor: feeding.solid > 0 ? "#4CD964" : "#FF3B30",
                  },
                ]}
              >
                <Ionicons
                  name="nutrition"
                  size={SMALL_ICON_SIZE}
                  color="#FFFFFF"
                />
                <Text style={styles.feedingStatText}>{feeding.solid}</Text>
              </View>
            </View>
            <View style={styles.imageTextContainer}>
              <Text style={styles.imageCardTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </ImageBackground>
        );
      }

      // Default image card
      return (
        <ImageBackground
          source={{ uri: item.image }}
          style={styles.cardBackground}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          <View style={styles.imageTextContainer}>
            <Text style={styles.imageCardTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </ImageBackground>
      );
    },
    [activityData, theme, ICON_SIZE, SMALL_ICON_SIZE]
  );

  // Child switcher modal - memoized to prevent re-renders
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
                shadowColor: "#000",
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
                localChildren.map((child) => (
                  <ChildSwitcherItem
                    key={child.id}
                    child={child}
                    currentChildId={currentChildId}
                    theme={theme}
                    onSelect={handleSelectChild}
                    getChildImageSource={getChildImageSource}
                  />
                ))
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
              <View style={styles.buttonContent}>
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
      handleSelectChild,
      getChildImageSource,
      navigation,
    ]
  );

  // Effects
  useEffect(() => {
    if (children && Array.isArray(children)) {
      setLocalChildren(children);
    }
  }, [children]);

  useEffect(() => {
    setShowAddChildPrompt(noChildren);
  }, [noChildren]);

  useEffect(() => {
    if (showChildSwitcherModal) {
      setLocalChildren([...children]);
    }
  }, [showChildSwitcherModal, children]);

  useEffect(() => {
    if (currentChild && currentChild.id !== "default") {
      fetchDataForChild(currentChild.id);
    }
  }, [currentChild, currentChildId, fetchDataForChild]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setLocalChildren([...children]);
      if (currentChild && currentChild.id !== "default") {
        fetchDataForChild(currentChild.id);
      }
      console.log("ActivityScreen - Focus listener activated");
    });
    return unsubscribe;
  }, [navigation, children, currentChild, fetchDataForChild]);

  // Header configuration
  React.useLayoutEffect(() => {
    const title = noChildren
      ? "Add a Child"
      : `${currentChild.name.split(" ")[0]}'s Activity`;

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
      title,
      headerTitle: () => (
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
      ),
    });

    updateCurrentScreen("Activity");
  }, [navigation, theme, currentChild, noChildren, updateCurrentScreen]);

  // Render
  console.log("ActivityScreen - Rendering UI");
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
              />
              <View style={styles.smallImageContainer}>
                <Image
                  source={getMoodImage}
                  style={styles.smallChildImage}
                  resizeMode="contain"
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
            {activityCards.map((item, index) => (
              <ActivityCard
                key={`${item.title}-${index}`}
                item={item}
                index={index}
                onPress={handleCardPress}
                renderContent={renderActivityCardContent}
              />
            ))}
          </View>
        </ScrollView>
      )}
      {childSwitcherModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Layout styles
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Header styles
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
    width: "100%",
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
  headerButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  // Profile image styles
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // Card styles
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

  // Icon and badge styles
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

  // Modal styles
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

  // Child switcher styles
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

  // No child styles
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
  noChildrenText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },

  // Button styles
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
  addChildText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    textAlign: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ActivityScreen;
