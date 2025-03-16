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
import CustomButton from "../../../components/Button/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  getChildSleepData,
  getTodaySleepData,
  saveSleepData,
  updateSleepData,
  isToday,
} from "../../../services/sleep-service";
import { SafeAreaView } from "react-native-safe-area-context";

const SleepDetailsScreen = () => {
  const navigation = useNavigation();
  const { currentChild, currentChildId } = useChildActivity();
  const { theme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [napHours, setNapHours] = useState("0");
  const [nightHours, setNightHours] = useState("0");
  const [notes, setNotes] = useState("");
  const [sleepHistory, setSleepHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customTotalHours, setCustomTotalHours] = useState(0);

  // Get child's age as a number for recommendations
  const getChildAgeInMonths = () => {
    if (!currentChild || !currentChild.age) return 24; // Default to toddler if no age

    const ageText = currentChild.age;
    const ageNum = Number.parseInt(ageText.split(" ")[0]) || 0;
    const ageUnit = ageText.includes("month") ? "months" : "years";

    // Convert age to months if in years for more precise recommendations
    return ageUnit === "months" ? ageNum : ageNum * 12;
  };

  // Sleep recommendations based on age
  const getSleepRecommendations = (ageInMonths) => {
    if (ageInMonths < 4) {
      // Newborn (0-3 months)
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
      // Infant (4-12 months)
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
      // Toddler (1-2 years)
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
      // Preschooler (3-5 years)
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
      // School-age (6-12 years)
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

  // Update the useEffect hook to properly initialize the API and handle errors
  useEffect(() => {
    if (!currentChildId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Initialize the API before loading data
        const apiInitialized = await initializeApi();
        if (!apiInitialized) {
          console.error("Failed to initialize API connection");
          Alert.alert(
            "Connection Error",
            "Could not connect to the server. Please check your connection and try again."
          );
          setLoading(false);
          return;
        }

        await loadSleepData();
      } catch (error) {
        console.error("Error in initial data loading:", error);
        Alert.alert(
          "Error",
          "An error occurred while loading data. Please try again later."
        );
        setLoading(false);
      }
    };

    loadData();
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

  const loadSleepData = async () => {
    setLoading(true);
    try {
      // Ensure API is initialized
      const apiInitialized = await initializeApi();
      if (!apiInitialized) {
        throw new Error("API not initialized");
      }

      // Load sleep history
      const history = await getChildSleepData(currentChildId);
      setSleepHistory(
        Array.isArray(history)
          ? history.sort((a, b) => new Date(b.date) - new Date(a.date))
          : []
      );

      // Load today's data if not editing a specific record
      if (!selectedRecord) {
        const todayData = await getTodaySleepData(currentChildId);
        if (todayData) {
          setNapHours(todayData.napHours.toString());
          setNightHours(todayData.nightHours.toString());
          setNotes(todayData.notes || "");
          setSelectedRecord(todayData);
          updateTotalHours(
            todayData.napHours.toString(),
            todayData.nightHours.toString()
          );
        } else {
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error loading sleep data:", error);

      if (error.response && error.response.status === 404) {
        // This is normal for new users or new days - no need for an alert
        console.log("No sleep data found - this is normal for new records");
        resetForm();
      } else {
        // Only show alert for unexpected errors
        Alert.alert(
          "Data Loading Error",
          "Could not load sleep data. Please try again later."
        );
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNapHours("0");
    setNightHours("0");
    setNotes("");
    setSelectedRecord(null);
    setCurrentDate(new Date().toISOString().split("T")[0]);
    updateTotalHours("0", "0");
  };

  const handleSelectSleepRecord = (record) => {
    setSelectedRecord(record);
    setNapHours(record.napHours.toString());
    setNightHours(record.nightHours.toString());
    setNotes(record.notes || "");
    setCurrentDate(record.date);
    updateTotalHours(record.napHours.toString(), record.nightHours.toString());
  };

  const handleNapHoursChange = (value) => {
    // Validate input to only allow numbers with max 2 digits
    const validatedValue = value.replace(/[^0-9.]/g, "");

    // Limit to max 2 digits before decimal point
    if (validatedValue.includes(".")) {
      const [whole, decimal] = validatedValue.split(".");
      if (whole.length > 2) {
        return;
      }
      setNapHours(whole.substring(0, 2) + "." + decimal);
      updateTotalHours(whole.substring(0, 2) + "." + decimal, nightHours);
    } else if (validatedValue.length > 2) {
      return;
    } else {
      setNapHours(validatedValue);
      updateTotalHours(validatedValue, nightHours);
    }
  };

  const handleNightHoursChange = (value) => {
    // Validate input to only allow numbers with max 2 digits
    const validatedValue = value.replace(/[^0-9.]/g, "");

    // Limit to max 2 digits before decimal point
    if (validatedValue.includes(".")) {
      const [whole, decimal] = validatedValue.split(".");
      if (whole.length > 2) {
        return;
      }
      setNightHours(whole.substring(0, 2) + "." + decimal);
      updateTotalHours(napHours, whole.substring(0, 2) + "." + decimal);
    } else if (validatedValue.length > 2) {
      return;
    } else {
      setNightHours(validatedValue);
      updateTotalHours(napHours, validatedValue);
    }
  };

  // Update the handleSaveSleepData function to improve validation and error handling
  const handleSaveSleepData = async () => {
    if (!currentChildId) {
      Alert.alert("Error", "No child selected");
      return;
    }

    // Validate input values
    const napValue = Number.parseFloat(napHours);
    const nightValue = Number.parseFloat(nightHours);

    if (isNaN(napValue) || isNaN(nightValue)) {
      Alert.alert(
        "Invalid Input",
        "Please enter valid numbers for sleep hours"
      );
      return;
    }

    if (napValue < 0 || napValue > 24 || nightValue < 0 || nightValue > 24) {
      Alert.alert("Invalid Input", "Sleep hours must be between 0 and 24");
      return;
    }

    if (napValue + nightValue > 24) {
      Alert.alert(
        "Invalid Input",
        "Total sleep hours cannot exceed 24 hours per day"
      );
      return;
    }

    setSaving(true);
    try {
      // Ensure the API is initialized
      const apiInitialized = await initializeApi();
      if (!apiInitialized) {
        throw new Error("Failed to initialize API connection");
      }

      console.log("Current child ID:", currentChildId);
      console.log("Selected record:", selectedRecord);

      const sleepData = {
        id: selectedRecord?.id,
        childId: currentChildId,
        napHours: napValue,
        nightHours: nightValue,
        date: currentDate,
        notes: notes.trim(),
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
        }
      } else {
        // This should not happen if the database save was successful
        Alert.alert("Error", "Failed to save sleep data to database");
      }
    } catch (error) {
      console.error("Error in handleSaveSleepData:", error);

      // Provide more specific error messages based on the error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);

        if (error.response.status === 401) {
          Alert.alert(
            "Authentication Error",
            "Your session has expired. Please log in again."
          );
        } else if (error.response.status === 403) {
          Alert.alert(
            "Permission Error",
            "You don't have permission to save this data."
          );
        } else {
          Alert.alert(
            "Server Error",
            error.response.data.message || "An error occurred on the server."
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
        Alert.alert(
          "Connection Error",
          "Could not connect to the server. Please check your connection and try again."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again later."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNewRecord = () => {
    resetForm();
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
          {/* Age Group Banner */}
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

          {/* Combined Sleep Chart */}
          <View
            style={[
              styles.chartContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View
              style={[
                styles.chartHeader,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <Ionicons
                name="bar-chart"
                size={24}
                color={theme.text}
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Daily Sleep Chart
              </Text>
            </View>

            <View style={styles.combinedChartContainer}>
              {/* Bar Chart */}
              <View style={styles.barContainer}>
                <View style={styles.barsWrapper}>
                  <View style={styles.barColumn}>
                    {/* Sun Icon */}
                    <View
                      style={[
                        styles.barIcon,
                        { backgroundColor: `${sunnyColor}30` },
                      ]}
                    >
                      <Ionicons name="sunny" size={16} color={sunnyColor} />
                    </View>

                    <View
                      style={[
                        styles.bar,
                        {
                          height: calculateBarHeight(napHours),
                          backgroundColor: sunnyColor,
                        },
                      ]}
                    />
                    <Text style={[styles.barValue, { color: sunnyColor }]}>
                      {napHours} hrs
                    </Text>
                  </View>

                  <View style={styles.barColumn}>
                    {/* Moon Icon */}
                    <View
                      style={[
                        styles.barIcon,
                        { backgroundColor: `${theme.info}30` },
                      ]}
                    >
                      <Ionicons name="moon" size={16} color={theme.info} />
                    </View>

                    <View
                      style={[
                        styles.bar,
                        {
                          height: calculateBarHeight(nightHours),
                          backgroundColor: theme.info,
                        },
                      ]}
                    />
                    <Text style={[styles.barValue, { color: theme.info }]}>
                      {nightHours} hrs
                    </Text>
                  </View>
                </View>
              </View>

              {/* Total Display */}
              <View style={styles.totalContainer}>
                <Text
                  style={[styles.totalLabel, { color: theme.textSecondary }]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.totalValue,
                    {
                      color: isSleepSufficient ? theme.success : theme.danger,
                    },
                  ]}
                >
                  {customTotalHours}
                </Text>
                <Text
                  style={[styles.totalUnit, { color: theme.textSecondary }]}
                >
                  hours
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.chartLegend,
                { borderTopColor: theme.borderLight },
              ]}
            >
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: sunnyColor }]}
                />

                <Text style={[styles.legendText, { color: theme.text }]}>
                  Nap Time
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: theme.info }]}
                />
                <Text style={[styles.legendText, { color: theme.text }]}>
                  Night Sleep
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: theme.success },
                  ]}
                />
                <Text style={[styles.legendText, { color: theme.text }]}>
                  Recommended Range
                </Text>
              </View>
            </View>
          </View>

          {/* Sleep Hours Input */}
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Text style={[styles.inputTitle, { color: theme.text }]}>
              Confirm Sleep Hours
            </Text>
            <Text
              style={[styles.inputSubtitle, { color: theme.textSecondary }]}
            >
              Enter the actual hours your child slept today
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
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
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
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
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
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
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
                    placeholder="0.0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    hrs
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveSleepData}
              disabled={saving}
            >
              <Ionicons
                name="save"
                size={16}
                color="#FFFFFF"
                style={styles.saveButtonIcon}
              />
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Sleep Data"}
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

          {/* Recommended Schedule */}
          <View
            style={[
              styles.scheduleContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Sleep Recommendations & Schedule
            </Text>

            <View style={styles.scheduleCard}>
              <View
                style={[
                  styles.scheduleIconContainer,
                  { backgroundColor: `${sunnyColor}20` },
                ]}
              >
                <Ionicons name="sunny" size={24} color={sunnyColor} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={[styles.scheduleTitle, { color: theme.text }]}>
                  Naptime
                </Text>
                <Text
                  style={[
                    styles.scheduleDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.naptime}
                </Text>
                <Text
                  style={[
                    styles.scheduleSubDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.naptimeHours}
                </Text>

                {/* Percentage chart for nap time */}
                <View style={styles.percentageContainer}>
                  <View style={styles.percentageRow}>
                    <Text style={[styles.scheduleGoal, { color: sunnyColor }]}>
                      Goal:{" "}
                      {Math.round(
                        recommendations.minHours *
                          (recommendations.recommendedNapHours /
                            (recommendations.recommendedNapHours +
                              recommendations.recommendedNightHours))
                      )}{" "}
                      hours
                    </Text>

                    {/* Calculate percentage */}
                    {(() => {
                      const napValue = Number.parseFloat(napHours) || 0;
                      const napGoal = Math.round(
                        recommendations.minHours *
                          (recommendations.recommendedNapHours /
                            (recommendations.recommendedNapHours +
                              recommendations.recommendedNightHours))
                      );
                      const napPercentage =
                        napGoal > 0
                          ? Math.min(
                              100,
                              Math.round((napValue / napGoal) * 100)
                            )
                          : 0;
                      const isNapSufficient = napPercentage >= 100;

                      return (
                        <Text
                          style={[
                            styles.percentageText,
                            {
                              color: isNapSufficient
                                ? theme.success
                                : theme.danger,
                            },
                          ]}
                        >
                          {napPercentage}%
                        </Text>
                      );
                    })()}
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${(() => {
                            const napValue = Number.parseFloat(napHours) || 0;
                            const napGoal = Math.round(
                              recommendations.minHours *
                                (recommendations.recommendedNapHours /
                                  (recommendations.recommendedNapHours +
                                    recommendations.recommendedNightHours))
                            );
                            return napGoal > 0
                              ? Math.min(
                                  100,
                                  Math.round((napValue / napGoal) * 100)
                                )
                              : 0;
                          })()}%`,
                          backgroundColor: (() => {
                            const napValue = Number.parseFloat(napHours) || 0;
                            const napGoal = Math.round(
                              recommendations.minHours *
                                (recommendations.recommendedNapHours /
                                  (recommendations.recommendedNapHours +
                                    recommendations.recommendedNightHours))
                            );
                            const napPercentage =
                              napGoal > 0
                                ? Math.min(
                                    100,
                                    Math.round((napValue / napGoal) * 100)
                                  )
                                : 0;
                            return napPercentage >= 100
                              ? theme.success
                              : theme.danger;
                          })(),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.scheduleCard}>
              <View
                style={[
                  styles.scheduleIconContainer,
                  { backgroundColor: `${theme.info}20` },
                ]}
              >
                <Ionicons name="moon" size={24} color={theme.info} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={[styles.scheduleTitle, { color: theme.text }]}>
                  Bedtime
                </Text>
                <Text
                  style={[
                    styles.scheduleDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.bedtime}
                </Text>
                <Text
                  style={[
                    styles.scheduleSubDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.bedtimeHours}
                </Text>

                {/* Percentage chart for bedtime */}
                <View style={styles.percentageContainer}>
                  <View style={styles.percentageRow}>
                    <Text style={[styles.scheduleGoal, { color: theme.info }]}>
                      Goal:{" "}
                      {Math.round(
                        recommendations.minHours *
                          (recommendations.recommendedNightHours /
                            (recommendations.recommendedNapHours +
                              recommendations.recommendedNightHours))
                      )}{" "}
                      hours
                    </Text>

                    {/* Calculate percentage */}
                    {(() => {
                      const nightValue = Number.parseFloat(nightHours) || 0;
                      const nightGoal = Math.round(
                        recommendations.minHours *
                          (recommendations.recommendedNightHours /
                            (recommendations.recommendedNapHours +
                              recommendations.recommendedNightHours))
                      );
                      const nightPercentage =
                        nightGoal > 0
                          ? Math.min(
                              100,
                              Math.round((nightValue / nightGoal) * 100)
                            )
                          : 0;
                      const isNightSufficient = nightPercentage >= 100;

                      return (
                        <Text
                          style={[
                            styles.percentageText,
                            {
                              color: isNightSufficient
                                ? theme.success
                                : theme.danger,
                            },
                          ]}
                        >
                          {nightPercentage}%
                        </Text>
                      );
                    })()}
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${(() => {
                            const nightValue =
                              Number.parseFloat(nightHours) || 0;
                            const nightGoal = Math.round(
                              recommendations.minHours *
                                (recommendations.recommendedNightHours /
                                  (recommendations.recommendedNapHours +
                                    recommendations.recommendedNightHours))
                            );
                            return nightGoal > 0
                              ? Math.min(
                                  100,
                                  Math.round((nightValue / nightGoal) * 100)
                                )
                              : 0;
                          })()}%`,
                          backgroundColor: (() => {
                            const nightValue =
                              Number.parseFloat(nightHours) || 0;
                            const nightGoal = Math.round(
                              recommendations.minHours *
                                (recommendations.recommendedNightHours /
                                  (recommendations.recommendedNapHours +
                                    recommendations.recommendedNightHours))
                            );
                            const nightPercentage =
                              nightGoal > 0
                                ? Math.min(
                                    100,
                                    Math.round((nightValue / nightGoal) * 100)
                                  )
                                : 0;
                            return nightPercentage >= 100
                              ? theme.success
                              : theme.danger;
                          })(),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.totalGoalContainer}>
              <Text style={[styles.totalGoalText, { color: theme.text }]}>
                Total Sleep Goal:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {recommendations.minHours}-{recommendations.maxHours} hours
                </Text>
              </Text>
            </View>
          </View>

          {/* Sleep Tips */}
          <View
            style={[
              styles.tipsContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Age-Appropriate Sleep Tips
            </Text>
            <View style={styles.tipsList}>
              {childAgeInMonths < 4 ? (
                // Newborn tips
                <>
                  <View style={styles.tipItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.success}
                      style={styles.tipIcon}
                    />
                    <Text style={[styles.tipText, { color: theme.text }]}>
                      Put baby to sleep drowsy but awake to develop
                      self-soothing skills
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
                      Keep nighttime feedings calm and quiet with minimal
                      stimulation
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
                      Follow safe sleep guidelines: firm mattress, no loose
                      bedding, on back
                    </Text>
                  </View>
                </>
              ) : childAgeInMonths <= 12 ? (
                // Infant tips
                <>
                  <View style={styles.tipItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.success}
                      style={styles.tipIcon}
                    />
                    <Text style={[styles.tipText, { color: theme.text }]}>
                      Establish a consistent bedtime routine with calming
                      activities
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
                      Begin to establish regular nap times during the day
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
                      Create a sleep-friendly environment that's dark, quiet,
                      and comfortable
                    </Text>
                  </View>
                </>
              ) : childAgeInMonths <= 24 ? (
                // Toddler tips
                <>
                  <View style={styles.tipItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.success}
                      style={styles.tipIcon}
                    />
                    <Text style={[styles.tipText, { color: theme.text }]}>
                      Maintain consistent nap and bedtime schedules, even on
                      weekends
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
                      Address bedtime resistance with clear boundaries and
                      reassurance
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
                      Use a comfort object like a special blanket or stuffed
                      animal
                    </Text>
                  </View>
                </>
              ) : childAgeInMonths <= 60 ? (
                // Preschooler tips
                <>
                  <View style={styles.tipItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.success}
                      style={styles.tipIcon}
                    />
                    <Text style={[styles.tipText, { color: theme.text }]}>
                      Limit screen time at least 1 hour before bedtime
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
                      Address nighttime fears with reassurance and nightlights
                      if needed
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
                      If transitioning away from naps, implement quiet time
                      instead
                    </Text>
                  </View>
                </>
              ) : (
                // School-age tips
                <>
                  <View style={styles.tipItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.success}
                      style={styles.tipIcon}
                    />
                    <Text style={[styles.tipText, { color: theme.text }]}>
                      Maintain a consistent sleep schedule, even on weekends and
                      holidays
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
                      Avoid caffeine and sugary foods, especially in the
                      afternoon and evening
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
                      Limit homework, screen time, and activities close to
                      bedtime
                    </Text>
                  </View>
                </>
              )}
            </View>
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
});

export default SleepDetailsScreen;
