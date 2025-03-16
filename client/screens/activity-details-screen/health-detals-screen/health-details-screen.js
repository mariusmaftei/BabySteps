import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

const screenWidth = Dimensions.get("window").width;

export default function HealthDetailsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);

  // Get child's age as a number for recommendations
  const childAgeText = currentChild.age;
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;

  // Health record input state
  const [symptomInput, setSymptomInput] = useState("");
  const [temperatureInput, setTemperatureInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSeverity, setSelectedSeverity] = useState(1); // 1-5 scale

  // Mock health records data - in a real app, this would come from a database
  const [healthRecords, setHealthRecords] = useState([
    {
      id: "1",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      symptoms: "Runny nose, cough",
      temperature: "37.5",
      severity: 2,
      medication: "Children's Tylenol",
      notes: "Started showing symptoms in the evening",
    },
    {
      id: "2",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      symptoms: "Fever, irritability",
      temperature: "38.2",
      severity: 4,
      medication: "Ibuprofen",
      notes: "Visited pediatrician, possible ear infection",
    },
    {
      id: "3",
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      symptoms: "Rash on arms",
      temperature: "36.8",
      severity: 2,
      medication: "Hydrocortisone cream",
      notes: "Possibly from new detergent",
    },
    {
      id: "4",
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      symptoms: "Sore throat",
      temperature: "37.8",
      severity: 3,
      medication: "Honey and warm water",
      notes: "Difficulty swallowing",
    },
    {
      id: "5",
      date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      symptoms: "Vomiting, diarrhea",
      temperature: "37.9",
      severity: 4,
      medication: "Oral rehydration solution",
      notes: "Possible stomach bug, keeping hydrated",
    },
  ]);

  // Health recommendations based on age
  const getHealthRecommendations = (ageInMonths) => {
    if (ageInMonths < 12) {
      // 0-12 months
      return {
        ageGroup: "Infant (0-12 months)",
        checkupSchedule: "2, 4, 6, 9, and 12 months",
        vaccinations:
          "Hepatitis B, Rotavirus, DTaP, Hib, PCV, IPV, Influenza (yearly after 6 months)",
        commonConcerns: "Colic, diaper rash, teething, ear infections, colds",
        emergencySigns:
          "Fever above 100.4°F (38°C), difficulty breathing, dehydration, lethargy",
        preventiveCare:
          "Breastfeeding or formula feeding, safe sleep practices, tummy time",
      };
    } else if (ageInMonths >= 12 && ageInMonths < 36) {
      // 1-3 years
      return {
        ageGroup: "Toddler (1-3 years)",
        checkupSchedule: "15, 18, 24, and 30 months",
        vaccinations: "MMR, Varicella, Hepatitis A, annual influenza",
        commonConcerns:
          "Ear infections, colds, stomach bugs, teething, sleep issues",
        emergencySigns:
          "Fever above 102°F (38.9°C) for more than 2 days, severe dehydration, difficulty breathing",
        preventiveCare:
          "Dental visits, balanced nutrition, physical activity, limited screen time",
      };
    } else if (ageInMonths >= 36 && ageInMonths < 72) {
      // 3-6 years
      return {
        ageGroup: "Preschooler (3-6 years)",
        checkupSchedule: "Annual well-child visits",
        vaccinations:
          "DTaP, IPV, MMR, Varicella boosters at 4-6 years, annual influenza",
        commonConcerns:
          "Colds, ear infections, strep throat, allergies, asthma",
        emergencySigns:
          "Fever above 103°F (39.4°C), severe headache with fever, difficulty breathing, severe abdominal pain",
        preventiveCare:
          "Regular dental checkups, vision screening, balanced nutrition, physical activity",
      };
    } else {
      // 6+ years
      return {
        ageGroup: "School-age (6+ years)",
        checkupSchedule: "Annual well-child visits",
        vaccinations:
          "Tdap, HPV (starting at 9-11 years), Meningococcal, annual influenza",
        commonConcerns:
          "Strep throat, influenza, allergies, sports injuries, behavioral concerns",
        emergencySigns:
          "Severe headache, difficulty breathing, severe abdominal pain, signs of dehydration, high fever with rash",
        preventiveCare:
          "Regular dental and vision checkups, balanced nutrition, physical activity, adequate sleep",
      };
    }
  };

  const recommendations = getHealthRecommendations(childAgeInMonths);

  // Add a new health record
  const addHealthRecord = () => {
    if (!symptomInput.trim()) {
      return; // Don't add empty records
    }

    const newRecord = {
      id: Date.now().toString(),
      date: selectedDate,
      symptoms: symptomInput,
      temperature: temperatureInput,
      severity: selectedSeverity,
      medication: medicationInput,
      notes: notesInput,
    };

    setHealthRecords([newRecord, ...healthRecords]);

    // Reset form
    setSymptomInput("");
    setTemperatureInput("");
    setMedicationInput("");
    setNotesInput("");
    setSelectedSeverity(1);
    setSelectedDate(new Date());

    // Close modal
    setShowAddRecordModal(false);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1:
        return "#4CD964"; // Green - mild
      case 2:
        return "#FFCC00"; // Yellow - moderate
      case 3:
        return "#FF9500"; // Orange - concerning
      case 4:
        return "#FF3B30"; // Red - severe
      case 5:
        return "#AF52DE"; // Purple - emergency
      default:
        return "#4CD964";
    }
  };

  // Get severity text
  const getSeverityText = (severity) => {
    switch (severity) {
      case 1:
        return "Mild";
      case 2:
        return "Moderate";
      case 3:
        return "Concerning";
      case 4:
        return "Severe";
      case 5:
        return "Emergency";
      default:
        return "Mild";
    }
  };

  // Prepare data for 6-month health timeline chart
  const getHealthTimelineData = () => {
    // Get dates for the last 6 months
    const today = new Date();
    const months = [];
    const monthLabels = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      months.push(date);
      monthLabels.push(date.toLocaleDateString("en-US", { month: "short" }));
    }

    // Count health incidents per month
    const monthCounts = months.map((month) => {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      return healthRecords.filter(
        (record) => record.date >= startOfMonth && record.date <= endOfMonth
      ).length;
    });

    // Calculate average severity per month (if there are records)
    const severityData = months.map((month) => {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthRecords = healthRecords.filter(
        (record) => record.date >= startOfMonth && record.date <= endOfMonth
      );

      if (monthRecords.length === 0) return 0;

      const totalSeverity = monthRecords.reduce(
        (sum, record) => sum + record.severity,
        0
      );
      return totalSeverity / monthRecords.length;
    });

    return {
      labels: monthLabels,
      datasets: [
        {
          data: monthCounts,
          color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`, // Purple
          strokeWidth: 2,
        },
        {
          data: severityData,
          color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`, // Red
          strokeWidth: 2,
        },
      ],
      legend: ["Number of Incidents", "Average Severity"],
    };
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
      title: `${currentChild.name.split(" ")[0]}'s Health Details`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

  // Render the add record modal
  const renderAddRecordModal = () => {
    return (
      <Modal
        visible={showAddRecordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddRecordModal(false)}
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
                Add Health Record
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddRecordModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              {/* Date Selector */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateSelector,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => {
                    // In a real app, you would show a date picker here
                    console.log("Show date picker");
                  }}
                >
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {formatDate(selectedDate)}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {/* Symptoms Input */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Symptoms
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                    },
                  ]}
                  value={symptomInput}
                  onChangeText={setSymptomInput}
                  placeholder="Describe symptoms"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              {/* Temperature Input */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Temperature (°F)
                </Text>
                <View style={styles.temperatureInputContainer}>
                  <TextInput
                    style={[
                      styles.temperatureInput,
                      {
                        borderColor: theme.borderLight,
                        backgroundColor: theme.backgroundSecondary,
                        color: theme.text,
                      },
                    ]}
                    value={temperatureInput}
                    onChangeText={setTemperatureInput}
                    placeholder="98.6"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                  />
                  <Text
                    style={[
                      styles.temperatureUnit,
                      { color: theme.textSecondary },
                    ]}
                  >
                    °F
                  </Text>
                </View>
              </View>

              {/* Severity Selector */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Severity
                </Text>
                <View style={styles.severityContainer}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.severityButton,
                        {
                          backgroundColor:
                            selectedSeverity === level
                              ? getSeverityColor(level)
                              : theme.backgroundSecondary,
                          borderColor: getSeverityColor(level),
                        },
                      ]}
                      onPress={() => setSelectedSeverity(level)}
                    >
                      <Text
                        style={[
                          styles.severityButtonText,
                          {
                            color:
                              selectedSeverity === level
                                ? "#FFFFFF"
                                : getSeverityColor(level),
                          },
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text
                  style={[
                    styles.severityLabelText,
                    { color: getSeverityColor(selectedSeverity) },
                  ]}
                >
                  {getSeverityText(selectedSeverity)}
                </Text>
              </View>

              {/* Medication Input */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Medication
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                    },
                  ]}
                  value={medicationInput}
                  onChangeText={setMedicationInput}
                  placeholder="Medication given (if any)"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              {/* Notes Input */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Notes
                </Text>
                <TextInput
                  style={[
                    styles.textAreaInput,
                    {
                      borderColor: theme.borderLight,
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                    },
                  ]}
                  value={notesInput}
                  onChangeText={setNotesInput}
                  placeholder="Additional notes"
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setShowAddRecordModal(false)}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={addHealthRecord}
              >
                <Text style={styles.saveButtonText}>Save Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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

        {/* 6-Month Health Timeline Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="analytics"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              6-Month Health Timeline
            </Text>
          </View>

          <View style={styles.chartWrapper}>
            <LineChart
              data={getHealthTimelineData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                backgroundGradientFrom: theme.cardBackground,
                backgroundGradientTo: theme.cardBackground,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: theme.cardBackground,
                },
              }}
              style={styles.chart}
              bezier
              fromZero
              yAxisSuffix=""
              yAxisInterval={1}
              segments={5}
              legend={["Incidents", "Avg. Severity"]}
            />
          </View>

          <View
            style={[
              styles.chartInfoContainer,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <Text
              style={[styles.chartInfoText, { color: theme.textSecondary }]}
            >
              {healthRecords.length > 0
                ? `${healthRecords.length} health incidents recorded in the last 6 months`
                : "No health incidents recorded in the last 6 months"}
            </Text>
          </View>
        </View>

        {/* Add Health Record Button */}
        <TouchableOpacity
          style={[styles.addRecordButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddRecordModal(true)}
        >
          <Ionicons
            name="add-circle"
            size={20}
            color="#FFFFFF"
            style={styles.addRecordIcon}
          />
          <Text style={styles.addRecordText}>Add Health Record</Text>
        </TouchableOpacity>

        {/* Health Records List */}
        <View
          style={[
            styles.recordsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Health Records
          </Text>

          {healthRecords.length > 0 ? (
            healthRecords.map((record, index) => (
              <View
                key={record.id}
                style={[
                  styles.recordCard,
                  index < healthRecords.length - 1 && {
                    borderBottomColor: theme.borderLight,
                    borderBottomWidth: 1,
                  },
                ]}
              >
                <View style={styles.recordHeader}>
                  <View style={styles.recordDateContainer}>
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={theme.primary}
                      style={styles.recordIcon}
                    />
                    <Text style={[styles.recordDate, { color: theme.text }]}>
                      {formatDate(record.date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(record.severity) },
                    ]}
                  >
                    <Text style={styles.severityBadgeText}>
                      {getSeverityText(record.severity)}
                    </Text>
                  </View>
                </View>

                <View style={styles.recordContent}>
                  <View style={styles.recordItem}>
                    <Text
                      style={[
                        styles.recordLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Symptoms:
                    </Text>
                    <Text style={[styles.recordValue, { color: theme.text }]}>
                      {record.symptoms}
                    </Text>
                  </View>

                  {record.temperature && (
                    <View style={styles.recordItem}>
                      <Text
                        style={[
                          styles.recordLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Temperature:
                      </Text>
                      <Text style={[styles.recordValue, { color: theme.text }]}>
                        {record.temperature}°F
                      </Text>
                    </View>
                  )}

                  {record.medication && (
                    <View style={styles.recordItem}>
                      <Text
                        style={[
                          styles.recordLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Medication:
                      </Text>
                      <Text style={[styles.recordValue, { color: theme.text }]}>
                        {record.medication}
                      </Text>
                    </View>
                  )}

                  {record.notes && (
                    <View style={styles.recordItem}>
                      <Text
                        style={[
                          styles.recordLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Notes:
                      </Text>
                      <Text style={[styles.recordValue, { color: theme.text }]}>
                        {record.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRecordsContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text
                style={[
                  styles.emptyRecordsText,
                  { color: theme.textSecondary },
                ]}
              >
                No health records yet. Add your first record.
              </Text>
            </View>
          )}
        </View>

        {/* Health Recommendations */}
        <View
          style={[
            styles.recommendationsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Health Recommendations
          </Text>

          <View style={styles.recommendationCard}>
            <View
              style={[
                styles.recommendationIconContainer,
                { backgroundColor: "#5856D620" },
              ]}
            >
              <Ionicons name="calendar-number" size={24} color="#5856D6" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={[styles.recommendationTitle, { color: theme.text }]}>
                Checkup Schedule
              </Text>
              <Text
                style={[
                  styles.recommendationText,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.checkupSchedule}
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <View
              style={[
                styles.recommendationIconContainer,
                { backgroundColor: "#4CD96420" },
              ]}
            >
              <Ionicons name="medical" size={24} color="#4CD964" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={[styles.recommendationTitle, { color: theme.text }]}>
                Vaccinations
              </Text>
              <Text
                style={[
                  styles.recommendationText,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.vaccinations}
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <View
              style={[
                styles.recommendationIconContainer,
                { backgroundColor: "#FF950020" },
              ]}
            >
              <Ionicons name="alert-circle" size={24} color="#FF9500" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={[styles.recommendationTitle, { color: theme.text }]}>
                Common Concerns
              </Text>
              <Text
                style={[
                  styles.recommendationText,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.commonConcerns}
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <View
              style={[
                styles.recommendationIconContainer,
                { backgroundColor: "#FF3B3020" },
              ]}
            >
              <Ionicons name="warning" size={24} color="#FF3B30" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={[styles.recommendationTitle, { color: theme.text }]}>
                Emergency Signs
              </Text>
              <Text
                style={[
                  styles.recommendationText,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.emergencySigns}
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <View
              style={[
                styles.recommendationIconContainer,
                { backgroundColor: "#5A87FF20" },
              ]}
            >
              <Ionicons name="shield-checkmark" size={24} color="#5A87FF" />
            </View>
            <View style={styles.recommendationContent}>
              <Text style={[styles.recommendationTitle, { color: theme.text }]}>
                Preventive Care
              </Text>
              <Text
                style={[
                  styles.recommendationText,
                  { color: theme.textSecondary },
                ]}
              >
                {recommendations.preventiveCare}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Age-Appropriate Health Tips
          </Text>
          <View style={styles.tipsList}>
            {childAgeInMonths < 12 ? (
              // 0-12 months tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Keep all vaccination appointments to ensure proper immunity
                    development
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
                    Practice safe sleep: place baby on back, use firm mattress,
                    keep crib free of toys and blankets
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
                    Call doctor immediately for fever above 100.4°F (38°C) in
                    babies under 3 months
                  </Text>
                </View>
              </>
            ) : childAgeInMonths >= 12 && childAgeInMonths < 36 ? (
              // 1-3 years tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Begin regular dental care with first tooth; first dental
                    visit by first birthday
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
                    Childproof your home: secure furniture, cover outlets, lock
                    cabinets with chemicals
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
                    Establish healthy eating habits with a variety of fruits,
                    vegetables, and proteins
                  </Text>
                </View>
              </>
            ) : childAgeInMonths >= 36 && childAgeInMonths < 72 ? (
              // 3-6 years tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Schedule annual vision and hearing screenings to detect
                    early developmental issues
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
                    Teach proper handwashing technique to prevent illness and
                    establish good hygiene habits
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
                    Limit screen time to 1 hour per day of high-quality
                    programming and be present during viewing
                  </Text>
                </View>
              </>
            ) : (
              // 6+ years tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Encourage daily physical activity for at least 60 minutes to
                    support healthy development
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
                    Establish healthy sleep routines with 9-12 hours of sleep
                    per night
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
                    Monitor screen time and social media use, and keep
                    communication open about online safety
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {renderAddRecordModal()}
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
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartInfoContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  chartInfoText: {
    fontSize: 14,
    textAlign: "center",
  },
  addRecordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  addRecordIcon: {
    marginRight: 8,
  },
  addRecordText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  recordsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyRecordsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyRecordsText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  recordCard: {
    paddingVertical: 16,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recordDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordIcon: {
    marginRight: 6,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: "600",
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  recordContent: {
    marginLeft: 22,
  },
  recordItem: {
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 15,
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
  recommendationCard: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 12,
  },
  recommendationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
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
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
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
  modalScrollContent: {
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 16,
  },
  temperatureInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  temperatureInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  temperatureUnit: {
    marginLeft: 8,
    fontSize: 16,
  },
  severityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  severityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  severityButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  severityLabelText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: {
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
