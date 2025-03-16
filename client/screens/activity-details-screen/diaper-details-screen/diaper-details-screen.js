import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BarChart, PieChart } from "react-native-chart-kit";
import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

const screenWidth = Dimensions.get("window").width;

export default function DiaperDetailsScreen({ navigation }) {
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

  // Diaper change state
  const [diaperChanges, setDiaperChanges] = useState([]);
  const [changeDate, setChangeDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedType, setSelectedType] = useState(null); // 'wet', 'dirty', 'both'
  const [selectedColor, setSelectedColor] = useState(null); // 'yellow', 'green', 'brown', 'black'
  const [selectedConsistency, setSelectedConsistency] = useState(null); // 'soft', 'firm', 'watery'

  // Mock data for demonstration
  const mockDiaperData = [
    {
      id: 1,
      date: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: "wet",
      color: null,
      consistency: null,
    },
    {
      id: 2,
      date: new Date(Date.now() - 1000 * 60 * 60 * 5),
      type: "dirty",
      color: "yellow",
      consistency: "soft",
    },
    {
      id: 3,
      date: new Date(Date.now() - 1000 * 60 * 60 * 8),
      type: "both",
      color: "brown",
      consistency: "firm",
    },
    {
      id: 4,
      date: new Date(Date.now() - 1000 * 60 * 60 * 12),
      type: "wet",
      color: null,
      consistency: null,
    },
    {
      id: 5,
      date: new Date(Date.now() - 1000 * 60 * 60 * 16),
      type: "dirty",
      color: "green",
      consistency: "watery",
    },
    {
      id: 6,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: "both",
      color: "brown",
      consistency: "soft",
    },
    {
      id: 7,
      date: new Date(Date.now() - 1000 * 60 * 60 * 30),
      type: "wet",
      color: null,
      consistency: null,
    },
  ];

  // Load mock data on component mount
  useEffect(() => {
    setDiaperChanges(mockDiaperData);
  }, []);

  // Diaper change recommendations based on age
  const getDiaperRecommendations = (ageInMonths) => {
    if (ageInMonths < 1) {
      // 0-1 month
      return {
        ageGroup: "Newborn (0-1 month)",
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
        ageGroup: "Infant (1-6 months)",
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
        ageGroup: "Older Infant (6-12 months)",
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
        ageGroup: "Toddler (12+ months)",
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
  const addDiaperChange = () => {
    if (!selectedType) {
      // Show error - type is required
      return;
    }

    const needsColorAndConsistency =
      selectedType === "dirty" || selectedType === "both";

    if (needsColorAndConsistency && (!selectedColor || !selectedConsistency)) {
      // Show error - color and consistency required for dirty diapers
      return;
    }

    const newChange = {
      id: Date.now(),
      date: changeDate,
      type: selectedType,
      color: needsColorAndConsistency ? selectedColor : null,
      consistency: needsColorAndConsistency ? selectedConsistency : null,
    };

    setDiaperChanges([newChange, ...diaperChanges]);

    // Reset form
    setSelectedType(null);
    setSelectedColor(null);
    setSelectedConsistency(null);
    setChangeDate(new Date());
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

  // Prepare data for color distribution chart (for dirty diapers)
  const getColorChartData = () => {
    // Get only dirty or both diapers
    const dirtyDiapers = diaperChanges.filter(
      (change) =>
        (change.type === "dirty" || change.type === "both") && change.color
    );

    // Count colors
    const yellowCount = dirtyDiapers.filter(
      (change) => change.color === "yellow"
    ).length;
    const greenCount = dirtyDiapers.filter(
      (change) => change.color === "green"
    ).length;
    const brownCount = dirtyDiapers.filter(
      (change) => change.color === "brown"
    ).length;
    const blackCount = dirtyDiapers.filter(
      (change) => change.color === "black"
    ).length;

    return {
      labels: ["Yellow", "Green", "Brown", "Black"],
      datasets: [
        {
          data: [yellowCount, greenCount, brownCount, blackCount],
          colors: [
            (opacity = 1) => `rgba(255, 204, 0, ${opacity})`,
            (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
            (opacity = 1) => `rgba(162, 132, 94, ${opacity})`,
            (opacity = 1) => `rgba(50, 50, 50, ${opacity})`,
          ],
        },
      ],
    };
  };

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

          <View style={styles.chartWrapper}>
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
                  style={[
                    styles.emptyChartText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No diaper changes recorded today
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Color Distribution Chart (for dirty diapers) */}
        {diaperChanges.some(
          (change) =>
            (change.type === "dirty" || change.type === "both") && change.color
        ) && (
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

            <View style={styles.chartWrapper}>
              <BarChart
                data={getColorChartData()}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: theme.cardBackground,
                  backgroundGradientTo: theme.cardBackground,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => theme.text,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                  propsForLabels: {
                    fontSize: 10,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: theme.borderLight,
                  },
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
                withCustomBarColorFromData
              />
            </View>
          </View>
        )}

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
                  💩 Dirty (Poop)
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
                  💦💩 Both (Wet & Dirty)
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
                backgroundColor: selectedType
                  ? theme.primary
                  : theme.backgroundSecondary,
                opacity: selectedType ? 1 : 0.5,
              },
            ]}
            onPress={addDiaperChange}
            disabled={!selectedType}
          >
            <Ionicons
              name="save"
              size={16}
              color="#FFFFFF"
              style={styles.saveButtonIcon}
            />
            <Text style={styles.saveButtonText}>Save Diaper Change</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Diaper Changes */}
        <View
          style={[
            styles.recentChangesContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="list"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Diaper Changes
            </Text>
          </View>

          {diaperChanges.length > 0 ? (
            <View style={styles.recentChangesList}>
              {diaperChanges.map((change, index) => {
                // Group by date
                const dateLabel = formatDate(change.date);
                const showDateHeader =
                  index === 0 ||
                  formatDate(diaperChanges[index - 1].date) !== dateLabel;

                return (
                  <React.Fragment key={change.id}>
                    {showDateHeader && (
                      <View style={styles.dateHeader}>
                        <Text
                          style={[
                            styles.dateHeaderText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {dateLabel}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.changeItem,
                        {
                          borderBottomColor: theme.borderLight,
                          borderBottomWidth:
                            index < diaperChanges.length - 1 ? 1 : 0,
                        },
                      ]}
                    >
                      <View style={styles.changeTimeContainer}>
                        <Text
                          style={[styles.changeTime, { color: theme.text }]}
                        >
                          {formatTime(change.date)}
                        </Text>
                      </View>

                      <View style={styles.changeDetailsContainer}>
                        <View style={styles.changeTypeContainer}>
                          {change.type === "wet" && (
                            <View
                              style={[
                                styles.changeTypeTag,
                                { backgroundColor: "#5A87FF20" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.changeTypeText,
                                  { color: "#5A87FF" },
                                ]}
                              >
                                💦 Wet
                              </Text>
                            </View>
                          )}
                          {change.type === "dirty" && (
                            <View
                              style={[
                                styles.changeTypeTag,
                                { backgroundColor: "#FF950020" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.changeTypeText,
                                  { color: "#FF9500" },
                                ]}
                              >
                                💩 Dirty
                              </Text>
                            </View>
                          )}
                          {change.type === "both" && (
                            <View
                              style={[
                                styles.changeTypeTag,
                                { backgroundColor: "#FF2D5520" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.changeTypeText,
                                  { color: "#FF2D55" },
                                ]}
                              >
                                💦💩 Both
                              </Text>
                            </View>
                          )}
                        </View>

                        {(change.type === "dirty" ||
                          change.type === "both") && (
                          <View style={styles.changePropertiesContainer}>
                            <View
                              style={[
                                styles.changePropertyTag,
                                { backgroundColor: theme.backgroundSecondary },
                              ]}
                            >
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
                                  styles.changePropertyText,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                {change.color
                                  ? change.color.charAt(0).toUpperCase() +
                                    change.color.slice(1)
                                  : "Unknown"}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.changePropertyTag,
                                { backgroundColor: theme.backgroundSecondary },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.changePropertyText,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                {change.consistency
                                  ? change.consistency.charAt(0).toUpperCase() +
                                    change.consistency.slice(1)
                                  : "Unknown"}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity style={styles.changeDeleteButton}>
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyListContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text
                style={[styles.emptyListText, { color: theme.textSecondary }]}
              >
                No diaper changes recorded yet
              </Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View
          style={[
            styles.recommendationsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Age-Appropriate Guidelines
            </Text>
          </View>

          <View style={styles.recommendationsContent}>
            <View
              style={[
                styles.recommendationCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View style={styles.recommendationHeader}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={theme.primary}
                  style={styles.recommendationIcon}
                />
                <Text
                  style={[styles.recommendationTitle, { color: theme.text }]}
                >
                  Expected Frequency
                </Text>
              </View>
              <Text
                style={[
                  styles.recommendationText,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.changesPerDay} per day
              </Text>
              <Text
                style={[
                  styles.recommendationSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                Wet: {recommendations.wetDiapers}
              </Text>
              <Text
                style={[
                  styles.recommendationSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                Dirty: {recommendations.dirtyDiapers}
              </Text>
            </View>

            <View
              style={[
                styles.recommendationCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View style={styles.recommendationHeader}>
                <Ionicons
                  name="color-palette"
                  size={20}
                  color="#FF9500"
                  style={styles.recommendationIcon}
                />
                <Text
                  style={[styles.recommendationTitle, { color: theme.text }]}
                >
                  Normal Stool Characteristics
                </Text>
              </View>
              <Text
                style={[
                  styles.recommendationSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                <Text style={{ fontWeight: "600" }}>Colors:</Text>{" "}
                {recommendations.normalColors}
              </Text>
              <Text
                style={[
                  styles.recommendationSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                <Text style={{ fontWeight: "600" }}>Consistency:</Text>{" "}
                {recommendations.normalConsistency}
              </Text>
            </View>

            <View
              style={[
                styles.recommendationCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <View style={styles.recommendationHeader}>
                <Ionicons
                  name="warning"
                  size={20}
                  color={theme.danger}
                  style={styles.recommendationIcon}
                />
                <Text
                  style={[styles.recommendationTitle, { color: theme.text }]}
                >
                  Warning Signs
                </Text>
              </View>
              <Text
                style={[
                  styles.recommendationSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                <Text style={{ fontWeight: "600" }}>Concerning Colors:</Text>{" "}
                {recommendations.warningColors}
              </Text>
              <Text
                style={[
                  styles.recommendationSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                <Text style={{ fontWeight: "600" }}>
                  Concerning Consistency:
                </Text>{" "}
                {recommendations.warningConsistency}
              </Text>
              <Text
                style={[styles.recommendationWarning, { color: theme.danger }]}
              >
                Contact your pediatrician if you notice these warning signs or
                any significant changes
              </Text>
            </View>
          </View>
        </View>

        {/* Diaper Care Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Diaper Care Tips
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
    alignItems: "center",
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
});
