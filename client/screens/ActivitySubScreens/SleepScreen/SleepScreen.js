import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useChildActivity } from "../../../context/child-activity-context";
import { useTheme } from "../../../context/theme-context";
import CustomButton from "../../../components/UI/Button/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  getChildSleepData,
  saveSleepData,
  updateSleepData,
  isToday,
  getCurrentSleepData,
} from "../../../services/sleep-service";
import { SafeAreaView } from "react-native-safe-area-context";
import ChildInfoCard from "../../../components/UI/Cards/ChildInfoCard";
import ChildRecommendationCard from "../../../components/UI/Cards/ChildRecommendationCard";
import ColumnChart from "../../../components/UI/Charts/ColumnChart";

const SleepScreen = () => {
  const navigation = useNavigation();
  const { currentChild, currentChildId } = useChildActivity();
  const { theme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [napHours, setNapHours] = useState("");
  const [nightHours, setNightHours] = useState("");
  const [notes, setNotes] = useState("");
  const [sleepHistory, setSleepHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customTotalHours, setCustomTotalHours] = useState(0);
  const [showingYesterdayData, setShowingYesterdayData] = useState(false);
  const [isDefaultData, setIsDefaultData] = useState(false);
  // Add a new state variable for edit mode
  const [isEditMode, setIsEditMode] = useState(true);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Update the getChildAgeInMonths function to be more precise
  const getChildAgeInMonths = () => {
    if (!currentChild || !currentChild.age) return 24; // Default to toddler if no age

    const ageText = currentChild.age;
    const ageNum = Number.parseInt(ageText.split(" ")[0]) || 0;
    const ageUnit = ageText.includes("month") ? "months" : "years";

    // Convert age to months if in years for more precise recommendations
    return ageUnit === "months" ? ageNum : ageNum * 12;
  };

  // Add a function to get the WHO age group description
  const getWHOAgeGroup = (ageInMonths) => {
    if (ageInMonths < 4) {
      return "0-3 months";
    } else if (ageInMonths >= 4 && ageInMonths <= 12) {
      return "4-12 months";
    } else if (ageInMonths > 12 && ageInMonths <= 24) {
      return "1-2 years";
    } else if (ageInMonths > 24 && ageInMonths <= 60) {
      return "3-5 years";
    } else {
      return "6-12 years";
    }
  };

  // Update the getSleepRecommendations function to match WHO guidelines
  const getSleepRecommendations = (ageInMonths) => {
    if (ageInMonths < 4) {
      // Newborn (0-3 months) - WHO recommendation: 14-17 hours
      return {
        ageGroup: "Newborn (0-3 months)",
        totalSleep: "14-17 hours/day",
        naptime: "Multiple naps (day & night)",
        bedtime: "No set bedtime (short sleep cycles)",
        naptimeHours: "Throughout the day and night",
        bedtimeHours: "No set bedtime - sleep cycles of 2-4 hours",
        minHours: 14,
        maxHours: 17,
        recommendedNapHours: 8,
        recommendedNightHours: 8,
      };
    } else if (ageInMonths >= 4 && ageInMonths <= 12) {
      // Infant (4-12 months) - WHO recommendation: 12-16 hours
      return {
        ageGroup: "Infant (4-12 months)",
        totalSleep: "12-16 hours/day",
        naptime: "2-3 naps (morning, afternoon)",
        bedtime: "6:30 - 8:00 PM",
        naptimeHours: "9:00 AM, 12:00 PM, and 3:00 PM",
        bedtimeHours: "6:30 PM - 8:00 PM",
        minHours: 12,
        maxHours: 16,
        recommendedNapHours: 4,
        recommendedNightHours: 10,
      };
    } else if (ageInMonths > 12 && ageInMonths <= 24) {
      // Toddler (1-2 years) - WHO recommendation: 11-14 hours
      return {
        ageGroup: "Toddler (1-2 years)",
        totalSleep: "11-14 hours/day",
        naptime: "1 nap (12:00 - 2:00 PM)",
        bedtime: "7:00 - 8:30 PM",
        naptimeHours: "12:00 PM - 2:00 PM",
        bedtimeHours: "7:00 PM - 8:30 PM",
        minHours: 11,
        maxHours: 14,
        recommendedNapHours: 2,
        recommendedNightHours: 11,
      };
    } else if (ageInMonths > 24 && ageInMonths <= 60) {
      // Preschooler (3-5 years) - WHO recommendation: 10-13 hours
      return {
        ageGroup: "Preschooler (3-5 years)",
        totalSleep: "10-13 hours/day",
        naptime: "1 nap (12:30 - 2:00 PM) or none",
        bedtime: "7:00 - 8:30 PM",
        naptimeHours: "12:30 PM - 2:00 PM (if needed)",
        bedtimeHours: "7:00 PM - 8:30 PM",
        minHours: 10,
        maxHours: 13,
        recommendedNapHours: 1,
        recommendedNightHours: 11,
      };
    } else {
      // School-age (6-12 years) - WHO recommendation: 9-12 hours
      return {
        ageGroup: "School-age (6-12 years)",
        totalSleep: "9-12 hours/day",
        naptime: "No naps needed",
        bedtime: "7:30 - 9:00 PM",
        naptimeHours: "Not applicable",
        bedtimeHours: "7:30 PM - 9:00 PM",
        minHours: 9,
        maxHours: 12,
        recommendedNapHours: 0,
        recommendedNightHours: 10,
      };
    }
  };

  // Add this function to handle updating the total hours when inputs change
  const updateTotalHours = (nap, night) => {
    const napValue = Number.parseFloat(nap) || 0;
    const nightValue = Number.parseFloat(night) || 0;
    setCustomTotalHours(napValue + nightValue);
  };

  // Get recommendations based on child's age
  const childAgeInMonths = getChildAgeInMonths();
  const recommendations = getSleepRecommendations(childAgeInMonths);

  // Check if sleep hours meet recommendations
  const isSleepSufficient = customTotalHours >= recommendations.minHours;

  // Calculate the percentage difference from recommended sleep
  const calculateSleepPercentage = () => {
    const diff = customTotalHours - recommendations.minHours;
    const percentage = Math.round((diff / recommendations.minHours) * 100);
    return percentage;
  };

  const sleepPercentage = calculateSleepPercentage();
  const sleepPercentageText =
    sleepPercentage >= 0 ? `+${sleepPercentage}%` : `${sleepPercentage}%`;

  // Define sunny color for nap time
  const sunnyColor = "#FF9500"; // Orange/yellow color for sun

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Calculate bar height with proper scaling
  const calculateBarHeight = (hours) => {
    const value = Number.parseFloat(hours) || 0;
    const maxDisplayHeight = 150; // Maximum height in pixels
    const scaleFactor = 15; // Base scale factor

    // If the value would exceed our max height, we need to scale differently
    if (value * scaleFactor > maxDisplayHeight) {
      return maxDisplayHeight;
    }

    return value * scaleFactor;
  };

  useEffect(() => {
    if (!currentChildId) {
      setLoading(false);
      return;
    }

    // Load sleep data directly without explicit API initialization
    loadSleepData();
  }, [currentChildId]);

  // Set up the notification button in the header
  React.useLayoutEffect(() => {
    if (currentChild && navigation) {
      navigation.setOptions({
        headerRight: () => (
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
        ),
        title: `${currentChild.name?.split(" ")[0] || "Child"}'s Sleep Details`,
      });
    }
  }, [navigation, notificationsEnabled, theme, currentChild]);

  // Update the loadSleepData function to better handle the case when there's no data
  const loadSleepData = async () => {
    setLoading(true);
    try {
      // Load sleep history
      const history = await getChildSleepData(currentChildId);
      setSleepHistory(
        Array.isArray(history)
          ? history.sort((a, b) => new Date(b.date) - new Date(a.date))
          : []
      );

      // For a new child, don't even try to fetch current data, just create a default record
      if (history.length === 0) {
        console.log("No sleep history found, creating default record");
        const today = new Date().toISOString().split("T")[0];

        // Create a default record with zeros
        const defaultRecord = {
          id: null,
          childId: currentChildId,
          napHours: 0,
          nightHours: 0,
          date: today,
          notes: "",
          totalHours: "0",
          isBeforeNoon: false,
          targetDate: today,
          isDefaultData: true,
        };

        setNapHours("");
        setNightHours("");
        setNotes("");
        setSelectedRecord(defaultRecord);
        setCurrentDate(today);
        updateTotalHours("0", "0");
        setIsDefaultData(true);
        setIsEditMode(true);

        setLoading(false);
        return;
      }

      // If we have history, try to load current data
      if (!selectedRecord) {
        try {
          console.log("Fetching current sleep data...");
          const currentData = await getCurrentSleepData(currentChildId);
          console.log("Current sleep data loaded:", currentData);

          if (currentData) {
            setNapHours(currentData.napHours.toString());
            setNightHours(currentData.nightHours.toString());
            setNotes(currentData.notes || "");
            setSelectedRecord(currentData);
            setCurrentDate(
              currentData.date ||
                currentData.targetDate ||
                new Date().toISOString().split("T")[0]
            );
            updateTotalHours(
              currentData.napHours.toString(),
              currentData.nightHours.toString()
            );
            setShowingYesterdayData(currentData.isBeforeNoon);
            setIsDefaultData(currentData.isDefaultData || false);
            setIsEditMode(!currentData.id);
          } else {
            resetForm();
          }
        } catch (error) {
          console.error("Error fetching current sleep data:", error);
          // If there's an error, just create a default record
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error loading sleep data:", error);
      // Reset the form with zeros
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  // Update the resetForm function to set edit mode to true
  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];

    setNapHours("");
    setNightHours("");
    setNotes("");
    setSelectedRecord({
      id: null,
      childId: currentChildId,
      napHours: 0,
      nightHours: 0,
      date: today,
      notes: "",
      totalHours: "0",
      isDefaultData: true,
    });
    setCurrentDate(today);
    updateTotalHours("0", "0");
    setIsDefaultData(true);
    setIsEditMode(true);
  };

  // Update the handleSelectSleepRecord function to set edit mode to false initially
  const handleSelectSleepRecord = (record) => {
    setSelectedRecord(record);
    setNapHours(record.napHours.toString());
    setNightHours(record.nightHours.toString());
    setNotes(record.notes || "");
    setCurrentDate(record.date);
    updateTotalHours(record.napHours.toString(), record.nightHours.toString());
    setIsDefaultData(false);
    setIsEditMode(false);
  };

  const handleNapHoursChange = (value) => {
    // Validate input to only allow whole numbers
    const validatedValue = value.replace(/[^0-9]/g, "");

    // Limit to max 2 digits
    if (validatedValue.length > 2) {
      return;
    } else {
      setNapHours(validatedValue);
      updateTotalHours(validatedValue, nightHours);
    }
  };

  const handleNightHoursChange = (value) => {
    // Validate input to only allow whole numbers
    const validatedValue = value.replace(/[^0-9]/g, "");

    // Limit to max 2 digits
    if (validatedValue.length > 2) {
      return;
    } else {
      setNightHours(validatedValue);
      updateTotalHours(napHours, validatedValue);
    }
  };

  // Update the handleSaveSleepData function to prioritize database saving
  const handleSaveSleepData = async () => {
    if (!currentChildId) {
      Alert.alert("Error", "No child selected");
      return;
    }

    if (
      isNaN(Number.parseFloat(napHours)) ||
      isNaN(Number.parseFloat(nightHours))
    ) {
      Alert.alert(
        "Invalid Input",
        "Please enter valid numbers for sleep hours"
      );
      return;
    }

    // If we're in view mode, switch to edit mode and return
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    setSaving(true);
    try {
      console.log("Current child ID:", currentChildId);
      console.log("Selected record:", selectedRecord);

      const sleepData = {
        id: selectedRecord?.id,
        childId: currentChildId,
        napHours: Number.parseFloat(napHours) || 0,
        nightHours: Number.parseFloat(nightHours) || 0,
        date: currentDate,
        notes: notes,
      };

      console.log("Sleep data prepared for saving to database:", sleepData);

      let result;
      if (selectedRecord?.id) {
        console.log(
          "Updating existing record in database with ID:",
          selectedRecord.id
        );
        result = await updateSleepData(sleepData);
      } else {
        console.log("Creating new sleep record in database");
        result = await saveSleepData(sleepData);
      }

      console.log("Database save operation completed. Result:", result);

      if (result) {
        Alert.alert("Success", "Sleep data saved successfully to database");

        // Reload data to show updated history
        await loadSleepData();

        // If we were editing a past record, reset to today
        if (selectedRecord && !isToday(selectedRecord.date)) {
          resetForm();
        } else {
          // Switch to view mode after saving
          setIsEditMode(false);
        }

        // Clear the default data flag after saving
        setIsDefaultData(false);
      } else {
        // This should not happen if the database save was successful
        Alert.alert("Error", "Failed to save sleep data to database");
      }
    } catch (error) {
      console.error("Error in handleSaveSleepData:", error);
      Alert.alert(
        "Database Error",
        "Failed to save sleep data to database. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNewRecord = () => {
    resetForm();
  };

  // Add a function to handle edit mode toggle:
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Display a message if no child is selected
  if (!currentChildId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.noChildContainer}>
          <Text style={[styles.noChildText, { color: theme.text }]}>
            Please select a child to track sleep data.
          </Text>
          <CustomButton
            title="Go to Settings"
            onPress={() => navigation.navigate("Settings")}
            style={styles.noChildButton}
          />
        </View>
      </View>
    );
  }

  // Prepare data for the ColumnChart
  const chartData = [
    {
      value: Number.parseFloat(napHours) || 0,
      label: "Nap     Time",
      color: sunnyColor,
      icon: <Ionicons name="sunny" size={16} color={sunnyColor} />,
      unit: "hrs",
    },
    {
      value: Number.parseFloat(nightHours) || 0,
      label: "Night Sleep",
      color: theme.info,
      icon: <Ionicons name="moon" size={16} color={theme.info} />,
      unit: "hrs",
    },
  ];

  // Target values for the chart
  const targetValues = [
    recommendations.recommendedNapHours,
    recommendations.recommendedNightHours,
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading sleep data...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Child Info Card */}
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

          {/* Child Recommendation Card */}
          <ChildRecommendationCard
            childData={currentChild}
            screenType="sleep"
            customTitle="Sleep Guidelines"
          />

          {/* Sleep Chart using ColumnChart component */}
          <ColumnChart
            data={chartData}
            targetValues={targetValues}
            title="Daily Sleep Chart"
            showTargetLegend={false}
            targetLegendText="Recommended Sleep Hours"
          />

          {/* Reset Time Info Banner */}
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={theme.primary}
              style={styles.bannerIcon}
            />
            <Text style={[styles.bannerText, { color: theme.text }]}>
              Sleep data resets daily at 12:00 PM
            </Text>
          </View>

          {showingYesterdayData && (
            <View
              style={[
                styles.yesterdayBanner,
                { backgroundColor: `${theme.warning}20` },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={18}
                color={theme.warning}
                style={styles.bannerIcon}
              />
              <Text style={[styles.bannerText, { color: theme.text }]}>
                Viewing yesterday's sleep data. New data will be available after
                12:00 PM today.
              </Text>
            </View>
          )}

          {/* Sleep Hours Input */}
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {isEditMode ? (
              <>
                <Text style={[styles.inputTitle, { color: theme.text }]}>
                  Enter Sleep Hours
                </Text>
                <Text
                  style={[styles.inputSubtitle, { color: theme.textSecondary }]}
                >
                  Record how many hours your child slept today
                </Text>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelContainer}>
                      <Ionicons
                        name="sunny"
                        size={16}
                        color={sunnyColor}
                        style={styles.inputIcon}
                      />
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Nap Time
                      </Text>
                    </View>
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
                        value={napHours}
                        onChangeText={handleNapHoursChange}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.textTertiary}
                        editable={isEditMode}
                      />
                      <Text
                        style={[
                          styles.inputUnit,
                          { color: theme.textSecondary },
                        ]}
                      >
                        hrs
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelContainer}>
                      <Ionicons
                        name="moon"
                        size={16}
                        color={theme.info}
                        style={styles.inputIcon}
                      />
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Night Sleep
                      </Text>
                    </View>
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
                        value={nightHours}
                        onChangeText={handleNightHoursChange}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.textTertiary}
                        editable={isEditMode}
                      />
                      <Text
                        style={[
                          styles.inputUnit,
                          { color: theme.textSecondary },
                        ]}
                      >
                        hrs
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.inputTitle, { color: theme.text }]}>
                  Sleep Hours Summary
                </Text>
                <Text
                  style={[styles.inputSubtitle, { color: theme.textSecondary }]}
                >
                  Recorded sleep data for {formatDate(currentDate)}
                </Text>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <View
                      style={[
                        styles.summaryIconContainer,
                        { backgroundColor: `${sunnyColor}20` },
                      ]}
                    >
                      <Ionicons name="sunny" size={20} color={sunnyColor} />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Nap Time
                      </Text>
                      <Text
                        style={[styles.summaryValue, { color: theme.text }]}
                      >
                        {napHours} hours
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryItem}>
                    <View
                      style={[
                        styles.summaryIconContainer,
                        { backgroundColor: `${theme.info}20` },
                      ]}
                    >
                      <Ionicons name="moon" size={20} color={theme.info} />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Night Sleep
                      </Text>
                      <Text
                        style={[styles.summaryValue, { color: theme.text }]}
                      >
                        {nightHours} hours
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveSleepData}
              disabled={saving}
            >
              <Ionicons
                name={isEditMode ? "save" : "create-outline"}
                size={16}
                color="#FFFFFF"
                style={styles.saveButtonIcon}
              />
              <Text style={styles.saveButtonText}>
                {saving
                  ? "Saving..."
                  : isEditMode
                  ? "Save Sleep Data"
                  : "Edit Sleep Data"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Total Sleep Summary */}
          <View
            style={[
              styles.totalSummaryContainer,
              {
                backgroundColor: theme.cardBackground,
                borderColor: isSleepSufficient ? "transparent" : theme.danger,
                borderWidth: isSleepSufficient ? 0 : 2,
              },
            ]}
          >
            <Text
              style={[styles.totalSummaryLabel, { color: theme.textSecondary }]}
            >
              Total Daily Sleep
            </Text>
            <Text
              style={[
                styles.totalSummaryValue,
                {
                  color: isSleepSufficient ? theme.success : theme.danger,
                },
              ]}
            >
              {customTotalHours} hours
            </Text>
            <Text
              style={[
                styles.totalSummaryRecommended,
                { color: theme.textSecondary },
              ]}
            >
              Recommended: {recommendations.totalSleep}
            </Text>

            {/* Total sleep percentage chart with positive/negative values */}
            <View style={styles.totalPercentageContainer}>
              <View style={styles.percentageRow}>
                <Text
                  style={[
                    styles.totalPercentageLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Compared to minimum goal ({recommendations.minHours} hrs):
                </Text>

                {/* Display percentage with + or - sign */}
                <Text
                  style={[
                    styles.percentageText,
                    {
                      color:
                        sleepPercentage >= 0 ? theme.success : theme.danger,
                      fontSize: 16,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {sleepPercentageText}
                </Text>
              </View>

              {/* Progress bar for positive/negative values */}
              <View style={styles.totalProgressBarContainer}>
                {/* Center line (0%) */}
                <View style={styles.centerLine} />

                {/* Negative bar (if applicable) */}
                {sleepPercentage < 0 && (
                  <View
                    style={[
                      styles.negativeProgressBar,
                      {
                        width: `${Math.min(
                          50,
                          Math.abs(sleepPercentage) / 2
                        )}%`,
                        backgroundColor: theme.danger,
                      },
                    ]}
                  />
                )}

                {/* Positive bar (if applicable) */}
                {sleepPercentage > 0 && (
                  <View
                    style={[
                      styles.positiveProgressBar,
                      {
                        width: `${Math.min(50, sleepPercentage / 2)}%`,
                        backgroundColor: theme.success,
                      },
                    ]}
                  />
                )}
              </View>

              {/* Scale labels */}
              <View style={styles.scaleLabels}>
                <Text
                  style={[styles.scaleLabel, { color: theme.textSecondary }]}
                >
                  -100%
                </Text>
                <Text
                  style={[styles.scaleLabel, { color: theme.textSecondary }]}
                >
                  0%
                </Text>
                <Text
                  style={[styles.scaleLabel, { color: theme.textSecondary }]}
                >
                  +100%
                </Text>
              </View>
            </View>

            {!isSleepSufficient && (
              <View style={styles.warningContainer}>
                <Ionicons
                  name="warning"
                  size={18}
                  color={theme.danger}
                  style={styles.warningIcon}
                />
                <Text style={[styles.warningText, { color: theme.danger }]}>
                  Sleep hours below recommended minimum of{" "}
                  {recommendations.minHours} hours
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
  // New Age Group styles
  ageGroupContainer: {
    marginBottom: 16,
  },
  ageGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ageGroupLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginRight: 8,
  },
  childAge: {
    fontSize: 15,
    fontWeight: "600",
  },
  ageGroupInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ageGroupIcon: {
    marginRight: 8,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  ageGroupTextContainer: {
    flex: 1,
  },
  ageGroupText: {
    fontSize: 15,
    fontWeight: "600",
  },
  ageGroupSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  // New info banners
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  // Summary view styles
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    padding: 12,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Removed old ageBanner styles
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    paddingTop: 24,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: "center",
  },
  totalSleepContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  totalSleepLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalSleepValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalSummaryContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalSummaryLabel: {
    fontSize: 16,
    fontWeight: "500",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalSummaryLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  totalSummaryValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  totalSummaryRecommended: {
    fontSize: 14,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
  },
  scheduleContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scheduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  scheduleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleSubDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    opacity: 0.8,
  },
  scheduleGoal: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  totalGoalContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    alignItems: "center",
  },
  totalGoalText: {
    fontSize: 14,
    textAlign: "center",
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
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  scheduleButtonIcon: {
    marginRight: 8,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  combinedChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 10,
    height: 220,
    marginTop: 10,
  },
  barContainer: {
    flex: 5,
    flexDirection: "row",
    height: 160,
    alignItems: "flex-end",
  },
  barLabelContainer: {
    position: "absolute",
    bottom: -30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    width: 60,
  },
  barsWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
  },
  barColumn: {
    alignItems: "center",
    width: 60,
  },
  barIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  bar: {
    width: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  totalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(0, 0, 0, 0.1)",
    paddingLeft: 20,
    height: 160,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: "700",
  },
  totalUnit: {
    fontSize: 14,
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
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
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputGroup: {
    width: "48%",
  },
  inputLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 6,
  },
  inputLabel: {
    fontSize: 14,
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
  percentageContainer: {
    marginTop: 8,
  },
  percentageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  totalPercentageContainer: {
    width: "100%",
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
  },
  totalPercentageLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  totalProgressBarContainer: {
    height: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
    position: "relative",
  },
  centerLine: {
    position: "absolute",
    width: 2,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    left: "50%",
    marginLeft: -1,
  },
  negativeProgressBar: {
    position: "absolute",
    height: "100%",
    right: "50%",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  positiveProgressBar: {
    position: "absolute",
    height: "100%",
    left: "50%",
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  scaleLabel: {
    fontSize: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  noChildContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noChildText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  noChildButton: {
    width: 200,
  },
  yesterdayBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  defaultDataBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  ageGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  childAge: {
    fontSize: 16,
    fontWeight: "600",
  },
  ageGroupTextContainer: {
    flex: 1,
  },
  ageGroupText: {
    fontSize: 14,
    fontWeight: "600",
  },
  ageGroupSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default SleepScreen;
