import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useChildActivity } from "../../../context/child-activity-context";
import { useTheme } from "../../../context/theme-context";
import CustomButton from "../../../components/UI/Button/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  getSleepByChild,
  saveSleepData,
  updateSleepData,
  getLocalDateTimeString,
  extractDateFromDateTime,
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
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [napHours, setNapHours] = useState("");
  const [nightHours, setNightHours] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentDate, setCurrentDate] = useState(getLocalDateTimeString());
  const [customTotalHours, setCustomTotalHours] = useState(0);
  const [showingYesterdayData, setShowingYesterdayData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [sleepPercentage, setSleepPercentage] = useState(0);
  const [isFirstRecord, setIsFirstRecord] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const [isDefaultData, setIsDefaultData] = useState(false);

  const hasActualData = () => {
    const napValue = Number.parseFloat(napHours) || 0;
    const nightValue = Number.parseFloat(nightHours) || 0;
    return napValue > 0 || nightValue > 0;
  };

  useEffect(() => {
    if (isFirstRecord || !hasActualData()) {
      setIsEditMode(true);
    }
  }, [isFirstRecord, napHours, nightHours]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const datePart = dateString.includes(" ")
      ? dateString.split(" ")[0]
      : dateString;
    const date = new Date(datePart);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getChildAgeInMonths = () => {
    if (!currentChild || !currentChild.age) return 24;

    const ageText = currentChild.age;
    const ageNum = Number.parseInt(ageText.split(" ")[0]) || 0;
    const ageUnit = ageText.includes("month") ? "months" : "years";

    return ageUnit === "months" ? ageNum : ageNum * 12;
  };

  const getSleepRecommendations = (ageInMonths) => {
    const cappedAge = Math.min(ageInMonths, 12);

    if (cappedAge < 4) {
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
    } else {
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
    }
  };

  const updateTotalHours = (nap, night) => {
    const napValue = nap === "" ? 0 : Number.parseFloat(nap) || 0;
    const nightValue = night === "" ? 0 : Number.parseFloat(night) || 0;
    setCustomTotalHours(napValue + nightValue);
  };

  const childAgeInMonths = getChildAgeInMonths();
  const recommendations = getSleepRecommendations(childAgeInMonths);

  const isSleepSufficient = customTotalHours >= recommendations.minHours;

  const calculateSleepPercentage = () => {
    const diff = customTotalHours - recommendations.minHours;
    const percentage = Math.round((diff / recommendations.minHours) * 100);
    setSleepPercentage(percentage);
    return percentage;
  };

  const sleepPercentageText =
    sleepPercentage >= 0 ? `+${sleepPercentage}%` : `${sleepPercentage}%`;

  const sunnyColor = "#FF9500";

  useFocusEffect(
    useCallback(() => {
      if (currentChildId) {
        loadSleepData();
      }
      return () => {};
    }, [currentChildId])
  );

  useEffect(() => {
    calculateSleepPercentage();
  }, [customTotalHours, recommendations.minHours]);

  useEffect(() => {
    if (justSaved && savedRecord) {
      console.log(
        "Using saved record instead of fetching (just saved):",
        savedRecord
      );
      setSelectedRecord(savedRecord);
      setNapHours(savedRecord.napHours.toString());
      setNightHours(savedRecord.nightHours.toString());
      setNotes(savedRecord.notes || "");
      setCurrentDate(savedRecord.date);
      updateTotalHours(
        savedRecord.napHours.toString(),
        savedRecord.nightHours.toString()
      );

      const hasData = savedRecord.napHours > 0 || savedRecord.nightHours > 0;
      setIsEditMode(!hasData);

      setIsDefaultData(false);

      if (savedRecord.sleepProgress !== undefined) {
        setSleepPercentage(savedRecord.sleepProgress);
      } else {
        calculateSleepPercentage();
      }

      setJustSaved(false);
      setSavedRecord(null);
    }
  }, [justSaved, savedRecord]);

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

  const handleRefresh = () => {
    setRefreshing(true);
    loadSleepData().finally(() => {
      setRefreshing(false);
    });
  };

  const loadSleepData = async () => {
    setLoading(true);
    try {
      if (justSaved && savedRecord) {
        console.log(
          "Using saved record instead of fetching (just saved):",
          savedRecord
        );
        setSelectedRecord(savedRecord);
        setNapHours(savedRecord.napHours.toString());
        setNightHours(savedRecord.nightHours.toString());
        setNotes(savedRecord.notes || "");
        setCurrentDate(savedRecord.date);
        updateTotalHours(
          savedRecord.napHours.toString(),
          savedRecord.nightHours.toString()
        );

        const hasData = savedRecord.napHours > 0 || savedRecord.nightHours > 0;
        setIsEditMode(!hasData);
        setIsDefaultData(false);

        if (savedRecord.sleepProgress !== undefined) {
          setSleepPercentage(savedRecord.sleepProgress);
        } else {
          calculateSleepPercentage();
        }

        setJustSaved(false);
        setSavedRecord(null);
        setLoading(false);
        return;
      }

      const allSleepRecords = await getSleepByChild(currentChildId);
      const sortedRecords = allSleepRecords.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const todayFullDateTime = getLocalDateTimeString();
      const todayLocalDate = extractDateFromDateTime(todayFullDateTime);
      const nowHour = new Date().getHours();

      let recordForToday = null;
      if (sortedRecords && sortedRecords.length > 0) {
        recordForToday = sortedRecords.find((record) => {
          const recordDatePart = extractDateFromDateTime(record.date);
          return recordDatePart === todayLocalDate;
        });
      }

      if (recordForToday) {
        console.log("Found sleep record for today:", recordForToday);
        setSelectedRecord(recordForToday);
        setNapHours(recordForToday.napHours.toString());
        setNightHours(recordForToday.nightHours.toString());
        setNotes(recordForToday.notes || "");
        setCurrentDate(recordForToday.date);
        updateTotalHours(
          recordForToday.napHours.toString(),
          recordForToday.nightHours.toString()
        );

        const hasData =
          recordForToday.napHours > 0 || recordForToday.nightHours > 0;
        setIsEditMode(!hasData);
        setIsDefaultData(recordForToday.isDefaultData || false);
        setIsFirstRecord(false);

        if (recordForToday.sleepProgress !== undefined) {
          setSleepPercentage(recordForToday.sleepProgress);
        } else {
          calculateSleepPercentage();
        }

        const recordDate = new Date(
          extractDateFromDateTime(recordForToday.date)
        );
        const todayDate = new Date(todayLocalDate);
        const isRecordFromYesterday =
          recordDate.getDate() === todayDate.getDate() - 1 && nowHour < 12;
        setShowingYesterdayData(isRecordFromYesterday);
      } else {
        console.log("No sleep record found for today. Allowing new record.");
        resetForm();
        setIsFirstRecord(true);

        setShowingYesterdayData(nowHour < 12);
      }
    } catch (error) {
      console.error("Error loading sleep data:", error);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const today = getLocalDateTimeString();

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
      sleepProgress: 0,
      isDefaultData: true,
    });
    setCurrentDate(today);
    updateTotalHours("0", "0");
    setIsEditMode(true);
    setSleepPercentage(0);
    setIsDefaultData(true);
  };

  const handleSelectSleepRecord = (record) => {
    setSelectedRecord(record);
    setNapHours(record.napHours.toString());
    setNightHours(record.nightHours.toString());
    setNotes(record.notes || "");
    setCurrentDate(record.date);
    updateTotalHours(record.napHours.toString(), record.nightHours.toString());

    const hasData = record.napHours > 0 || record.nightHours > 0;
    setIsEditMode(!hasData);

    setIsDefaultData(record.isDefaultData || false);

    if (record.sleepProgress !== undefined) {
      setSleepPercentage(record.sleepProgress);
    } else {
      calculateSleepPercentage();
    }
  };

  const handleNapHoursChange = (value) => {
    const validatedValue = value.replace(/[^0-9.]/g, "");

    if (validatedValue.length > 4) {
      return;
    } else {
      setNapHours(validatedValue);
      updateTotalHours(validatedValue, nightHours);
    }
  };

  const handleNightHoursChange = (value) => {
    const validatedValue = value.replace(/[^0-9.]/g, "");

    if (validatedValue.length > 4) {
      return;
    } else {
      setNightHours(validatedValue);
      updateTotalHours(napHours, validatedValue);
    }
  };

  const handleSaveSleepData = async () => {
    console.log("=== SAVE SLEEP DATA DEBUG ===");
    console.log("Current child ID:", currentChildId);
    console.log("Nap hours:", napHours);
    console.log("Night hours:", nightHours);
    console.log("Notes:", notes);
    console.log("Selected record:", selectedRecord);
    console.log("Is edit mode:", isEditMode);

    if (!currentChildId) {
      Alert.alert("Error", "No child selected");
      return;
    }

    const napValue = Number.parseFloat(napHours) || 0;
    const nightValue = Number.parseFloat(nightHours) || 0;

    console.log("Parsed values - Nap:", napValue, "Night:", nightValue);

    if (napValue < 0 || nightValue < 0) {
      Alert.alert("Invalid Input", "Sleep hours cannot be negative");
      return;
    }

    if (napValue > 24 || nightValue > 24) {
      Alert.alert("Invalid Input", "Sleep hours cannot exceed 24 hours");
      return;
    }

    if (napValue === 0 && nightValue === 0) {
      Alert.alert("Invalid Input", "Please enter at least some sleep hours");
      return;
    }

    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    setSaving(true);
    try {
      const currentPercentage = calculateSleepPercentage();

      const sleepData = {
        id: selectedRecord?.id,
        childId: currentChildId,
        napHours: napValue,
        nightHours: nightValue,
        notes: notes.trim(),
        sleepProgress: currentPercentage,
      };

      console.log("Sleep data prepared for saving:", sleepData);

      let result;
      if (selectedRecord?.id) {
        console.log("Updating existing record with ID:", selectedRecord.id);
        result = await updateSleepData(selectedRecord.id, sleepData);
      } else {
        console.log("Creating new sleep record");
        result = await saveSleepData(sleepData);
      }

      console.log("Save operation result:", result);

      if (result) {
        Alert.alert("Success", "Sleep data saved successfully!");

        setJustSaved(true);
        setSavedRecord(result);

        setIsFirstRecord(false);
      } else {
        Alert.alert("Error", "Failed to save sleep data");
      }
    } catch (error) {
      console.error("Error in handleSaveSleepData:", error);
      Alert.alert(
        "Save Error",
        `Failed to save sleep data: ${error.message || "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  };

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <ChildInfoCard
            childData={currentChild}
            customIcon={
              <Ionicons
                name="information-circle"
                size={24}
                color={theme.primary}
              />
            }
            customTitle="Child Information"
          />

          <ChildRecommendationCard
            childData={currentChild}
            screenType="sleep"
            customTitle="Sleep Guidelines"
          />

          <ColumnChart
            data={chartData}
            targetValues={targetValues}
            title="Daily Sleep Chart"
            showTargetLegend={false}
            targetLegendText="Recommended Sleep Hours"
          />

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

          {isFirstRecord && (
            <View
              style={[
                styles.infoBanner,
                { backgroundColor: `${theme.info}20` },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={18}
                color={theme.info}
                style={styles.bannerIcon}
              />
              <Text style={[styles.bannerText, { color: theme.text }]}>
                This is your first sleep record for this child. Enter the sleep
                hours and save to start tracking.
              </Text>
            </View>
          )}

          {isDefaultData && !isFirstRecord && (
            <View
              style={[
                styles.infoBanner,
                { backgroundColor: `${theme.info}20` },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={18}
                color={theme.info}
                style={styles.bannerIcon}
              />
              <Text style={[styles.bannerText, { color: theme.text }]}>
                This is a new day! Enter today's sleep data to start tracking.
              </Text>
            </View>
          )}

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

                <View style={styles.notesContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Notes (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        borderColor: theme.borderLight,
                        backgroundColor: theme.backgroundSecondary,
                        color: theme.text,
                      },
                    ]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any notes about sleep..."
                    placeholderTextColor={theme.textTertiary}
                    multiline
                    numberOfLines={3}
                    editable={isEditMode}
                  />
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

                {notes && (
                  <View style={styles.notesDisplay}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Notes:
                    </Text>
                    <Text style={[styles.notesText, { color: theme.text }]}>
                      {notes}
                    </Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: saving ? theme.textSecondary : theme.primary,
                },
              ]}
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

              <View style={styles.totalProgressBarContainer}>
                <View style={styles.centerLine} />

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
    fontSize: 14,
    fontWeight: "600",
  },
  ageGroupSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
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
    fontWeight: "600",
  },
  totalUnit: {
    fontSize: 14,
    marginTop: 4,
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
  notesContainer: {
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 80,
  },
  notesDisplay: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
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
