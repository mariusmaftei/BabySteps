import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";
import { useNotification } from "../../../context/notification-context";
import * as VaccinationService from "../../../services/vaccination-service";

export default function HealthScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const {
    scheduleVaccinationReminders,
    cancelVaccinationReminders,
    updateCurrentScreen,
  } = useNotification();
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
  const [dueNowVaccines, setDueNowVaccines] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
  });
  const [savingVaccination, setSavingVaccination] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `${currentChild.name.split(" ")[0]}'s Vaccinations`,
    });

    updateCurrentScreen("HealthDetails");

    return () => {
      updateCurrentScreen("Activity");
    };
  }, [navigation, currentChild, updateCurrentScreen]);

  useEffect(() => {
    const loadVaccinations = async () => {
      setLoading(true);
      try {
        const vaccinationData =
          await VaccinationService.getVaccinationsForChild(currentChild.id);

        if (vaccinationData && vaccinationData.length > 0) {
          setVaccinations(vaccinationData);

          const completedMap = {};
          vaccinationData.forEach((vaccine) => {
            if (vaccine.isCompleted) {
              completedMap[vaccine.vaccineId] = {
                completedDate: new Date(vaccine.completedDate),
                notes: vaccine.completionNotes,
              };
            }
          });
          setCompletedVaccines(completedMap);

          const birthVaccine = vaccinationData.find(
            (v) => v.ageMonths === 0 && v.ageDays === 0
          );
          if (birthVaccine) {
            const birthDateFromVaccine = new Date(birthVaccine.scheduledDate);
            setBirthDate(birthDateFromVaccine);
          } else {
            calculateBirthDateFromAge();
          }

          const groupedByDate = groupVaccinationsByDate(vaccinationData);

          const { currentDate, nextDate } = findRelevantDates(groupedByDate);
          setCurrentRelevantDate(currentDate);
          setNextRelevantDate(nextDate);

          const initialCollapsedState = {};
          Object.keys(groupedByDate).forEach((dateKey) => {
            initialCollapsedState[dateKey] = dateKey !== currentDate;
          });
          setCollapsedDates(initialCollapsedState);

          findDueNowVaccines(vaccinationData, groupedByDate);
        } else {
          await generateAndSaveVaccinationSchedule();
        }

        await loadVaccinationProgress();
      } catch (error) {
        console.error("Error loading vaccinations:", error);
        Alert.alert(
          "Error",
          "Failed to load vaccination data. Please try again later.",
          [{ text: "OK" }]
        );

        await generateAndSaveVaccinationSchedule();
      } finally {
        setLoading(false);
      }
    };

    loadVaccinations();
  }, [currentChild.id]);

  const calculateBirthDateFromAge = () => {
    const calculatedBirthDate = new Date();
    const ageText = currentChild.age.toLowerCase();

    if (ageText.includes("day")) {
      const days = Number.parseInt(ageText.split(" ")[0]) || 0;
      calculatedBirthDate.setDate(calculatedBirthDate.getDate() - days);
    } else if (ageText.includes("month")) {
      const months = Number.parseInt(ageText.split(" ")[0]) || 0;
      calculatedBirthDate.setMonth(calculatedBirthDate.getMonth() - months);
    } else if (ageText.includes("year")) {
      const years = Number.parseInt(ageText.split(" ")[0]) || 0;
      calculatedBirthDate.setFullYear(
        calculatedBirthDate.getFullYear() - years
      );
    }

    setBirthDate(calculatedBirthDate);
    return calculatedBirthDate;
  };

  const generateAndSaveVaccinationSchedule = async () => {
    try {
      const calculatedBirthDate = calculateBirthDateFromAge();

      const schedule = generateVaccinationSchedule(calculatedBirthDate);

      const vaccinationsForApi = schedule.map((vaccine) => ({
        vaccineId: vaccine.id,
        vaccineName: vaccine.vaccine,
        dose: vaccine.dose,
        scheduledDate: vaccine.date,
        ageMonths: vaccine.ageMonths,
        ageDays: vaccine.ageDays,
        notes: vaccine.notes,
        isCompleted: false,
      }));

      await VaccinationService.createMultipleVaccinations(
        currentChild.id,
        vaccinationsForApi
      );

      setVaccinations(schedule);

      const groupedByDate = groupVaccinationsByDate(schedule);

      const { currentDate, nextDate } = findRelevantDates(groupedByDate);
      setCurrentRelevantDate(currentDate);
      setNextRelevantDate(nextDate);

      const initialCollapsedState = {};
      Object.keys(groupedByDate).forEach((dateKey) => {
        initialCollapsedState[dateKey] = dateKey !== currentDate;
      });
      setCollapsedDates(initialCollapsedState);

      findDueNowVaccines(schedule, groupedByDate);
    } catch (error) {
      console.error("Error generating and saving vaccination schedule:", error);
      Alert.alert(
        "Error",
        "Failed to save vaccination schedule. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };

  const loadVaccinationProgress = async () => {
    setLoadingProgress(true);
    try {
      const progressData = await VaccinationService.getVaccinationProgress(
        currentChild.id
      );
      setProgress(progressData);
    } catch (error) {
      console.error("Error loading vaccination progress:", error);
      if (vaccinations.length > 0) {
        const completedCount = Object.keys(completedVaccines).length;
        const totalCount = vaccinations.length;
        const percentage = Math.round((completedCount / totalCount) * 100);
        setProgress({
          total: totalCount,
          completed: completedCount,
          percentage,
        });
      }
    } finally {
      setLoadingProgress(false);
    }
  };

  const findDueNowVaccines = async (schedule, groupedByDate) => {
    try {
      const dueVaccines = await VaccinationService.getDueVaccinations(
        currentChild.id
      );
      setDueNowVaccines(dueVaccines);

      if (dueVaccines.length > 0) {
        scheduleVaccinationReminders(dueVaccines, currentChild.name);
      } else {
        cancelVaccinationReminders();
      }
    } catch (error) {
      console.error("Error fetching due vaccinations:", error);

      const today = new Date();
      const localDueVaccines = schedule.filter((vaccine) => {
        return (
          vaccine.date.getMonth() === today.getMonth() &&
          vaccine.date.getFullYear() === today.getFullYear() &&
          !completedVaccines[vaccine.id]
        );
      });

      setDueNowVaccines(localDueVaccines);

      if (localDueVaccines.length > 0) {
        scheduleVaccinationReminders(localDueVaccines, currentChild.name);
      } else {
        cancelVaccinationReminders();
      }
    }
  };

  useEffect(() => {
    if (vaccinations.length === 0) return;

    const allDueNowCompleted = dueNowVaccines.every(
      (vaccine) => completedVaccines[vaccine.vaccineId || vaccine.id]
    );

    if (allDueNowCompleted && dueNowVaccines.length > 0) {
      cancelVaccinationReminders();
    } else if (dueNowVaccines.length > 0) {
      const remainingDueVaccines = dueNowVaccines.filter(
        (vaccine) => !completedVaccines[vaccine.vaccineId || vaccine.id]
      );
      if (remainingDueVaccines.length > 0) {
        scheduleVaccinationReminders(remainingDueVaccines, currentChild.name);
      } else {
        cancelVaccinationReminders();
      }
    }
  }, [completedVaccines, dueNowVaccines]);

  const findRelevantDates = (groupedVaccinations) => {
    const today = new Date();
    const todayString = formatDate(today);

    const dateKeys = Object.keys(groupedVaccinations);
    const sortedDates = dateKeys
      .map((dateKey) => {
        const firstVaccine = groupedVaccinations[dateKey][0];
        return {
          dateKey,
          date: new Date(firstVaccine.scheduledDate || firstVaccine.date),
          allCompleted: groupedVaccinations[dateKey].every(
            (v) => completedVaccines[v.vaccineId || v.id]
          ),
        };
      })
      .sort((a, b) => a.date - b.date);

    const todayMatch = sortedDates.find(
      (d) => formatDate(d.date) === todayString
    );
    if (todayMatch && !todayMatch.allCompleted) {
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

    const nextUpcoming = sortedDates.find(
      (d) => d.date >= today && !d.allCompleted
    );

    if (nextUpcoming) {
      const indexOfUpcoming = sortedDates.indexOf(nextUpcoming);
      const nextAfterUpcoming = sortedDates
        .slice(indexOfUpcoming + 1)
        .find((d) => !d.allCompleted);

      return {
        currentDate: nextUpcoming.dateKey,
        nextDate: nextAfterUpcoming ? nextAfterUpcoming.dateKey : null,
      };
    }

    const mostRecentPast = [...sortedDates]
      .reverse()
      .find((d) => d.date < today && !d.allCompleted);

    if (mostRecentPast) {
      return {
        currentDate: mostRecentPast.dateKey,
        nextDate: null,
      };
    }

    return { currentDate: null, nextDate: null };
  };

  const generateVaccinationSchedule = (birthDate) => {
    if (!birthDate || isNaN(birthDate.getTime())) {
      console.error(
        "Invalid birth date provided to generateVaccinationSchedule"
      );
      return [];
    }

    const schedule = [];

    const addMonths = (date, months) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + months);
      return newDate;
    };

    const addDays = (date, days) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    };

    schedule.push({
      id: "hepb-1",
      date: new Date(birthDate),
      vaccine: "Hepatitis B (HepB)",
      dose: "1st dose",
      notes: "Given at birth",
      ageMonths: 0,
      ageDays: 0,
    });

    schedule.push({
      id: "hepb-2",
      date: addMonths(birthDate, 1),
      vaccine: "Hepatitis B (HepB)",
      dose: "2nd dose",
      notes: "1–2 months after birth",
      ageMonths: 1,
      ageDays: 30,
    });

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

    schedule.push({
      id: "flu-2",
      date: addMonths(birthDate, 7),
      vaccine: "Influenza (Flu)",
      dose: "2nd dose",
      notes: "Second flu shot (needed first year)",
      ageMonths: 7,
      ageDays: 210,
    });

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

  const formatAge = (vaccine) => {
    const ageMonths = vaccine.ageMonths;
    const ageDays = vaccine.ageDays;

    if (ageMonths === 0) {
      return "At birth";
    } else if (ageMonths < 1) {
      return `${ageDays} days old`;
    } else if (ageMonths === 1) {
      return "1 month old";
    } else {
      return `${ageMonths} months old`;
    }
  };

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

  const markAsCompleted = (vaccineId) => {
    const vaccine = vaccinations.find(
      (v) => (v.vaccineId || v.id) === vaccineId
    );
    setSelectedVaccine(vaccine);
    setShowAddModal(true);
  };

  const saveCompletion = async () => {
    if (!selectedVaccine) return;

    setSavingVaccination(true);

    try {
      await VaccinationService.markVaccinationAsCompleted(
        currentChild.id,
        selectedVaccine.vaccineId || selectedVaccine.id,
        notes
      );

      const updatedCompletedVaccines = {
        ...completedVaccines,
        [selectedVaccine.vaccineId || selectedVaccine.id]: {
          completedDate: new Date(),
          notes: notes,
        },
      };

      setCompletedVaccines(updatedCompletedVaccines);
      setShowAddModal(false);
      setNotes("");

      await loadVaccinationProgress();

      const groupedByDate = groupVaccinationsByDate(vaccinations);
      const { currentDate, nextDate } = findRelevantDates(groupedByDate);

      if (currentDate !== currentRelevantDate) {
        const newCollapsedState = { ...collapsedDates };

        if (currentRelevantDate && currentRelevantDate !== currentDate) {
          newCollapsedState[currentRelevantDate] = true;
        }
        if (currentDate) {
          newCollapsedState[currentDate] = false;
        }

        setCollapsedDates(newCollapsedState);
        setCurrentRelevantDate(currentDate);
        setNextRelevantDate(nextDate);
      }
    } catch (error) {
      console.error("Error saving vaccination completion:", error);
      Alert.alert(
        "Error",
        "Failed to save vaccination completion. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSavingVaccination(false);
    }
  };

  const isDatePast = (date) => {
    if (!date || isNaN(date.getTime())) {
      return false;
    }

    const today = new Date();
    return date < today;
  };

  const calculateVaccinationProgress = () => {
    return progress.percentage || 0;
  };

  const groupVaccinationsByDate = (vaccinationList) => {
    return vaccinationList.reduce((groups, vaccine) => {
      const dateKey = formatDate(
        new Date(vaccine.scheduledDate || vaccine.date)
      );
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(vaccine);
      return groups;
    }, {});
  };

  const toggleDateCollapse = (dateKey) => {
    setCollapsedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const countVaccinesForDate = (vaccines) => {
    const total = vaccines.length;
    const completed = vaccines.filter(
      (v) => completedVaccines[v.vaccineId || v.id]
    ).length;
    return { total, completed };
  };

  const isCurrentRelevantDate = (dateKey) => {
    return dateKey === currentRelevantDate;
  };

  const isNextRelevantDate = (dateKey) => {
    return dateKey === nextRelevantDate;
  };

  const areAllVaccinesCompletedForDate = (vaccines) => {
    return vaccines.every((v) => completedVaccines[v.vaccineId || v.id]);
  };

  const renderAddCompletionModal = () => {
    if (!selectedVaccine) return null;

    return (
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={[
                styles.modalOverlay,
                { backgroundColor: theme.modalOverlay },
              ]}
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
                  <TouchableOpacity
                    onPress={() => setShowAddModal(false)}
                    disabled={savingVaccination}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={[styles.vaccineTitle, { color: theme.text }]}>
                    {selectedVaccine.vaccineName || selectedVaccine.vaccine} -{" "}
                    {selectedVaccine.dose}
                  </Text>

                  <Text
                    style={[styles.modalLabel, { color: theme.textSecondary }]}
                  >
                    Scheduled Date:
                  </Text>
                  <Text style={[styles.modalValue, { color: theme.text }]}>
                    {formatDate(
                      new Date(
                        selectedVaccine.scheduledDate || selectedVaccine.date
                      )
                    )}
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
                    editable={!savingVaccination}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        opacity: savingVaccination ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowAddModal(false);
                    }}
                    disabled={savingVaccination}
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
                    style={[
                      styles.saveButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: savingVaccination ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      saveCompletion();
                    }}
                    disabled={savingVaccination}
                  >
                    {savingVaccination ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        Mark as Completed
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading vaccination schedule...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedVaccinations = groupVaccinationsByDate(vaccinations);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                {loadingProgress ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  `${calculateVaccinationProgress()}% Complete`
                )}
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
                {progress.completed} of {progress.total} vaccinations completed
              </Text>
              <Text
                style={[styles.progressStat, { color: theme.textSecondary }]}
              >
                {progress.total - progress.completed} remaining
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineContainer}>
          {Object.keys(groupedVaccinations).map((dateKey, dateIndex) => {
            if (dateKey === "Invalid Date") return null;

            const isCollapsed = collapsedDates[dateKey];
            const { total, completed } = countVaccinesForDate(
              groupedVaccinations[dateKey]
            );
            const isCurrent = isCurrentRelevantDate(dateKey);
            const isNext = isNextRelevantDate(dateKey);
            const isPast = isDatePast(
              new Date(
                groupedVaccinations[dateKey][0].scheduledDate ||
                  groupedVaccinations[dateKey][0].date
              )
            );
            const isCurrentMonthDate = isCurrentMonth(
              new Date(
                groupedVaccinations[dateKey][0].scheduledDate ||
                  groupedVaccinations[dateKey][0].date
              )
            );
            const allCompleted = areAllVaccinesCompletedForDate(
              groupedVaccinations[dateKey]
            );

            let sectionBgColor = theme.cardBackground;
            let sectionBorderColor = "transparent";
            let warningMessage = null;
            let headerTextColor = theme.text;
            let statusText = "";

            if (allCompleted) {
              sectionBgColor = "#E8F5E9";
              sectionBorderColor = "#4CAF50";
              headerTextColor = "#4CAF50";
              statusText = "Completed";
            } else if (isPast && !isCurrentMonthDate) {
              sectionBgColor = "#FFEBEE";
              sectionBorderColor = "#F44336";
              headerTextColor = "#F44336";
              warningMessage =
                "Overdue vaccinations! Please consult your doctor.";
              statusText = "Overdue";
            } else if (isCurrentMonthDate) {
              sectionBgColor = "#E3F2FD";
              sectionBorderColor = "#2196F3";
              headerTextColor = "#2196F3";
              statusText = "Due Now";
            }

            return (
              <View key={dateKey} style={styles.dateGroup}>
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

                {!isCollapsed &&
                  groupedVaccinations[dateKey].map((vaccine) => {
                    const vaccineId = vaccine.vaccineId || vaccine.id;
                    const isCompleted = completedVaccines[vaccineId];

                    let cardBgColor = "#FFFFFF";
                    let cardBorderColor = theme.borderLight;
                    let buttonBgColor = theme.backgroundSecondary;
                    let buttonTextColor = theme.textSecondary;
                    let buttonText = "Mark Complete";

                    if (isCompleted) {
                      cardBgColor = "#E8F5E9";
                      cardBorderColor = "#4CAF50";
                    } else if (isPast && !isCurrentMonthDate) {
                      cardBgColor = "#FFEBEE";
                      cardBorderColor = "#F44336";
                      buttonBgColor = "#F44336";
                      buttonTextColor = "#FFFFFF";
                      buttonText = "Overdue";
                    } else if (isCurrentMonthDate) {
                      cardBgColor = "#E3F2FD";
                      cardBorderColor = "#2196F3";
                      buttonBgColor = "#2196F3";
                      buttonTextColor = "#FFFFFF";
                      buttonText = "Due Now";
                    }

                    return (
                      <View
                        key={vaccineId}
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
                              {vaccine.vaccineName || vaccine.vaccine}
                            </Text>
                            <Text
                              style={[
                                styles.vaccineDose,
                                {
                                  color: isCompleted
                                    ? "#4CAF50"
                                    : isPast && !isCurrentMonthDate
                                    ? "#F44336"
                                    : isCurrentMonthDate
                                    ? "#2196F3"
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
                              onPress={() => markAsCompleted(vaccineId)}
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

                        {completedVaccines[vaccineId]?.notes && (
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
                              {completedVaccines[vaccineId].notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}

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
    maxHeight: 300,
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
