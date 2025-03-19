import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";
export default function HealthDetailsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [notes, setNotes] = useState("");
  const [completedVaccines, setCompletedVaccines] = useState({});
  const [collapsedDates, setCollapsedDates] = useState({});
  const [currentRelevantDate, setCurrentRelevantDate] = useState(null);
  const [nextRelevantDate, setNextRelevantDate] = useState(null);
  const [birthDate, setBirthDate] = useState(null);

  // Set up the header title
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `${currentChild.name.split(" ")[0]}'s Vaccinations`,
    });
  }, [navigation, currentChild]);

  // Load completed vaccines from storage (in a real app)
  useEffect(() => {
    // This would load from AsyncStorage or API in a real app
    const savedCompletedVaccines = {};
    setCompletedVaccines(savedCompletedVaccines);
  }, [currentChild.id]);

  // Generate vaccination schedule based on birth date
  useEffect(() => {
    setLoading(true);

    try {
      // Parse birth date from child's age
      // In a real app, you would store and use the actual birth date
      // For this example, we'll calculate an approximate birth date based on age
      const calculatedBirthDate = new Date();
      const ageText = currentChild.age.toLowerCase();

      if (ageText.includes("day")) {
        // Handle days old
        const days = Number.parseInt(ageText.split(" ")[0]) || 0;
        calculatedBirthDate.setDate(calculatedBirthDate.getDate() - days);
      } else if (ageText.includes("month")) {
        // Handle months old
        const months = Number.parseInt(ageText.split(" ")[0]) || 0;
        calculatedBirthDate.setMonth(calculatedBirthDate.getMonth() - months);
      } else if (ageText.includes("year")) {
        // Handle years old
        const years = Number.parseInt(ageText.split(" ")[0]) || 0;
        calculatedBirthDate.setFullYear(
          calculatedBirthDate.getFullYear() - years
        );
      }

      setBirthDate(calculatedBirthDate);

      // Generate vaccination schedule
      const schedule = generateVaccinationSchedule(calculatedBirthDate);
      setVaccinations(schedule);

      // Group vaccinations by date
      const groupedByDate = groupVaccinationsByDate(schedule);

      // Find the current and next relevant dates
      const { currentDate, nextDate } = findRelevantDates(groupedByDate);
      setCurrentRelevantDate(currentDate);
      setNextRelevantDate(nextDate);

      // Initialize collapsed state for each date - only expand the current relevant date
      const initialCollapsedState = {};
      Object.keys(groupedByDate).forEach((dateKey) => {
        initialCollapsedState[dateKey] = dateKey !== currentDate;
      });

      setCollapsedDates(initialCollapsedState);
    } catch (error) {
      console.error("Error generating vaccination schedule:", error);
    } finally {
      setLoading(false);
    }
  }, [currentChild]);

  // Function to find the current and next relevant vaccination dates
  const findRelevantDates = (groupedVaccinations) => {
    const today = new Date();
    const todayString = formatDate(today);

    // Get all date keys and sort them chronologically
    const dateKeys = Object.keys(groupedVaccinations);
    const sortedDates = dateKeys
      .map((dateKey) => {
        const firstVaccine = groupedVaccinations[dateKey][0];
        return {
          dateKey,
          date: firstVaccine.date,
          // Check if all vaccines for this date are completed
          allCompleted: groupedVaccinations[dateKey].every(
            (v) => completedVaccines[v.id]
          ),
        };
      })
      .sort((a, b) => a.date - b.date);

    // Check if today matches any vaccination date
    const todayMatch = sortedDates.find(
      (d) => formatDate(d.date) === todayString
    );

    // If today matches a vaccination date and not all vaccines are completed, that's our current date
    if (todayMatch && !todayMatch.allCompleted) {
      // Find the next date after today
      const nextDate = sortedDates.find(
        (d) =>
          d.date > today &&
          formatDate(d.date) !== todayString &&
          !d.allCompleted
      );

      return {
        currentDate: todayMatch.dateKey,
        nextDate: nextDate ? nextDate.dateKey : null,
      };
    }

    // If today doesn't match, find the next upcoming date
    const nextUpcoming = sortedDates.find(
      (d) => d.date >= today && !d.allCompleted
    );

    // If there's an upcoming date, that's our current relevant date
    if (nextUpcoming) {
      // Find the date after the upcoming one
      const indexOfUpcoming = sortedDates.indexOf(nextUpcoming);
      const nextAfterUpcoming = sortedDates
        .slice(indexOfUpcoming + 1)
        .find((d) => !d.allCompleted);

      return {
        currentDate: nextUpcoming.dateKey,
        nextDate: nextAfterUpcoming ? nextAfterUpcoming.dateKey : null,
      };
    }

    // If all future dates are completed, find the most recent past date that's not completed
    const mostRecentPast = [...sortedDates]
      .reverse()
      .find((d) => d.date < today && !d.allCompleted);

    if (mostRecentPast) {
      return {
        currentDate: mostRecentPast.dateKey,
        nextDate: null,
      };
    }

    // If everything is completed or there are no dates, return null for both
    return { currentDate: null, nextDate: null };
  };

  // Function to generate vaccination schedule based on birth date
  const generateVaccinationSchedule = (birthDate) => {
    if (!birthDate || isNaN(birthDate.getTime())) {
      console.error(
        "Invalid birth date provided to generateVaccinationSchedule"
      );
      return [];
    }

    const schedule = [];

    // Helper function to add months to a date
    const addMonths = (date, months) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + months);
      return newDate;
    };

    // Helper function to add days to a date
    const addDays = (date, days) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    };

    // Birth (0 months) - Hepatitis B is given at birth
    schedule.push({
      id: "hepb-1",
      date: new Date(birthDate),
      vaccine: "Hepatitis B (HepB)",
      dose: "1st dose",
      notes: "Given at birth",
      ageMonths: 0,
      ageDays: 0,
    });

    // 1-2 months
    schedule.push({
      id: "hepb-2",
      date: addMonths(birthDate, 1),
      vaccine: "Hepatitis B (HepB)",
      dose: "2nd dose",
      notes: "1–2 months after birth",
      ageMonths: 1,
      ageDays: 30,
    });

    // 2 months
    const twoMonthDate = addMonths(birthDate, 2);
    schedule.push({
      id: "dtap-1",
      date: twoMonthDate,
      vaccine: "DTaP (Diphtheria, Tetanus, Pertussis)",
      dose: "1st dose",
      notes: "Part of 3-dose primary series",
      ageMonths: 2,
      ageDays: 60,
    });

    schedule.push({
      id: "hib-1",
      date: twoMonthDate,
      vaccine: "Hib (Haemophilus influenzae type B)",
      dose: "1st dose",
      notes: "Protects against bacterial infections",
      ageMonths: 2,
      ageDays: 60,
    });

    schedule.push({
      id: "ipv-1",
      date: twoMonthDate,
      vaccine: "Polio (IPV)",
      dose: "1st dose",
      notes: "Inactivated polio vaccine",
      ageMonths: 2,
      ageDays: 60,
    });

    schedule.push({
      id: "pcv13-1",
      date: twoMonthDate,
      vaccine: "Pneumococcal (PCV13)",
      dose: "1st dose",
      notes: "Prevents pneumonia & meningitis",
      ageMonths: 2,
      ageDays: 60,
    });

    schedule.push({
      id: "rv-1",
      date: twoMonthDate,
      vaccine: "Rotavirus (RV)",
      dose: "1st dose",
      notes: "Oral vaccine against diarrhea",
      ageMonths: 2,
      ageDays: 60,
    });

    // 4 months
    const fourMonthDate = addMonths(birthDate, 4);
    schedule.push({
      id: "dtap-2",
      date: fourMonthDate,
      vaccine: "DTaP",
      dose: "2nd dose",
      notes: "Second dose of primary series",
      ageMonths: 4,
      ageDays: 120,
    });

    schedule.push({
      id: "hib-2",
      date: fourMonthDate,
      vaccine: "Hib",
      dose: "2nd dose",
      notes: "Second dose of primary series",
      ageMonths: 4,
      ageDays: 120,
    });

    schedule.push({
      id: "ipv-2",
      date: fourMonthDate,
      vaccine: "Polio (IPV)",
      dose: "2nd dose",
      notes: "Second dose of primary series",
      ageMonths: 4,
      ageDays: 120,
    });

    schedule.push({
      id: "pcv13-2",
      date: fourMonthDate,
      vaccine: "Pneumococcal (PCV13)",
      dose: "2nd dose",
      notes: "Second dose of primary series",
      ageMonths: 4,
      ageDays: 120,
    });

    schedule.push({
      id: "rv-2",
      date: fourMonthDate,
      vaccine: "Rotavirus (RV)",
      dose: "2nd dose",
      notes: "Second dose of oral vaccine",
      ageMonths: 4,
      ageDays: 120,
    });

    // 6 months
    const sixMonthDate = addMonths(birthDate, 6);
    schedule.push({
      id: "dtap-3",
      date: sixMonthDate,
      vaccine: "DTaP",
      dose: "3rd dose",
      notes: "Third dose of primary series",
      ageMonths: 6,
      ageDays: 180,
    });

    schedule.push({
      id: "hib-3",
      date: sixMonthDate,
      vaccine: "Hib",
      dose: "3rd dose",
      notes: "Third dose (if 4-dose schedule)",
      ageMonths: 6,
      ageDays: 180,
    });

    schedule.push({
      id: "ipv-3",
      date: sixMonthDate,
      vaccine: "Polio (IPV)",
      dose: "3rd dose",
      notes: "Third dose of primary series",
      ageMonths: 6,
      ageDays: 180,
    });

    schedule.push({
      id: "pcv13-3",
      date: sixMonthDate,
      vaccine: "Pneumococcal (PCV13)",
      dose: "3rd dose",
      notes: "Third dose of primary series",
      ageMonths: 6,
      ageDays: 180,
    });

    schedule.push({
      id: "rv-3",
      date: sixMonthDate,
      vaccine: "Rotavirus (RV)",
      dose: "3rd dose (if needed)",
      notes: "Only for 3-dose series",
      ageMonths: 6,
      ageDays: 180,
    });

    schedule.push({
      id: "hepb-3",
      date: sixMonthDate,
      vaccine: "Hepatitis B (HepB)",
      dose: "3rd dose",
      notes: "Final dose in infant schedule",
      ageMonths: 6,
      ageDays: 180,
    });

    schedule.push({
      id: "flu-1",
      date: sixMonthDate,
      vaccine: "Influenza (Flu)",
      dose: "1st dose",
      notes: "Given annually from 6 months onward",
      ageMonths: 6,
      ageDays: 180,
    });

    // 7 months (second flu shot)
    schedule.push({
      id: "flu-2",
      date: addMonths(birthDate, 7),
      vaccine: "Influenza (Flu)",
      dose: "2nd dose",
      notes: "Second flu shot (needed first year)",
      ageMonths: 7,
      ageDays: 210,
    });

    // 12 months
    const twelveMonthDate = addMonths(birthDate, 12);
    schedule.push({
      id: "mmr-1",
      date: twelveMonthDate,
      vaccine: "MMR (Measles, Mumps, Rubella)",
      dose: "1st dose",
      notes: "Typically given at 12 months",
      ageMonths: 12,
      ageDays: 365,
    });

    schedule.push({
      id: "pcv13-4",
      date: twelveMonthDate,
      vaccine: "Pneumococcal (PCV13)",
      dose: "4th dose (booster)",
      notes: "Final booster dose",
      ageMonths: 12,
      ageDays: 365,
    });

    schedule.push({
      id: "var-1",
      date: twelveMonthDate,
      vaccine: "Varicella (Chickenpox)",
      dose: "1st dose",
      notes: "Protects against chickenpox",
      ageMonths: 12,
      ageDays: 365,
    });

    schedule.push({
      id: "hepa-1",
      date: twelveMonthDate,
      vaccine: "Hepatitis A",
      dose: "1st dose",
      notes: "First of two-dose series",
      ageMonths: 12,
      ageDays: 365,
    });

    return schedule.sort((a, b) => a.date - b.date);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format age for display
  const formatAge = (vaccine) => {
    if (vaccine.ageMonths === 0) {
      return "At birth";
    } else if (vaccine.ageMonths < 1) {
      return `${vaccine.ageDays} days old`;
    } else if (vaccine.ageMonths === 1) {
      return "1 month old";
    } else {
      return `${vaccine.ageMonths} months old`;
    }
  };

  // Check if a date is in the current month
  const isCurrentMonth = (date) => {
    if (!date || isNaN(date.getTime())) {
      return false;
    }

    const today = new Date();
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Mark a vaccine as completed
  const markAsCompleted = (vaccineId) => {
    setSelectedVaccine(vaccinations.find((v) => v.id === vaccineId));
    setShowAddModal(true);
  };

  // Save completion details
  const saveCompletion = () => {
    if (!selectedVaccine) return;

    const updatedCompletedVaccines = {
      ...completedVaccines,
      [selectedVaccine.id]: {
        completedDate: new Date(),
        notes: notes,
      },
    };

    setCompletedVaccines(updatedCompletedVaccines);
    setShowAddModal(false);
    setNotes("");

    // In a real app, you would save this to AsyncStorage or API
    console.log("Saved completion:", updatedCompletedVaccines);

    // After marking a vaccine as completed, recalculate the relevant dates
    const groupedByDate = groupVaccinationsByDate(vaccinations);
    const { currentDate, nextDate } = findRelevantDates(groupedByDate);

    // If the current relevant date has changed, update the collapsed states
    if (currentDate !== currentRelevantDate) {
      const newCollapsedState = { ...collapsedDates };

      // Collapse the previous current date if it's not the same as the new one
      if (currentRelevantDate && currentRelevantDate !== currentDate) {
        newCollapsedState[currentRelevantDate] = true;
      }

      // Expand the new current date
      if (currentDate) {
        newCollapsedState[currentDate] = false;
      }

      setCollapsedDates(newCollapsedState);
      setCurrentRelevantDate(currentDate);
      setNextRelevantDate(nextDate);
    }
  };

  // Check if a date is in the past
  const isDatePast = (date) => {
    if (!date || isNaN(date.getTime())) {
      return false;
    }

    const today = new Date();
    return date < today;
  };

  // Calculate vaccination progress
  const calculateVaccinationProgress = () => {
    if (vaccinations.length === 0) return 0;

    const completedCount = Object.keys(completedVaccines).length;
    const totalCount = vaccinations.length;

    return Math.round((completedCount / totalCount) * 100);
  };

  // Group vaccinations by date
  const groupVaccinationsByDate = (vaccinationList) => {
    return vaccinationList.reduce((groups, vaccine) => {
      const dateKey = formatDate(vaccine.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(vaccine);
      return groups;
    }, {});
  };

  // Toggle collapse state for a date group
  const toggleDateCollapse = (dateKey) => {
    setCollapsedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  // Count vaccines for a date
  const countVaccinesForDate = (vaccines) => {
    const total = vaccines.length;
    const completed = vaccines.filter((v) => completedVaccines[v.id]).length;
    return { total, completed };
  };

  // Check if a date is the current relevant date
  const isCurrentRelevantDate = (dateKey) => {
    return dateKey === currentRelevantDate;
  };

  // Check if a date is the next relevant date
  const isNextRelevantDate = (dateKey) => {
    return dateKey === nextRelevantDate;
  };

  // Check if all vaccines for a date are completed
  const areAllVaccinesCompletedForDate = (vaccines) => {
    return vaccines.every((v) => completedVaccines[v.id]);
  };

  // Render the add completion modal
  const renderAddCompletionModal = () => {
    if (!selectedVaccine) return null;

    return (
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Record Vaccination
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.vaccineTitle, { color: theme.text }]}>
                {selectedVaccine.vaccine} - {selectedVaccine.dose}
              </Text>

              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
                Scheduled Date:
              </Text>
              <Text style={[styles.modalValue, { color: theme.text }]}>
                {formatDate(selectedVaccine.date)}
              </Text>

              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.textSecondary, marginTop: 16 },
                ]}
              >
                Notes (optional):
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.borderLight,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this vaccination"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setShowAddModal(false)}
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
                onPress={saveCompletion}
              >
                <Text style={styles.saveButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Generating vaccination schedule...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group vaccinations by date
  const groupedVaccinations = groupVaccinationsByDate(vaccinations);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vaccination Schedule Header */}
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.headerCard,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <Ionicons
              name="medical"
              size={24}
              color={theme.primary}
              style={styles.headerIcon}
            />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Vaccination Schedule
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: theme.textSecondary }]}
              >
                Based on {currentChild.name}'s birth date
              </Text>
              {birthDate && (
                <Text
                  style={[styles.birthDateText, { color: theme.textSecondary }]}
                >
                  Birth date: {formatDate(birthDate)}
                </Text>
              )}
            </View>
          </View>
          <View
            style={[
              styles.progressContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressTitle, { color: theme.text }]}>
                Vaccination Progress
              </Text>
              <Text style={[styles.progressPercentage, { color: "#4CAF50" }]}>
                {calculateVaccinationProgress()}% Complete
              </Text>
            </View>

            <View
              style={[
                styles.progressBarContainer,
                { backgroundColor: "#E8F5E9" },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: "#4CAF50",
                    width: `${calculateVaccinationProgress()}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.progressStatsContainer}>
              <Text
                style={[styles.progressStat, { color: theme.textSecondary }]}
              >
                {Object.keys(completedVaccines).length} of {vaccinations.length}{" "}
                vaccinations completed
              </Text>
              <Text
                style={[styles.progressStat, { color: theme.textSecondary }]}
              >
                {vaccinations.length - Object.keys(completedVaccines).length}{" "}
                remaining
              </Text>
            </View>
          </View>
        </View>

        {/* Vaccination Timeline */}
        <View style={styles.timelineContainer}>
          {Object.keys(groupedVaccinations).map((dateKey, dateIndex) => {
            if (dateKey === "Invalid Date") return null;

            const isCollapsed = collapsedDates[dateKey];
            const { total, completed } = countVaccinesForDate(
              groupedVaccinations[dateKey]
            );
            const isCurrent = isCurrentRelevantDate(dateKey);
            const isNext = isNextRelevantDate(dateKey);
            const isPast = isDatePast(groupedVaccinations[dateKey][0].date);
            const isCurrentMonthDate = isCurrentMonth(
              groupedVaccinations[dateKey][0].date
            );
            const allCompleted = areAllVaccinesCompletedForDate(
              groupedVaccinations[dateKey]
            );

            // Determine section color based on status
            let sectionBgColor = theme.cardBackground;
            let sectionBorderColor = "transparent";
            let warningMessage = null;
            let headerTextColor = theme.text;
            let statusText = "";

            if (allCompleted) {
              // Completed section - green
              sectionBgColor = "#E8F5E9"; // Light green
              sectionBorderColor = "#4CAF50"; // Green
              headerTextColor = "#4CAF50"; // Green
              statusText = "Completed";
            } else if (isPast && !isCurrentMonthDate) {
              // Overdue section from previous months - red
              sectionBgColor = "#FFEBEE"; // Light red
              sectionBorderColor = "#F44336"; // Red
              headerTextColor = "#F44336"; // Red
              warningMessage =
                "Overdue vaccinations! Please consult your doctor.";
              statusText = "Overdue";
            } else if (isCurrentMonthDate) {
              // Current month section - blue
              sectionBgColor = "#E3F2FD"; // Light blue
              sectionBorderColor = "#2196F3"; // Blue
              headerTextColor = "#2196F3"; // Blue
              statusText = "Due Now";
            }

            return (
              <View key={dateKey} style={styles.dateGroup}>
                {/* Date Header - Clickable to expand/collapse */}
                <TouchableOpacity
                  style={styles.dateHeaderContainer}
                  onPress={() => toggleDateCollapse(dateKey)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dateHeader,
                      {
                        backgroundColor: sectionBgColor,
                        borderWidth: 1,
                        borderColor: sectionBorderColor,
                      },
                    ]}
                  >
                    <View style={styles.dateHeaderContent}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dateText,
                            {
                              color: headerTextColor,
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {dateKey}
                          {statusText && (
                            <Text style={{ fontSize: 12, marginLeft: 8 }}>
                              {" "}
                              ({statusText})
                            </Text>
                          )}
                        </Text>
                        <Text
                          style={[
                            styles.ageText,
                            {
                              color: theme.textSecondary,
                            },
                          ]}
                        >
                          {formatAge(groupedVaccinations[dateKey][0])}
                        </Text>

                        {/* Warning message for missed vaccinations */}
                        {isPast && !isCurrentMonthDate && !allCompleted && (
                          <Text
                            style={[styles.warningText, { color: "#F44336" }]}
                          >
                            {warningMessage}
                          </Text>
                        )}
                      </View>

                      <View style={styles.dateHeaderRight}>
                        <Text
                          style={[
                            styles.vaccineCount,
                            {
                              color: headerTextColor,
                            },
                          ]}
                        >
                          {completed}/{total} vaccines
                        </Text>
                        <Ionicons
                          name={isCollapsed ? "chevron-down" : "chevron-up"}
                          size={20}
                          color={headerTextColor}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Vaccines for this date - Only show if not collapsed */}
                {!isCollapsed &&
                  groupedVaccinations[dateKey].map((vaccine) => {
                    // Determine the card color based on status
                    const isCompleted = completedVaccines[vaccine.id];

                    let cardBgColor = "#FFFFFF"; // Default white
                    let cardBorderColor = theme.borderLight;
                    let buttonBgColor = theme.backgroundSecondary;
                    let buttonTextColor = theme.textSecondary;
                    let buttonText = "Mark Complete";

                    if (isCompleted) {
                      // Completed vaccination - green
                      cardBgColor = "#E8F5E9"; // Light green
                      cardBorderColor = "#4CAF50"; // Green
                    } else if (isPast && !isCurrentMonthDate) {
                      // Overdue vaccination - red
                      cardBgColor = "#FFEBEE"; // Light red
                      cardBorderColor = "#F44336"; // Red
                      buttonBgColor = "#F44336"; // Red
                      buttonTextColor = "#FFFFFF"; // White
                      buttonText = "Overdue";
                    } else if (isCurrentMonthDate) {
                      // Current month vaccination - blue
                      cardBgColor = "#E3F2FD"; // Light blue
                      cardBorderColor = "#2196F3"; // Blue
                      buttonBgColor = "#2196F3"; // Blue
                      buttonTextColor = "#FFFFFF"; // White
                      buttonText = "Due Now";
                    }

                    return (
                      <View
                        key={vaccine.id}
                        style={[
                          styles.vaccineCard,
                          {
                            backgroundColor: cardBgColor,
                            borderLeftColor: cardBorderColor,
                            borderColor: cardBorderColor,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View style={styles.vaccineHeader}>
                          <View style={styles.vaccineInfo}>
                            <Text
                              style={[
                                styles.vaccineName,
                                { color: theme.text },
                              ]}
                            >
                              {vaccine.vaccine}
                            </Text>
                            <Text
                              style={[
                                styles.vaccineDose,
                                {
                                  color: isCompleted
                                    ? "#4CAF50" // Green
                                    : isPast && !isCurrentMonthDate
                                    ? "#F44336" // Red
                                    : isCurrentMonthDate
                                    ? "#2196F3" // Blue
                                    : theme.textSecondary,
                                },
                              ]}
                            >
                              {vaccine.dose}
                            </Text>
                          </View>

                          {isCompleted ? (
                            <View
                              style={[
                                styles.completedBadge,
                                { backgroundColor: "#E8F5E9" },
                              ]}
                            >
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="#4CAF50"
                              />
                              <Text
                                style={[
                                  styles.completedText,
                                  { color: "#4CAF50" },
                                ]}
                              >
                                Completed
                              </Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                {
                                  backgroundColor: buttonBgColor,
                                },
                              ]}
                              onPress={() => markAsCompleted(vaccine.id)}
                            >
                              <Text
                                style={[
                                  styles.actionButtonText,
                                  {
                                    color: buttonTextColor,
                                    fontWeight: "600",
                                  },
                                ]}
                              >
                                {buttonText}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.vaccineNotes,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {vaccine.notes}
                        </Text>

                        {completedVaccines[vaccine.id]?.notes && (
                          <View
                            style={[
                              styles.completionNotes,
                              { backgroundColor: "#E8F5E9" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.completionNotesText,
                                { color: theme.text },
                              ]}
                            >
                              {completedVaccines[vaccine.id].notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}

                {/* Timeline connector (except for last group) */}
                {dateIndex < Object.keys(groupedVaccinations).length - 1 && (
                  <View
                    style={[
                      styles.timelineConnector,
                      { backgroundColor: theme.borderLight },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Vaccination Information */}
        <View
          style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.infoHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              Important Information
            </Text>
          </View>

          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            This vaccination schedule is based on CDC recommendations. Always
            consult with your pediatrician for the most appropriate schedule for
            your child.
          </Text>

          <Text
            style={[
              styles.infoText,
              { color: theme.textSecondary, marginTop: 8 },
            ]}
          >
            Some vaccines may be combined into a single shot. Your healthcare
            provider may also recommend additional vaccines based on your
            child's specific needs.
          </Text>
        </View>
      </ScrollView>

      {renderAddCompletionModal()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  birthDateText: {
    fontSize: 12,
    marginTop: 4,
  },
  timelineContainer: {
    marginBottom: 20,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeaderContainer: {
    alignItems: "flex-start",
    marginBottom: 12,
    width: "100%",
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
  },
  dateHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  dateHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  vaccineCount: {
    marginRight: 8,
    fontSize: 14,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  ageText: {
    fontSize: 14,
    marginTop: 2,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  vaccineCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vaccineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vaccineInfo: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  vaccineDose: {
    fontSize: 14,
    fontWeight: "500",
  },
  vaccineNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  completedText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  completionNotes: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  completionNotesText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  timelineConnector: {
    width: 2,
    height: 20,
    marginLeft: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    marginBottom: 20,
  },
  vaccineTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  progressContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 6,
  },
  progressStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStat: {
    fontSize: 13,
  },
});
