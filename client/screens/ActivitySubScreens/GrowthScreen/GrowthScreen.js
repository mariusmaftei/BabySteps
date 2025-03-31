"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";
import * as growthService from "../../../services/growth-service";
import * as childService from "../../../services/child-service";

import GrowthMeasurementsInput from "../../../components/UI/Inputs/GrowthMeasurementsInput";
import ChildInfoCard from "../../../components/UI/Cards/ChildInfoCard";
import ChildRecommendationCard from "../../../components/UI/Cards/ChildRecommendationCard";
import BirthDataCard from "../../../components/UI/Cards/BirthDataCard";
import AreaChart from "../../../components/UI/Charts/AreaChart";

import {
  getWHOStandards,
  getGrowthRecommendations,
} from "../../../utils/growth-utils";

export default function GrowthScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [latestRecord, setLatestRecord] = useState(null);
  const [previousRecord, setPreviousRecord] = useState(null);
  const [birthWeight, setBirthWeight] = useState(null);
  const [birthHeight, setBirthHeight] = useState(null);
  const [birthHeadCirc, setBirthHeadCirc] = useState(null);
  const [hasExistingMeasurements, setHasExistingMeasurements] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [targetWeight, setTargetWeight] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [targetHeadCirc, setTargetHeadCirc] = useState(0);

  const [progressValues, setProgressValues] = useState({
    weightProgress: 0,
    heightProgress: 0,
    headCircProgress: 0,
  });

  const [currentWeight, setCurrentWeight] = useState("");
  const [previousWeight, setPreviousWeight] = useState("");
  const [currentHeight, setCurrentHeight] = useState("");
  const [previousHeight, setPreviousHeight] = useState("");
  const [currentHeadCirc, setCurrentHeadCirc] = useState("");
  const [previousHeadCirc, setPreviousHeadCirc] = useState("");
  const [notes, setNotes] = useState("");

  const [weightGain, setWeightGain] = useState(0);
  const [heightGain, setHeightGain] = useState(0);
  const [headCircGain, setHeadCircGain] = useState(0);

  const getBarChartData = useCallback(() => {
    let birthWeightValue = birthWeight ? Number.parseFloat(birthWeight) : 0;
    if (isNaN(birthWeightValue)) {
      birthWeightValue = 0;
    }

    const hasPreviousRecord = previousRecord !== null || previousWeight !== "";
    const currentWeightValue = Number.parseFloat(currentWeight) || 0;

    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthWeightValue, currentWeightValue],
            colors: [
              (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            ],
          },
        ],
      };
    }

    return {
      labels: ["Birth", "Previous", "New Measurement"],
      datasets: [
        {
          data: [
            birthWeightValue,
            Number.parseFloat(previousWeight) || 0,
            currentWeightValue,
          ],
          colors: [
            (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
            (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          ],
        },
      ],
    };
  }, [birthWeight, previousRecord, previousWeight, currentWeight]);

  const getHeightChartData = useCallback(() => {
    let birthHeightValue = birthHeight ? Number.parseFloat(birthHeight) : 0;
    if (isNaN(birthHeightValue)) {
      birthHeightValue = 0;
    }
    const hasPreviousRecord = previousRecord !== null || previousHeight !== "";
    const currentHeightValue = Number.parseFloat(currentHeight) || 0;

    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthHeightValue, currentHeightValue],
            colors: [
              (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            ],
          },
        ],
      };
    }

    return {
      labels: ["Birth", "Previous", "New Measurement"],
      datasets: [
        {
          data: [
            birthHeightValue,
            Number.parseFloat(previousHeight) || 0,
            currentHeightValue,
          ],
          colors: [
            (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
            (opacity = 1) => `rgba(134, 65, 44, ${opacity})`,
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          ],
        },
      ],
    };
  }, [birthHeight, previousRecord, previousHeight, currentHeight]);

  const getHeadCircChartData = useCallback(() => {
    let birthHeadCircValue = birthHeadCirc
      ? Number.parseFloat(birthHeadCirc)
      : 0;
    if (isNaN(birthHeadCircValue)) {
      birthHeadCircValue = 0;
    }
    const hasPreviousRecord =
      previousRecord !== null || previousHeadCirc !== "";
    const currentHeadCircValue = Number.parseFloat(currentHeadCirc) || 0;

    if (!hasPreviousRecord) {
      return {
        labels: ["Birth", "New Measurement"],
        datasets: [
          {
            data: [birthHeadCircValue, currentHeadCircValue],
            colors: [
              (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
              (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            ],
          },
        ],
      };
    }

    return {
      labels: ["Birth", "Previous", "New Measurement"],
      datasets: [
        {
          data: [
            birthHeadCircValue,
            Number.parseFloat(previousHeadCirc) || 0,
            currentHeadCircValue,
          ],
          colors: [
            (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
            (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          ],
        },
      ],
    };
  }, [birthHeadCirc, previousRecord, previousHeadCirc, currentHeadCirc]);

  const childAgeText = currentChild.age;
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;
  const childGender = currentChild.gender
    ? currentChild.gender.toLowerCase()
    : "boys";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentStandards = getWHOStandards(childAgeInMonths, childGender);
    const nextMonthStandards = getWHOStandards(
      childAgeInMonths + 1,
      childGender
    );

    const whoWeightTarget = Math.round(
      (nextMonthStandards.weight - currentStandards.weight) * 1000
    );
    setTargetWeight(whoWeightTarget > 0 ? whoWeightTarget : 500);

    const whoHeightTarget = Math.round(
      (nextMonthStandards.height - currentStandards.height) * 10
    );
    setTargetHeight(whoHeightTarget > 0 ? whoHeightTarget : 10);

    const whoHeadCircTarget = Math.round(
      (nextMonthStandards.headCirc - currentStandards.headCirc) * 10
    );
    setTargetHeadCirc(whoHeadCircTarget > 0 ? whoHeadCircTarget : 5);
  }, [childAgeInMonths, childGender]);

  const loadGrowthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const childDetails = await childService.getChildById(currentChild.id);

        if (childDetails) {
          if (childDetails.birthWeight) {
            setBirthWeight(childDetails.birthWeight.toString());
          }
          if (childDetails.birthHeight) {
            setBirthHeight(childDetails.birthHeight.toString());
          }
          if (childDetails.birthHeadCircumference) {
            setBirthHeadCirc(childDetails.birthHeadCircumference.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching child details:", error);
      }

      if (!birthWeight && currentChild.birthWeight) {
        setBirthWeight(currentChild.birthWeight.toString());
      }
      if (!birthHeight && currentChild.birthHeight) {
        setBirthHeight(currentChild.birthHeight.toString());
      }
      if (!birthHeadCirc && currentChild.birthHeadCircumference) {
        setBirthHeadCirc(currentChild.birthHeadCircumference.toString());
      }

      try {
        const records = await growthService.getGrowthRecords(currentChild.id);
        if (records && records.length > 0) {
          setHasExistingMeasurements(true);
        }
      } catch (error) {
        setHasExistingMeasurements(false);
        setCurrentWeight("");
        setCurrentHeight("");
        setCurrentHeadCirc("");
      }

      try {
        const latest = await growthService.getLatestGrowthRecord(
          currentChild.id
        );
        setLatestRecord(latest);
        setCurrentWeight(latest.weight.toString());
        setCurrentHeight(latest.height.toString());
        setCurrentHeadCirc(latest.headCircumference.toString());
        setHasExistingMeasurements(true);

        if (
          latest.weightProgress !== undefined &&
          latest.heightProgress !== undefined &&
          latest.headCircumferenceProgress !== undefined
        ) {
          setProgressValues({
            weightProgress: latest.weightProgress,
            heightProgress: latest.heightProgress,
            headCircProgress: latest.headCircProgress,
          });
        }
      } catch (error) {
        setLatestRecord(null);
        setCurrentWeight("");
        setCurrentHeight("");
        setCurrentHeadCirc("");
        setHasExistingMeasurements(false);
      }

      try {
        const previous = await growthService.getPreviousGrowthRecord(
          currentChild.id
        );
        setPreviousRecord(previous);
        setPreviousWeight(previous.weight.toString());
        setPreviousHeight(previous.height.toString());
        setPreviousHeadCirc(previous.headCircumference.toString());
      } catch (error) {
        setPreviousRecord(null);
        setPreviousWeight("");
        setPreviousHeight("");
        setPreviousHeadCirc("");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading growth data:", error);
      setError("Failed to load growth data");
      setLoading(false);
    }
  }, [currentChild.id, currentChild, birthWeight, birthHeight, birthHeadCirc]);

  useFocusEffect(
    useCallback(() => {
      loadGrowthData();
    }, [loadGrowthData])
  );

  useEffect(() => {
    const currWeight = Number.parseFloat(currentWeight) || 0;

    if ((!previousRecord || previousWeight === "") && birthWeight) {
      const birthWeightVal = Number.parseFloat(birthWeight) || 0;
      setWeightGain(Math.round(currWeight - birthWeightVal));
    } else {
      const prevWeight = Number.parseFloat(previousWeight) || 0;
      setWeightGain(Math.round(currWeight - prevWeight));
    }

    const currHeight = Number.parseFloat(currentHeight) || 0;

    if ((!previousRecord || previousHeight === "") && birthHeight) {
      const birthHeightVal = Number.parseFloat(birthHeight) || 0;
      setHeightGain(Math.round(currHeight - birthHeightVal));
    } else {
      const prevHeight = Number.parseFloat(previousHeight) || 0;
      setHeightGain(Math.round(currHeight - prevHeight));
    }

    const currHeadCirc = Number.parseFloat(currentHeadCirc) || 0;

    if ((!previousRecord || previousHeadCirc === "") && birthHeadCirc) {
      const birthHeadCircVal = Number.parseFloat(birthHeadCirc) || 0;
      setHeadCircGain(Math.round(currHeadCirc - birthHeadCircVal));
    } else {
      const prevHeadCirc = Number.parseFloat(previousHeadCirc) || 0;
      setHeadCircGain(Math.round(currHeadCirc - prevHeadCirc));
    }
  }, [
    currentWeight,
    previousWeight,
    currentHeight,
    previousHeight,
    currentHeadCirc,
    previousHeadCirc,
    birthWeight,
    birthHeight,
    birthHeadCirc,
    previousRecord,
  ]);

  const recommendations = useMemo(
    () => getGrowthRecommendations(childAgeInMonths, childGender),
    [childAgeInMonths, childGender]
  );

  const handleWeightChange = (type, value) => {
    const validatedValue = value.replace(/[^0-9]/g, "");

    if (validatedValue.length > 3) {
      return;
    }

    if (type === "current") {
      setCurrentWeight(validatedValue);
    } else {
      setPreviousWeight(validatedValue);
    }
  };

  const handleMeasurementChange = (type, value, setter) => {
    const validatedValue = value.replace(/[^0-9]/g, "");

    if (validatedValue.length > 2) {
      return;
    }

    setter(validatedValue);
  };

  const handleProgressCalculated = (values) => {
    setProgressValues(values);
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    const d = new Date(date);

    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  };

  const saveGrowthData = async () => {
    try {
      if (!currentWeight || !currentHeight || !currentHeadCirc) {
        Alert.alert(
          "Missing Information",
          "Please enter values for weight, height, and head circumference. These fields are required.",
          [{ text: "OK" }]
        );
        return;
      }

      setLoading(true);

      const weightInGrams = Math.round(Number.parseFloat(currentWeight || "0"));
      const heightInMm = Math.round(Number.parseFloat(currentHeight || "0"));
      const headCircInMm = Math.round(
        Number.parseFloat(currentHeadCirc || "0")
      );

      if (isNaN(weightInGrams) || isNaN(heightInMm) || isNaN(headCircInMm)) {
        Alert.alert(
          "Invalid Input",
          "Please enter valid numbers for weight, height, and head circumference"
        );
        setLoading(false);
        return;
      }

      const dateTimeString = formatDateTime(currentDateTime);
      const updatedNotes = notes
        ? `${notes}\n\nMeasured on: ${dateTimeString}`
        : `Measured on: ${dateTimeString}`;

      const growthData = {
        childId: currentChild.id,
        weight: weightInGrams,
        height: heightInMm,
        headCircumference: headCircInMm,
        notes: updatedNotes,
        weightProgress: progressValues.weightProgress,
        heightProgress: progressValues.heightProgress,
        headCircumferenceProgress: progressValues.headCircProgress,
      };

      let result;

      if (isEditMode && latestRecord) {
        result = await growthService.updateGrowthRecord(
          latestRecord.id,
          growthData
        );
        Alert.alert("Success", "Growth record updated successfully");
      } else {
        result = await growthService.createGrowthRecord(growthData);
        Alert.alert("Success", "Growth record saved successfully");
      }

      await loadGrowthData();
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving growth data:", error);

      let errorMessage = "Failed to save growth data";

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not recorded";

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Not recorded";
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Not recorded";
    }
  };

  const getChildBirthDate = () => {
    if (currentChild.birthDate) return formatDate(currentChild.birthDate);
    if (currentChild.dateOfBirth) return formatDate(currentChild.dateOfBirth);
    if (currentChild.dob) return formatDate(currentChild.dob);
    if (currentChild.birth_date) return formatDate(currentChild.birth_date);

    if (childAgeInMonths) {
      const estimatedBirthDate = new Date();
      estimatedBirthDate.setMonth(
        estimatedBirthDate.getMonth() - childAgeInMonths
      );
      return formatDate(estimatedBirthDate);
    }

    return "Not recorded";
  };

  const isWeightGainSufficient = weightGain >= recommendations.minWeightGain;
  const isHeightGainSufficient = heightGain >= recommendations.minHeightGain;
  const isHeadCircGainSufficient =
    headCircGain >= recommendations.minHeightGain;

  const calculateGrowthPercentage = (actual, min) => {
    if (min === 0) return 100;
    const percentage = Math.round((actual / min) * 100);
    return Math.min(percentage, 100);
  };

  const weightGainPercentage = calculateGrowthPercentage(
    weightGain,
    recommendations.minWeightGain
  );
  const heightGainPercentage = calculateGrowthPercentage(
    heightGain,
    recommendations.minHeightGain
  );
  const headCircGainPercentage = calculateGrowthPercentage(
    headCircGain,
    recommendations.minHeadCircGain
  );

  useEffect(() => {
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
      title: `${currentChild.name.split(" ")[0]}'s Growth Details`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

  if (loading && !latestRecord && !previousRecord) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading growth data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !latestRecord && !previousRecord) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadGrowthData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.dateTimeBanner,
            { backgroundColor: `${theme.primary}20` },
          ]}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={theme.primary}
            style={styles.dateTimeBannerIcon}
          />
          <Text style={[styles.dateTimeBannerText, { color: theme.text }]}>
            Current date and time: {formatDateTime(currentDateTime)}
          </Text>
        </View>

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

        <ChildRecommendationCard
          theme={theme}
          childAgeInMonths={childAgeInMonths}
          childGender={childGender}
          recommendations={recommendations}
          weightGain={weightGain}
          heightGain={heightGain}
          headCircGain={headCircGain}
          isWeightGainSufficient={isWeightGainSufficient}
          isHeightGainSufficient={isHeightGainSufficient}
          isHeadCircGainSufficient={isHeadCircGainSufficient}
          weightGainPercentage={weightGainPercentage}
          heightGainPercentage={heightGainPercentage}
          headCircGainPercentage={headCircGainPercentage}
          targetWeight={targetWeight}
          targetHeight={targetHeight}
          targetHeadCirc={targetHeadCirc}
          screenType="growth"
          whoStandard={recommendations.whoStandard}
        />

        <BirthDataCard
          theme={theme}
          childAgeInMonths={childAgeInMonths}
          birthWeight={birthWeight}
          birthHeight={birthHeight}
          birthHeadCirc={birthHeadCirc}
          childGender={childGender}
          recommendations={recommendations}
          childName={currentChild.name.split(" ")[0]}
          birthDate={getChildBirthDate()}
        />

        <AreaChart
          theme={theme}
          getBarChartData={getBarChartData}
          getHeightChartData={getHeightChartData}
          getHeadCircChartData={getHeadCircChartData}
          weightGain={weightGain}
          heightGain={heightGain}
          headCircGain={headCircGain}
          isWeightGainSufficient={isWeightGainSufficient}
          isHeightGainSufficient={isHeightGainSufficient}
          isHeadCircGainSufficient={isHeadCircGainSufficient}
          recommendations={recommendations}
          targetWeight={targetWeight}
          targetHeight={targetHeight}
          targetHeadCirc={targetHeadCirc}
          currentWeight={currentWeight}
          currentHeight={currentHeight}
          currentHeadCirc={currentHeadCirc}
          birthWeight={birthWeight}
          birthHeight={birthHeight}
          birthHeadCirc={birthHeadCirc}
          onProgressCalculated={handleProgressCalculated}
        />

        <View
          style={[
            styles.timingMessageContainer,
            { backgroundColor: `${theme.primary}15` },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={theme.primary}
            style={styles.timingIcon}
          />
          <Text style={[styles.timingMessageText, { color: theme.text }]}>
            New growth record can be made tomorrow at 12:00 PM
          </Text>
        </View>

        <GrowthMeasurementsInput
          theme={theme}
          isEditMode={isEditMode}
          hasExistingMeasurements={hasExistingMeasurements}
          latestRecord={latestRecord}
          setIsEditMode={setIsEditMode}
          formatDate={formatDate}
          previousRecord={previousRecord}
          previousWeight={previousWeight}
          handleWeightChange={handleWeightChange}
          currentWeight={currentWeight}
          previousHeight={previousHeight}
          handleMeasurementChange={handleMeasurementChange}
          setPreviousHeight={setPreviousHeight}
          currentHeight={currentHeight}
          setCurrentHeight={setCurrentHeight}
          previousHeadCirc={previousHeadCirc}
          setPreviousHeadCirc={setPreviousHeadCirc}
          currentHeadCirc={currentHeadCirc}
          setCurrentHeadCirc={setCurrentHeadCirc}
          notes={notes}
          setNotes={setNotes}
          weightGain={weightGain}
          heightGain={heightGain}
          headCircGain={headCircGain}
          loading={loading}
          saveGrowthData={saveGrowthData}
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
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  dateTimeBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  dateTimeBannerIcon: {
    marginRight: 5,
  },
  dateTimeBannerText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  measurementsCard: {
    marginHorizontal: 10,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  measurementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  measurementItem: {
    flex: 1,
    alignItems: "center",
  },
  measurementLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  measurementGain: {
    fontSize: 12,
    marginTop: 3,
  },
  lastMeasuredText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "right",
  },
  headerButton: {
    marginRight: 15,
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
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  timingMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#5a87ff",
  },
  timingIcon: {
    marginRight: 8,
  },
  timingMessageText: {
    fontSize: 14,
    flex: 1,
  },
});
