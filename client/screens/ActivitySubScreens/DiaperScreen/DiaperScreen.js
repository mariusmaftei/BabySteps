import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";
import {
  getDiaperChanges,
  createDiaperChange,
  deleteDiaperChange,
} from "../../../services/diaper-service";
import { useAuth } from "../../../context/auth-context";

import ChildInfoCard from "../../../components/UI/Cards/ChildInfoCard";
import ChildRecommendationCard from "../../../components/UI/Cards/ChildRecommendationCard";
import RecentActivityCard from "../../../components/UI/Cards/RecentActivityCard";

import ColumnChart from "../../../components/UI/Charts/ColumnChart";
const screenWidth = Dimensions.get("window").width;

export default function DiaperScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  // Fix: Correctly destructure token from useAuth instead of authState
  const { token } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Get child's age as a number for recommendations
  const childAgeText = currentChild.age;
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;

  // Diaper change state
  const [diaperChanges, setDiaperChanges] = useState([]);
  const [changeDate, setChangeDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedType, setSelectedType] = useState(null); // 'wet', 'dirty', 'both'
  const [selectedColor, setSelectedColor] = useState(null); // 'yellow', 'green', 'brown', 'black'
  const [selectedConsistency, setSelectedConsistency] = useState(null); // 'soft', 'firm', 'watery'
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch diaper changes from the API
  const fetchDiaperChanges = useCallback(async () => {
    if (!currentChild || !currentChild.id) {
      console.log("No current child selected");
      setLoading(false);
      return;
    }

    if (!token) {
      console.log("No authentication token available");
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // No need to pass token here, it's handled by the API interceptors
      const data = await getDiaperChanges(currentChild.id);

      // Check if data is an array before mapping
      if (Array.isArray(data)) {
        // Convert date strings to Date objects
        const processedData = data.map((change) => ({
          ...change,
          date: new Date(change.date),
        }));
        setDiaperChanges(processedData);
      } else {
        console.error("Expected array of diaper changes, got:", data);
        setDiaperChanges([]);
        setError("Failed to load diaper changes. Invalid data format.");
      }
    } catch (err) {
      console.error("Failed to fetch diaper changes:", err);
      setError("Failed to load diaper changes. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentChild, token]);

  // Load diaper changes on component mount and when currentChild changes
  useEffect(() => {
    fetchDiaperChanges();
  }, [fetchDiaperChanges]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiaperChanges();
  }, [fetchDiaperChanges]);

  // Diaper change recommendations based on age
  const getDiaperRecommendations = (ageInMonths) => {
    if (ageInMonths < 1) {
      // 0-1 month
      return {
        ageGroup: `Newborn (${
          childAgeInMonths < 1 ? childAgeInMonths.toFixed(1) : childAgeInMonths
        } ${childAgeInMonths === 1 ? "month" : "months"})`,
        changesPerDay: "8-12 changes",
        minChanges: 8,
        maxChanges: 12,
        wetDiapers: "6-8 per day",
        dirtyDiapers: "3-4 per day",
        normalColors:
          "Yellow, green, brown, or black (meconium in first few days)",
        normalConsistency: "Soft or seedy (breastfed), Pasty (formula-fed)",
        warningColors: "White, red, or very dark black after first week",
        warningConsistency: "Watery, mucousy, or hard pellets",
        tips: [
          "Change diapers frequently to prevent diaper rash",
          "Clean thoroughly with gentle wipes or water",
          "Allow some air time between changes when possible",
          "Use diaper cream preventatively if redness appears",
        ],
      };
    } else if (ageInMonths >= 1 && ageInMonths < 6) {
      // 1-6 months
      return {
        ageGroup: `Infant (${childAgeInMonths} ${
          childAgeInMonths === 1 ? "month" : "months"
        })`,
        changesPerDay: "6-8 changes",
        minChanges: 6,
        maxChanges: 8,
        wetDiapers: "5-6 per day",
        dirtyDiapers: "1-4 per day (may decrease when starting solids)",
        normalColors: "Yellow, green, or brown",
        normalConsistency:
          "Soft or seedy (breastfed), More formed (formula-fed)",
        warningColors: "White, red, or black",
        warningConsistency: "Watery (multiple in a row), mucousy, or hard",
        tips: [
          "Establish a regular changing routine",
          "Always change before or after feedings and before bedtime",
          "Consider overnight diapers for longer sleep stretches",
          "Watch for signs of diaper rash and treat promptly",
        ],
      };
    } else if (ageInMonths >= 6 && ageInMonths < 12) {
      // 6-12 months
      return {
        ageGroup: `Older Infant (${childAgeInMonths} ${
          childAgeInMonths === 1 ? "month" : "months"
        })`,
        changesPerDay: "4-6 changes",
        minChanges: 4,
        maxChanges: 6,
        wetDiapers: "4-5 per day",
        dirtyDiapers: "1-2 per day (varies with solid food intake)",
        normalColors: "Brown, green, or yellow (varies with food)",
        normalConsistency: "More formed, varies with diet",
        warningColors: "White, red, or black",
        warningConsistency: "Watery (multiple in a row), mucousy, or very hard",
        tips: [
          "Diaper changes may be more challenging as baby becomes mobile",
          "Have toys ready to distract during changes",
          "Consider diaper size carefully as baby grows",
          "Diet changes will affect stool consistency and frequency",
        ],
      };
    } else {
      // 12+ months
      return {
        ageGroup:
          childAgeInMonths >= 24
            ? `Toddler (${childAgeInMonths / 12} ${
                childAgeInMonths === 12 ? "year" : "years"
              })`
            : `Toddler (${childAgeInMonths} months)`,
        changesPerDay: "4-5 changes",
        minChanges: 4,
        maxChanges: 5,
        wetDiapers: "3-4 per day",
        dirtyDiapers: "1-2 per day",
        normalColors: "Brown (varies with diet)",
        normalConsistency: "Formed, varies with diet",
        warningColors: "White, red, or black",
        warningConsistency: "Watery (multiple in a row), mucousy, or very hard",
        tips: [
          "Consider potty training readiness signs",
          "Involve toddler in the changing process",
          "Use standing changes for wiggly toddlers when appropriate",
          "Consider pull-ups for active toddlers or potty training",
        ],
      };
    }
  };

  const recommendations = getDiaperRecommendations(childAgeInMonths);

  // Handle date change
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || changeDate;
    setShowDatePicker(Platform.OS === "ios");
    setChangeDate(currentDate);
  };

  // Add new diaper change
  const addDiaperChange = async () => {
    if (!token) {
      Alert.alert("Error", "Authentication required. Please log in again.");
      return;
    }

    if (!selectedType) {
      Alert.alert("Error", "Please select a diaper type");
      return;
    }

    const needsColorAndConsistency =
      selectedType === "dirty" || selectedType === "both";

    if (needsColorAndConsistency && (!selectedColor || !selectedConsistency)) {
      Alert.alert(
        "Error",
        "Please select both color and consistency for dirty diapers"
      );
      return;
    }

    try {
      setSubmitting(true);

      const diaperData = {
        date: changeDate,
        type: selectedType,
        color: needsColorAndConsistency ? selectedColor : null,
        consistency: needsColorAndConsistency ? selectedConsistency : null,
        notes: notes || null,
      };

      // No need to pass token here, it's handled by the API interceptors
      const newChange = await createDiaperChange(currentChild.id, diaperData);

      // Add the new change to the state with a proper Date object
      setDiaperChanges([
        {
          ...newChange,
          date: new Date(newChange.date),
        },
        ...diaperChanges,
      ]);

      // Reset form
      setSelectedType(null);
      setSelectedColor(null);
      setSelectedConsistency(null);
      setChangeDate(new Date());
      setNotes("");

      Alert.alert("Success", "Diaper change recorded successfully");
    } catch (error) {
      console.error("Error adding diaper change:", error);
      Alert.alert("Error", "Failed to record diaper change. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete diaper change
  const handleDeleteDiaperChange = async (diaperChange) => {
    if (!token) {
      Alert.alert("Error", "Authentication required. Please log in again.");
      return;
    }

    try {
      // No need to pass token here, it's handled by the API interceptors
      await deleteDiaperChange(currentChild.id, diaperChange.id);

      // Remove the deleted change from state
      setDiaperChanges(
        diaperChanges.filter((change) => change.id !== diaperChange.id)
      );

      // Show success message
      Alert.alert("Success", "Diaper change deleted successfully");
    } catch (error) {
      console.error("Error deleting diaper change:", error);
      Alert.alert("Error", "Failed to delete diaper change. Please try again.");
    }
  };

  // Calculate today's diaper changes
  const getTodayChanges = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return diaperChanges.filter((change) => {
      const changeDate = new Date(change.date);
      return changeDate >= today;
    });
  };

  const todayChanges = getTodayChanges();
  const todayTotal = todayChanges.length;
  const isChangesEnough = todayTotal >= recommendations.minChanges;

  // Calculate the percentage of recommended changes
  const calculateChangesPercentage = () => {
    const percentage = Math.round(
      (todayTotal / recommendations.minChanges) * 100
    );
    return Math.min(percentage, 100);
  };

  const changesPercentage = calculateChangesPercentage();

  // Prepare data for pie chart
  const getPieChartData = () => {
    // Count types
    const wetCount = todayChanges.filter(
      (change) => change.type === "wet"
    ).length;
    const dirtyCount = todayChanges.filter(
      (change) => change.type === "dirty"
    ).length;
    const bothCount = todayChanges.filter(
      (change) => change.type === "both"
    ).length;

    const data = [];

    if (wetCount > 0) {
      data.push({
        name: "Wet",
        population: wetCount,
        color: "#5A87FF",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    if (dirtyCount > 0) {
      data.push({
        name: "Dirty",
        population: dirtyCount,
        color: "#FF9500",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    if (bothCount > 0) {
      data.push({
        name: "Both",
        population: bothCount,
        color: "#FF2D55",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    return data;
  };

  // Prepare data for color distribution chart (for dirty diapers) - Updated for ColumnChart
  const getColorChartData = () => {
    // Create poop icons with different colors - rearranged in order of most common stool colors
    const yellowPoopIcon = (
      <FontAwesome5 name="poo" size={16} color="#FFD700" />
    );
    const brownPoopIcon = <FontAwesome5 name="poo" size={16} color="#8B4513" />;
    const greenPoopIcon = <FontAwesome5 name="poo" size={16} color="#008000" />;
    const blackPoopIcon = <FontAwesome5 name="poo" size={16} color="#323232" />;

    // Initialize with default values for all colors - rearranged in order of most common
    const colorData = {
      labels: ["Yellow", "Brown", "Green", "Black"],
      data: [0, 0, 0, 0],
      colors: ["#FFD700", "#8B4513", "#008000", "#323232"],
      icons: [yellowPoopIcon, brownPoopIcon, greenPoopIcon, blackPoopIcon],
      unit: "",
    };

    // If we have diaperChanges data, update the values
    if (diaperChanges && diaperChanges.length > 0) {
      const today = new Date().toDateString();
      const todayChanges = diaperChanges.filter(
        (change) =>
          new Date(change.date).toDateString() === today &&
          (change.type === "dirty" || change.type === "both") &&
          change.color
      );

      // Count occurrences of each color - updated to match new order
      todayChanges.forEach((change) => {
        if (change.color.toLowerCase() === "yellow") {
          colorData.data[0] += 1; // Yellow is now index 0
        } else if (change.color.toLowerCase() === "brown") {
          colorData.data[1] += 1; // Brown is now index 1
        } else if (change.color.toLowerCase() === "green") {
          colorData.data[2] += 1; // Green is now index 2
        } else if (change.color.toLowerCase() === "black") {
          colorData.data[3] += 1; // Black is now index 3
        }
      });
    }

    return colorData;
  };

  // Update the getDiaperTypeData function to handle undefined data
  const getDiaperTypeData = () => {
    const typeData = [
      { name: "Wet", value: 0, color: "#4682B4", icon: "💧" },
      { name: "Soiled", value: 0, color: "#8B4513", icon: "💩" },
      { name: "Both", value: 0, color: "#9370DB", icon: "💧💩" },
    ];

    // If we have diaperChanges data, update the values
    if (diaperChanges && diaperChanges.length > 0) {
      const today = new Date().toDateString();
      const todayChanges = diaperChanges.filter((change) =>
        new Date(change.date).toDateString()
      );

      // Count occurrences of each type
      todayChanges.forEach((change) => {
        if (change.type === "both") {
          typeData[2].value += 1; // Both
        } else if (change.type === "wet") {
          typeData[0].value += 1; // Wet
        } else if (change.type === "dirty") {
          typeData[1].value += 1; // Soiled
        }
      });
    }

    return typeData;
  };

  // Additional validation to ensure colorChartData has all required properties
  const colorChartData = getColorChartData();
  const isValidChartData =
    colorChartData &&
    Array.isArray(colorChartData.labels) &&
    Array.isArray(colorChartData.data) &&
    Array.isArray(colorChartData.colors) &&
    Array.isArray(colorChartData.icons) &&
    colorChartData.labels.length > 0;

  // Format time for display
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for display
  const formatDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const changeDate = new Date(date);
    changeDate.setHours(0, 0, 0, 0);

    if (changeDate.getTime() === today.getTime()) {
      return "Today";
    } else if (changeDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return changeDate.toLocaleDateString();
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
      title: `${currentChild.name.split(" ")[0]}'s Diaper Details`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading diaper changes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={theme.danger}
          />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if we have any dirty diapers with color data
  const hasColorData = diaperChanges.some(
    (change) =>
      (change.type === "dirty" || change.type === "both") && change.color
  );

  // Get color chart data if we have dirty diapers

  // Additional validation to ensure colorChartData has all required properties

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Child Info Card */}
        <ChildInfoCard
          childData={currentChild}
          screenType="diaper"
          customIcon={
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.primary}
            />
          }
          customTitle="Child Information"
        />

        {/* Recommendations Card */}
        <ChildRecommendationCard
          recommendations={recommendations.tips}
          itemsToAvoid={[
            recommendations.warningColors,
            recommendations.warningConsistency,
            "Leaving wet or soiled diapers on for extended periods",
            "Harsh soaps or cleansers on the diaper area",
          ]}
          screenType="diaper"
        />

        {/* Diaper Type Distribution Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="pie-chart"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Diaper Type Distribution
            </Text>
          </View>

          {getPieChartData().length > 0 ? (
            <PieChart
              data={getPieChartData()}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                backgroundGradientFrom: theme.cardBackground,
                backgroundGradientTo: theme.cardBackground,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Ionicons
                name="analytics-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text
                style={[styles.emptyChartText, { color: theme.textSecondary }]}
              >
                No diaper changes recorded today
              </Text>
            </View>
          )}
        </View>

        {/* Color Distribution Chart (for dirty diapers) - Using ColumnChart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="color-palette"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Stool Color Distribution
            </Text>
          </View>

          <ColumnChart
            data={getColorChartData()}
            height={220}
            width={screenWidth - 64}
            showValues={true}
            showValuesOnTop={true}
            showLegend={true}
            showGridLines={true}
            showTargetLegend={false}
          />
        </View>

        {/* Add New Diaper Change */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.inputTitle, { color: theme.text }]}>
            Record Diaper Change
          </Text>
          <Text style={[styles.inputSubtitle, { color: theme.textSecondary }]}>
            Log details about the most recent diaper change
          </Text>

          {/* Date/Time Picker */}
          <View style={styles.dateTimeContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Time of Change
            </Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.borderLight,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.primary}
                style={styles.dateTimeIcon}
              />
              <Text style={[styles.dateTimeText, { color: theme.text }]}>
                {changeDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <Modal
                transparent={true}
                visible={showDatePicker}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <View
                    style={[
                      styles.timePickerContainer,
                      { backgroundColor: theme.cardBackground },
                    ]}
                  >
                    <Text
                      style={[styles.timePickerTitle, { color: theme.text }]}
                    >
                      Select Time
                    </Text>
                    <View style={styles.timePickerContent}>
                      <CustomTimePicker
                        initialTime={changeDate}
                        onTimeSelected={(newTime) => {
                          setChangeDate(newTime);
                          setShowDatePicker(false);
                        }}
                        onCancel={() => setShowDatePicker(false)}
                        theme={theme}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
          </View>

          {/* Diaper Type Selection */}
          <View style={styles.typeSelectionContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Diaper Type
            </Text>
            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      selectedType === "wet"
                        ? "#5A87FF20"
                        : theme.backgroundSecondary,
                    borderColor:
                      selectedType === "wet" ? "#5A87FF" : theme.borderLight,
                  },
                ]}
                onPress={() => setSelectedType("wet")}
              >
                <Ionicons
                  name="water"
                  size={20}
                  color={
                    selectedType === "wet" ? "#5A87FF" : theme.textSecondary
                  }
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: selectedType === "wet" ? "#5A87FF" : theme.text },
                  ]}
                >
                  💦 Wet (Urine only)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      selectedType === "dirty"
                        ? "#FF950020"
                        : theme.backgroundSecondary,
                    borderColor:
                      selectedType === "dirty" ? "#FF9500" : theme.borderLight,
                  },
                ]}
                onPress={() => setSelectedType("dirty")}
              >
                <Ionicons
                  name="warning"
                  size={20}
                  color={
                    selectedType === "dirty" ? "#FF9500" : theme.textSecondary
                  }
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeText,
                    {
                      color: selectedType === "dirty" ? "#FF9500" : theme.text,
                    },
                  ]}
                >
                  <FontAwesome5 name="poo" size={16} /> Dirty (Poop)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      selectedType === "both"
                        ? "#FF2D5520"
                        : theme.backgroundSecondary,
                    borderColor:
                      selectedType === "both" ? "#FF2D55" : theme.borderLight,
                  },
                ]}
                onPress={() => setSelectedType("both")}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={
                    selectedType === "both" ? "#FF2D55" : theme.textSecondary
                  }
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: selectedType === "both" ? "#FF2D55" : theme.text },
                  ]}
                >
                  💦 <FontAwesome5 name="poo" size={16} /> Both (Wet & Dirty)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Selection (for dirty or both) */}
          {(selectedType === "dirty" || selectedType === "both") && (
            <View style={styles.colorSelectionContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Stool Color
              </Text>
              <View style={styles.colorButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor:
                        selectedColor === "yellow"
                          ? "#FFCC0020"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedColor === "yellow"
                          ? "#FFCC00"
                          : theme.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedColor("yellow")}
                >
                  <View
                    style={[styles.colorSwatch, { backgroundColor: "#FFCC00" }]}
                  />
                  <Text
                    style={[
                      styles.colorText,
                      {
                        color:
                          selectedColor === "yellow" ? "#FFCC00" : theme.text,
                      },
                    ]}
                  >
                    Yellow
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor:
                        selectedColor === "green"
                          ? "#4CD96420"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedColor === "green"
                          ? "#4CD964"
                          : theme.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedColor("green")}
                >
                  <View
                    style={[styles.colorSwatch, { backgroundColor: "#4CD964" }]}
                  />
                  <Text
                    style={[
                      styles.colorText,
                      {
                        color:
                          selectedColor === "green" ? "#4CD964" : theme.text,
                      },
                    ]}
                  >
                    Green
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor:
                        selectedColor === "brown"
                          ? "#A2845E20"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedColor === "brown"
                          ? "#A2845E"
                          : theme.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedColor("brown")}
                >
                  <View
                    style={[styles.colorSwatch, { backgroundColor: "#A2845E" }]}
                  />
                  <Text
                    style={[
                      styles.colorText,
                      {
                        color:
                          selectedColor === "brown" ? "#A2845E" : theme.text,
                      },
                    ]}
                  >
                    Brown
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor:
                        selectedColor === "black"
                          ? "#32323220"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedColor === "black"
                          ? "#323232"
                          : theme.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedColor("black")}
                >
                  <View
                    style={[styles.colorSwatch, { backgroundColor: "#323232" }]}
                  />
                  <Text
                    style={[
                      styles.colorText,
                      {
                        color:
                          selectedColor === "black" ? "#323232" : theme.text,
                      },
                    ]}
                  >
                    Black
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Consistency Selection (for dirty or both) */}
          {(selectedType === "dirty" || selectedType === "both") && (
            <View style={styles.consistencySelectionContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Consistency
              </Text>
              <View style={styles.consistencyButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.consistencyButton,
                    {
                      backgroundColor:
                        selectedConsistency === "soft"
                          ? "#5A87FF20"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedConsistency === "soft"
                          ? "#5A87FF"
                          : theme.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedConsistency("soft")}
                >
                  <Text
                    style={[
                      styles.consistencyText,
                      {
                        color:
                          selectedConsistency === "soft"
                            ? "#5A87FF"
                            : theme.text,
                      },
                    ]}
                  >
                    Soft
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.consistencyButton,
                    {
                      backgroundColor:
                        selectedConsistency === "firm"
                          ? "#FF950020"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedConsistency === "firm"
                          ? "#FF9500"
                          : theme.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedConsistency("firm")}
                >
                  <Text
                    style={[
                      styles.consistencyText,
                      {
                        color:
                          selectedConsistency === "firm"
                            ? "#FF9500"
                            : theme.text,
                      },
                    ]}
                  >
                    Firm
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.consistencyButton,
                    {
                      backgroundColor:
                        selectedConsistency === "watery"
                          ? "#FF2D5520"
                          : theme.backgroundSecondary,
                      borderColor:
                        selectedConsistency === "watery"
                          ? "#FF2D55"
                          : theme.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedConsistency("watery")}
                >
                  <Text
                    style={[
                      styles.consistencyText,
                      {
                        color:
                          selectedConsistency === "watery"
                            ? "#FF2D55"
                            : theme.text,
                      },
                    ]}
                  >
                    Watery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  selectedType && !submitting
                    ? theme.primary
                    : theme.backgroundSecondary,
                opacity: selectedType && !submitting ? 1 : 0.5,
              },
            ]}
            onPress={addDiaperChange}
            disabled={!selectedType || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="save"
                  size={16}
                  color="#FFFFFF"
                  style={styles.saveButtonIcon}
                />
                <Text style={styles.saveButtonText}>Save Diaper Change</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Diaper Changes with Delete Functionality */}
        <RecentActivityCard
          title="Recent Diaper Changes"
          activities={diaperChanges.slice(0, 5)}
          emptyStateMessage="No diaper changes recorded yet"
          emptyStateIcon={
            <Ionicons name="calendar-outline" size={32} color="#999" />
          }
          onViewAll={() =>
            navigation.navigate("DiaperHistory", { childId: currentChild.id })
          }
          renderActivityItem={(change) => (
            <View style={styles.changeItem}>
              <View style={styles.changeIconContainer}>
                {change.type === "wet" ? (
                  <Ionicons name="water" size={18} color={theme.primary} />
                ) : change.type === "dirty" ? (
                  <FontAwesome5 name="poo" size={18} color="#8B4513" />
                ) : (
                  <View style={styles.combinedIcons}>
                    <Ionicons name="water" size={16} color={theme.primary} />
                    <FontAwesome5
                      name="poo"
                      size={16}
                      color="#8B4513"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                )}
              </View>
              <View style={styles.changeDetails}>
                <Text style={[styles.changeType, { color: theme.text }]}>
                  {change.type === "wet"
                    ? "Wet Diaper"
                    : change.type === "both"
                    ? "Wet & Soiled Diaper"
                    : "Soiled Diaper"}
                </Text>
                <View style={styles.changeMetadata}>
                  <Text
                    style={[styles.changeTime, { color: theme.textSecondary }]}
                  >
                    {formatDate(change.date)} at {formatTime(change.date)}
                  </Text>

                  {(change.type === "dirty" || change.type === "both") &&
                    change.color && (
                      <View style={styles.changeProperties}>
                        <View
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor:
                                change.color === "yellow"
                                  ? "#FFCC00"
                                  : change.color === "green"
                                  ? "#4CD964"
                                  : change.color === "brown"
                                  ? "#A2845E"
                                  : change.color === "black"
                                  ? "#323232"
                                  : "#CCCCCC",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.propertyText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {change.color.charAt(0).toUpperCase() +
                            change.color.slice(1)}
                        </Text>

                        {change.consistency && (
                          <Text
                            style={[
                              styles.propertyText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            •{" "}
                            {change.consistency.charAt(0).toUpperCase() +
                              change.consistency.slice(1)}
                          </Text>
                        )}
                      </View>
                    )}
                </View>
              </View>
            </View>
          )}
          onDeleteItem={handleDeleteDiaperChange}
          showDeleteButton={true}
          deleteConfirmTitle="Delete Diaper Change"
          deleteConfirmMessage="Are you sure you want to delete this diaper change record?"
          maxItems={5}
        />

        {/* Today's Summary */}
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="today"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today's Summary
            </Text>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Total Changes
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: isChangesEnough ? theme.success : theme.danger },
                ]}
              >
                {todayTotal}
              </Text>
              <Text
                style={[styles.summarySubtext, { color: theme.textSecondary }]}
              >
                of {recommendations.changesPerDay} recommended
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Wet Only
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {todayChanges.filter((change) => change.type === "wet").length}
              </Text>
              <Text
                style={[styles.summarySubtext, { color: theme.textSecondary }]}
              >
                diapers
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Dirty/Both
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {
                  todayChanges.filter(
                    (change) =>
                      change.type === "dirty" || change.type === "both"
                  ).length
                }
              </Text>
              <Text
                style={[styles.summarySubtext, { color: theme.textSecondary }]}
              >
                diapers
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text
                style={[styles.progressLabel, { color: theme.textSecondary }]}
              >
                Progress toward daily minimum:
              </Text>
              <Text
                style={[
                  styles.progressPercentage,
                  { color: isChangesEnough ? theme.success : theme.danger },
                ]}
              >
                {changesPercentage}%
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
                    width: `${changesPercentage}%`,
                    backgroundColor: isChangesEnough
                      ? theme.success
                      : theme.danger,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CustomTimePicker({ initialTime, onTimeSelected, onCancel, theme }) {
  const [hours, setHours] = useState(initialTime.getHours());
  const [minutes, setMinutes] = useState(initialTime.getMinutes());
  const [period, setPeriod] = useState(hours >= 12 ? "PM" : "AM");

  // Convert 24-hour format to 12-hour format for display
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const newDate = new Date(initialTime);
    // Convert back to 24-hour format
    const newHours =
      period === "PM"
        ? hours === 12
          ? 12
          : hours + 12
        : hours === 12
        ? 0
        : hours;
    newDate.setHours(newHours);
    newDate.setMinutes(minutes);
    onTimeSelected(newDate);
  };

  return (
    <View style={styles.customTimePickerContainer}>
      <View style={styles.pickerRow}>
        {/* Hours */}
        <View
          style={[
            styles.pickerColumn,
            { borderRightWidth: 1, borderColor: theme.borderLight },
          ]}
        >
          <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
            Hour
          </Text>
          <ScrollView
            style={styles.pickerScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerScrollContent}
          >
            {hourOptions.map((hour) => (
              <TouchableOpacity
                key={`hour-${hour}`}
                style={[
                  styles.pickerItem,
                  displayHours === hour && {
                    backgroundColor: `${theme.primary}20`,
                  },
                ]}
                onPress={() => {
                  const newHours =
                    period === "PM"
                      ? hour === 12
                        ? 12
                        : hour + 12
                      : hour === 12
                      ? 0
                      : hour;
                  setHours(newHours);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    {
                      color: displayHours === hour ? theme.primary : theme.text,
                    },
                  ]}
                >
                  {hour}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Minutes */}
        <View
          style={[
            styles.pickerColumn,
            { borderRightWidth: 1, borderColor: theme.borderLight },
          ]}
        >
          <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
            Minute
          </Text>
          <ScrollView
            style={styles.pickerScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pickerScrollContent}
          >
            {minuteOptions.map((minute) => (
              <TouchableOpacity
                key={`minute-${minute}`}
                style={[
                  styles.pickerItem,
                  minutes === minute && {
                    backgroundColor: `${theme.primary}20`,
                  },
                ]}
                onPress={() => setMinutes(minute)}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    { color: minutes === minute ? theme.primary : theme.text },
                  ]}
                >
                  {minute.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AM/PM */}
        <View style={styles.pickerColumn}>
          <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
            AM/PM
          </Text>
          <View style={styles.amPmContainer}>
            <TouchableOpacity
              style={[
                styles.amPmButton,
                period === "AM" && { backgroundColor: `${theme.primary}20` },
              ]}
              onPress={() => {
                setPeriod("AM");
                if (hours >= 12) {
                  setHours(hours - 12);
                }
              }}
            >
              <Text
                style={[
                  styles.amPmText,
                  { color: period === "AM" ? theme.primary : theme.text },
                ]}
              >
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.amPmButton,
                period === "PM" && { backgroundColor: `${theme.primary}20` },
              ]}
              onPress={() => {
                setPeriod("PM");
                if (hours < 12) {
                  setHours(hours + 12);
                }
              }}
            >
              <Text
                style={[
                  styles.amPmText,
                  { color: period === "PM" ? theme.primary : theme.text },
                ]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.pickerButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.pickerCancelButton,
            { borderColor: theme.borderLight },
          ]}
          onPress={onCancel}
        >
          <Text
            style={[styles.pickerCancelText, { color: theme.textSecondary }]}
          >
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pickerConfirmButton,
            { backgroundColor: theme.primary },
          ]}
          onPress={handleConfirm}
        >
          <Text style={styles.pickerConfirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
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
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  summarySubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
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
    minHeight: 200,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
  progressContainer: {
    width: "100%",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
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
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateTimeIcon: {
    marginRight: 8,
  },
  dateTimeText: {
    fontSize: 16,
  },
  typeSelectionContainer: {
    marginBottom: 16,
  },
  typeButtonsContainer: {
    gap: 8,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeIcon: {
    marginRight: 8,
  },
  typeText: {
    fontSize: 16,
  },
  colorSelectionContainer: {
    marginBottom: 16,
  },
  colorButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: "48%",
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  colorText: {
    fontSize: 14,
  },
  consistencySelectionContainer: {
    marginBottom: 16,
  },
  consistencyButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  consistencyButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: "30%",
  },
  consistencyText: {
    fontSize: 14,
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
  recentChangesContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentChangesList: {
    marginTop: 8,
  },
  dateHeader: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  changeItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingLeft: 8,
    alignItems: "center",
    position: "relative",
  },
  changeTimeContainer: {
    width: 60,
  },
  changeTime: {
    fontSize: 14,
    fontWeight: "500",
  },
  changeDetailsContainer: {
    flex: 1,
    marginLeft: 8,
  },
  changeTypeContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  changeTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  changeTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  changePropertiesContainer: {
    flexDirection: "row",
    gap: 8,
  },
  changePropertyTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  changePropertyText: {
    fontSize: 12,
    marginRight: 4,
  },
  changeDeleteButton: {
    padding: 8,
  },
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyListText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  recommendationsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsContent: {
    gap: 12,
  },
  recommendationCard: {
    borderRadius: 12,
    padding: 12,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  recommendationText: {
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationSubtext: {
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationWarning: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerContainer: {
    width: "80%",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  timePickerContent: {
    alignItems: "center",
  },
  customTimePickerContainer: {
    width: "100%",
  },
  pickerRow: {
    flexDirection: "row",
    height: 200,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  pickerScrollView: {
    height: 150,
    width: "100%",
  },
  pickerScrollContent: {
    paddingVertical: 60,
  },
  pickerItem: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
  },
  amPmContainer: {
    height: 150,
    justifyContent: "center",
    gap: 16,
  },
  amPmButton: {
    height: 40,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  amPmText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  pickerButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  pickerCancelButton: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  pickerConfirmButton: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: 8,
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  changeIconContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
    marginLeft: 4,
  },
  changeDetails: {
    flex: 1,
  },
  changeType: {
    fontSize: 16,
    fontWeight: "500",
  },
  changeMetadata: {
    marginTop: 4,
  },
  changeProperties: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  propertyText: {
    fontSize: 12,
    marginRight: 4,
  },
  combinedIcons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
