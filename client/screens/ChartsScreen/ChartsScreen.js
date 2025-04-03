"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "../../context/theme-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChildActivity } from "../../context/child-activity-context";
import {
  getWeeklySleepData,
  getMonthlySleepData,
  getYearlySleepData,
  formatDateForPeriod,
  aggregateSleepDataByMonth,
} from "../../services/sleep-service";
import {
  getWeeklyDiaperData,
  getMonthlyDiaperData,
  getYearlyDiaperData,
  aggregateDiaperDataByMonth,
} from "../../services/diaper-service";

const screenWidth = Dimensions.get("window").width;

// Add this to the styles object
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  tabsContainer: {
    paddingVertical: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  timePeriodTabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 16,
  },
  timePeriodTabNew: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: "center",
    minWidth: 80,
  },
  timePeriodTabTextNew: {
    fontSize: 15,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  chartWrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  chart: {
    marginVertical: 12,
    borderRadius: 16,
    paddingRight: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
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
  loadingContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  chartScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minWidth: "100%",
  },
  valueLabelsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    zIndex: 10,
  },
  valueLabel: {
    position: "absolute",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -12 }],
  },
  valueLabelText: {
    fontSize: 10,
    fontWeight: "600",
  },
  zeroLine: {
    position: "absolute",
    height: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    top: "50%", // Position in the middle of the chart
    left: 40, // Account for y-axis labels
  },
  dailySleepContainer: {
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
    padding: 16,
  },
  dailySleepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dailySleepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dayColumn: {
    width: 50,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  hoursColumn: {
    width: 80,
  },
  hoursText: {
    fontSize: 14,
  },
  progressColumn: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  customChartContainer: {
    height: 280,
    marginVertical: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
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
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
    overflow: "hidden",
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
  negativeProgressFill: {
    position: "absolute",
    height: "100%",
    right: "50%",
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  positiveProgressFill: {
    position: "absolute",
    height: "100%",
    left: "50%",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});

// Helper function to safely reduce an array
const safeReduce = (array, callback, initialValue) => {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return initialValue;
  }
  return array.reduce(callback, initialValue);
};

export default function ChartsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [activeTab, setActiveTab] = useState("Sleep");
  const [sleepData, setSleepData] = useState([]);
  const [diaperData, setDiaperData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState("week"); // 'week', 'month', or 'year'
  const [sleepChartData, setSleepChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [0],
        color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Sleep Progress (%)"],
    unit: "%",
    type: "line",
  });

  const [diaperChartData, setDiaperChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [0],
        color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
      },
    ],
    legend: ["Diaper changes per day"],
    unit: "changes",
    type: "bar",
  });

  // Add a check for no children
  const noChildren = !currentChild || currentChild.id === "default";

  const defaultSleepChartData = useMemo(() => {
    return {
      labels:
        timePeriod === "week"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : timePeriod === "month"
          ? ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28"]
          : [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
      datasets: [
        {
          data:
            timePeriod === "week"
              ? [0, 0, 0, 0, 0, 0, 0]
              : timePeriod === "month"
              ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Hours of sleep per day"],
      unit: "hours",
      type: "line",
    };
  }, [timePeriod]);

  const defaultDiaperChartData = useMemo(() => {
    return {
      labels:
        timePeriod === "week"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : timePeriod === "month"
          ? ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28"]
          : [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
      datasets: [
        {
          data:
            timePeriod === "week"
              ? [0, 0, 0, 0, 0, 0, 0]
              : timePeriod === "month"
              ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
        },
      ],
      legend: ["Diaper changes per day"],
      unit: "changes",
      type: "bar",
    };
  }, [timePeriod]);

  // Function to fetch sleep data based on selected time period
  const fetchSleepData = async () => {
    if (noChildren) return;

    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === "Sleep" || activeTab === "Diaper") {
        console.log(
          `Fetching ${timePeriod} ${activeTab.toLowerCase()} data for charts...`
        );
        let data;

        if (activeTab === "Sleep") {
          if (timePeriod === "week") {
            data = await getWeeklySleepData(currentChild.id);
          } else if (timePeriod === "month") {
            data = await getMonthlySleepData(currentChild.id);
          } else if (timePeriod === "year") {
            const yearData = await getYearlySleepData(currentChild.id);
            data = aggregateSleepDataByMonth(yearData);
          }
          console.log(
            `${timePeriod} sleep data fetched for charts:`,
            data ? data.length : 0,
            "records"
          );
          setSleepData(data || []);
        } else if (activeTab === "Diaper") {
          if (timePeriod === "week") {
            data = await getWeeklyDiaperData(currentChild.id);
          } else if (timePeriod === "month") {
            data = await getMonthlyDiaperData(currentChild.id);
          } else if (timePeriod === "year") {
            const yearData = await getYearlyDiaperData(currentChild.id);
            data = aggregateDiaperDataByMonth(yearData);
          }
          console.log(
            `${timePeriod} diaper data fetched for charts:`,
            data ? data.length : 0,
            "records"
          );
          setDiaperData(data || []);
        }
      }
    } catch (err) {
      console.error(
        `Error fetching ${activeTab.toLowerCase()} data for charts:`,
        err
      );
      setError(
        `Failed to load ${activeTab.toLowerCase()} data. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sleep data when the component mounts, when the current child changes, or when time period changes
  useEffect(() => {
    fetchSleepData();
  }, [currentChild, noChildren, timePeriod, activeTab]);

  // Add a focus effect to refresh data when the screen comes into focus
  const fetchSleepDataRef = useMemo(
    () => fetchSleepData,
    [currentChild, noChildren, timePeriod, activeTab]
  );

  useFocusEffect(
    useCallback(() => {
      console.log("ChartsScreen focused, refreshing data...");
      fetchSleepDataRef();
      return () => {
        // This runs when the screen is unfocused
        console.log("ChartsScreen unfocused");
      };
    }, [fetchSleepDataRef])
  );

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // If timePeriod is set to "year", change it to "month"
    if (timePeriod === "year") {
      setTimePeriod("month");
    }
  }, [timePeriod]);

  // Process sleep data for the chart based on time period
  const processedSleepData = useMemo(() => {
    if (!sleepData || !Array.isArray(sleepData) || sleepData.length === 0)
      return null;

    let dates = [];
    let labels = [];
    let sleepHours = [];
    let totalSleepHours = [];
    let napHours = [];
    let nightHours = [];

    if (timePeriod === "week") {
      // Get the last 7 days (including today)
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(formatDateForPeriod(dateStr, "week"));
      }

      // Map the dates to sleep progress data
      sleepHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        return record && record.sleepProgress !== undefined
          ? Number(record.sleepProgress)
          : 0;
      });

      // Map the dates to total sleep hours
      totalSleepHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        if (record) {
          const nap = Number(record.napHours) || 0;
          const night = Number(record.nightHours) || 0;
          return nap + night;
        }
        return 0;
      });

      // Map the dates to nap hours
      napHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        return record ? Number(record.napHours) || 0 : 0;
      });

      // Map the dates to night hours
      nightHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        return record ? Number(record.nightHours) || 0 : 0;
      });
    } else if (timePeriod === "month") {
      // Get the last 30 days
      const today = new Date();
      // We'll show every 3rd day to avoid overcrowding
      for (let i = 29; i >= 0; i -= 3) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(formatDateForPeriod(dateStr, "month"));
      }

      // Map the dates to sleep progress data (average of 3 days)
      sleepHours = dates.map((date, index) => {
        // For each label, find the average of 3 days
        let total = 0;
        let count = 0;

        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + i);
          const checkDateStr = checkDate.toISOString().split("T")[0];

          const record = sleepData.find(
            (item) => item && item.date === checkDateStr
          );
          if (record && record.sleepProgress !== undefined) {
            total += Number(record.sleepProgress);
            count++;
          }
        }

        return count > 0 ? Math.round(total / count) : 0;
      });

      // Similar for total sleep hours
      totalSleepHours = dates.map((date, index) => {
        let total = 0;
        let count = 0;

        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + i);
          const checkDateStr = checkDate.toISOString().split("T")[0];

          const record = sleepData.find(
            (item) => item && item.date === checkDateStr
          );
          if (record) {
            const nap = Number(record.napHours) || 0;
            const night = Number(record.nightHours) || 0;
            total += nap + night;
            count++;
          }
        }

        return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      });

      // Similar for nap hours
      napHours = dates.map((date, index) => {
        let total = 0;
        let count = 0;

        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + i);
          const checkDateStr = checkDate.toISOString().split("T")[0];

          const record = sleepData.find(
            (item) => item && item.date === checkDateStr
          );
          if (record) {
            total += Number(record.napHours) || 0;
            count++;
          }
        }

        return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      });

      // Similar for night hours
      nightHours = dates.map((date, index) => {
        let total = 0;
        let count = 0;

        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + i);
          const checkDateStr = checkDate.toISOString().split("T")[0];

          const record = sleepData.find(
            (item) => item && item.date === checkDateStr
          );
          if (record) {
            total += Number(record.nightHours) || 0;
            count++;
          }
        }

        return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      });
    } else if (timePeriod === "year") {
      // For yearly view, we use the aggregated monthly data
      dates = sleepData.map((item) => item && item.date).filter(Boolean);
      labels = sleepData.map((item) => item && item.month).filter(Boolean);

      // Use sleepProgress instead of totalHours
      sleepHours = sleepData.map((item) =>
        item && item.sleepProgress !== undefined
          ? Number(item.sleepProgress)
          : 0
      );

      // For total sleep hours, we'll need to calculate from napHours and nightHours
      totalSleepHours = sleepData.map((item) => {
        if (!item) return 0;
        const nap = Number(item.napHours) || 0;
        const night = Number(item.nightHours) || 0;
        return nap + night;
      });

      // Extract nap and night hours
      napHours = sleepData.map((item) =>
        item ? Number(item.napHours) || 0 : 0
      );
      nightHours = sleepData.map((item) =>
        item ? Number(item.nightHours) || 0 : 0
      );
    }

    // Calculate average sleep hours - using safeReduce to avoid errors
    const totalHours = safeReduce(sleepHours, (sum, hours) => sum + hours, 0);
    const validSleepHours = sleepHours ? sleepHours.filter((h) => h > 0) : [];
    const averageSleepHours =
      validSleepHours.length > 0
        ? Math.round(totalHours / validSleepHours.length)
        : 0;

    // Calculate trend
    let trendPercentage = 0;
    if (sleepHours && sleepHours.length > 0) {
      if (timePeriod === "week") {
        // For week: compare last 3 days with previous 4 days
        const recentDays = sleepHours.slice(4).filter((h) => h > 0);
        const previousDays = sleepHours.slice(0, 4).filter((h) => h > 0);

        const recentAvg =
          recentDays.length > 0
            ? safeReduce(recentDays, (sum, h) => sum + h, 0) / recentDays.length
            : 0;
        const previousAvg =
          previousDays.length > 0
            ? safeReduce(previousDays, (sum, h) => sum + h, 0) /
              previousDays.length
            : 0;

        if (previousAvg > 0) {
          trendPercentage = (
            ((recentAvg - previousAvg) / previousAvg) *
            100
          ).toFixed(0);
        }
      } else if (timePeriod === "month") {
        // For month: compare last 15 days with previous 15 days
        const halfIndex = Math.floor(sleepHours.length / 2);
        const recentDays = sleepHours.slice(halfIndex).filter((h) => h > 0);
        const previousDays = sleepHours
          .slice(0, halfIndex)
          .filter((h) => h > 0);

        const recentAvg =
          recentDays.length > 0
            ? safeReduce(recentDays, (sum, h) => sum + h, 0) / recentDays.length
            : 0;
        const previousAvg =
          previousDays.length > 0
            ? safeReduce(previousDays, (sum, h) => sum + h, 0) /
              previousDays.length
            : 0;

        if (previousAvg > 0) {
          trendPercentage = (
            ((recentAvg - previousAvg) / previousAvg) *
            100
          ).toFixed(0);
        }
      } else if (timePeriod === "year") {
        // For year: compare last 6 months with previous 6 months
        const halfIndex = Math.floor(sleepHours.length / 2);
        const recentMonths = sleepHours.slice(halfIndex).filter((h) => h > 0);
        const previousMonths = sleepHours
          .slice(0, halfIndex)
          .filter((h) => h > 0);

        const recentAvg =
          recentMonths.length > 0
            ? safeReduce(recentMonths, (sum, h) => sum + h, 0) /
              recentMonths.length
            : 0;
        const previousAvg =
          previousMonths.length > 0
            ? safeReduce(previousMonths, (sum, h) => sum + h, 0) /
              previousMonths.length
            : 0;

        if (previousAvg > 0) {
          trendPercentage = (
            ((recentAvg - previousAvg) / previousAvg) *
            100
          ).toFixed(0);
        }
      }
    }

    const trendText =
      trendPercentage > 0
        ? `+${trendPercentage}%`
        : trendPercentage < 0
        ? `${trendPercentage}%`
        : "Stable";

    // Calculate average total sleep hours
    const validTotalSleepHours = totalSleepHours
      ? totalSleepHours.filter((h) => h > 0)
      : [];
    const avgTotalSleepHours =
      validTotalSleepHours.length > 0
        ? safeReduce(totalSleepHours, (sum, hours) => sum + hours, 0) /
          validTotalSleepHours.length
        : 0;

    // Update the return object to include all the data we need
    return {
      labels: labels || [],
      dates: dates || [],
      sleepProgress: sleepHours || [],
      totalSleepHours: totalSleepHours || [],
      napHours: napHours || [],
      nightHours: nightHours || [],
      averageSleepProgress:
        sleepHours && sleepHours.length > 0
          ? Math.round(
              safeReduce(sleepHours, (sum, progress) => sum + progress, 0) /
                (sleepHours.filter((p) => p !== 0).length || 1)
            )
          : 0,
      averageTotalSleepHours: Math.round(avgTotalSleepHours * 10) / 10,
      trendText,
    };
  }, [sleepData, timePeriod]);

  // Add processedDiaperData similar to processedSleepData
  const processedDiaperData = useMemo(() => {
    if (!diaperData || !Array.isArray(diaperData) || diaperData.length === 0)
      return null;

    let dates = [];
    let labels = [];
    let diaperCounts = [];

    if (timePeriod === "week") {
      // Get the last 7 days (including today)
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(formatDateForPeriod(dateStr, "week"));
      }

      // Count diaper changes per day
      diaperCounts = dates.map((date) => {
        const records = diaperData.filter((item) => item && item.date === date);
        return records.length;
      });
    } else if (timePeriod === "month") {
      // Get the last 30 days, showing every 3rd day
      const today = new Date();
      for (let i = 29; i >= 0; i -= 3) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(formatDateForPeriod(dateStr, "month"));
      }

      // Count diaper changes for each 3-day period
      diaperCounts = dates.map((date, index) => {
        let count = 0;
        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + i);
          const checkDateStr = checkDate.toISOString().split("T")[0];

          const records = diaperData.filter(
            (item) => item && item.date === checkDateStr
          );
          count += records.length;
        }
        return Math.round(count / 3); // Average per day
      });
    } else if (timePeriod === "year") {
      // For yearly view, use the aggregated monthly data
      dates = diaperData.map((item) => item && item.date).filter(Boolean);
      labels = diaperData.map((item) => item && item.month).filter(Boolean);
      diaperCounts = diaperData.map((item) => (item ? item.count : 0));
      diaperCounts = diaperData.map((item) => (item ? item.count / 30 : 0)); // Average per day
    }

    // Calculate average diaper changes
    const totalChanges =
      diaperCounts && diaperCounts.length > 0
        ? safeReduce(diaperCounts, (sum, count) => sum + count, 0)
        : 0;
    const validDiaperCounts = diaperCounts
      ? diaperCounts.filter((c) => c > 0)
      : [];
    const averageChanges =
      validDiaperCounts.length > 0
        ? Math.round((totalChanges / validDiaperCounts.length) * 10) / 10 || 0
        : 0;

    // Calculate trend
    let trendPercentage = 0;
    if (diaperCounts && diaperCounts.length > 0) {
      if (timePeriod === "week") {
        // For week: compare last 3 days with previous 4 days
        const recentDays = diaperCounts.slice(4).filter((c) => c > 0);
        const previousDays = diaperCounts.slice(0, 4).filter((c) => c > 0);

        const recentAvg =
          recentDays.length > 0
            ? safeReduce(recentDays, (sum, c) => sum + c, 0) / recentDays.length
            : 0;
        const previousAvg =
          previousDays.length > 0
            ? safeReduce(previousDays, (sum, c) => sum + c, 0) /
              previousDays.length
            : 0;

        if (previousAvg > 0) {
          trendPercentage = (
            ((recentAvg - previousAvg) / previousAvg) *
            100
          ).toFixed(0);
        }
      } else if (timePeriod === "month" || timePeriod === "year") {
        // Similar calculation for month and year
        const halfIndex = Math.floor(diaperCounts.length / 2);
        const recentCounts = diaperCounts.slice(halfIndex).filter((c) => c > 0);
        const previousCounts = diaperCounts
          .slice(0, halfIndex)
          .filter((c) => c > 0);

        const recentAvg =
          recentCounts.length > 0
            ? safeReduce(recentCounts, (sum, c) => sum + c, 0) /
              recentCounts.length
            : 0;
        const previousAvg =
          previousCounts.length > 0
            ? safeReduce(previousCounts, (sum, c) => sum + c, 0) /
              previousCounts.length
            : 0;

        if (previousAvg > 0) {
          trendPercentage = (
            ((recentAvg - previousAvg) / previousAvg) *
            100
          ).toFixed(0);
        }
      }
    }

    const trendText =
      trendPercentage > 0
        ? `+${trendPercentage}%`
        : trendPercentage < 0
        ? `${trendPercentage}%`
        : "Stable";

    return {
      labels: labels || [],
      diaperCounts: diaperCounts || [],
      averageChanges,
      trendText,
    };
  }, [diaperData, timePeriod]);

  // In the useEffect that updates sleepChartData, modify to use sleepProgress
  useEffect(() => {
    if (processedSleepData) {
      setSleepChartData({
        labels: processedSleepData.labels,
        datasets: [
          {
            data: processedSleepData.sleepProgress, // Changed from sleepHours to sleepProgress
            color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Sleep Progress (%)"], // Updated legend
        unit: "%", // Changed unit from hours to %
        type: "line",
      });
    } else {
      setSleepChartData({
        labels: defaultSleepChartData.labels,
        datasets: defaultSleepChartData.datasets,
        legend: ["Sleep Progress (%)"], // Updated legend
        unit: "%", // Changed unit from hours to %
        type: "line",
      });
    }
  }, [processedSleepData, defaultSleepChartData]);

  // Add useEffect for diaperChartData
  useEffect(() => {
    if (processedDiaperData) {
      setDiaperChartData({
        labels: processedDiaperData.labels,
        datasets: [
          {
            data: processedDiaperData.diaperCounts,
            color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
          },
        ],
        legend: ["Diaper changes per day"],
        unit: "changes",
        type: "bar",
      });
    } else {
      setDiaperChartData({
        labels: defaultDiaperChartData.labels,
        datasets: defaultDiaperChartData.datasets,
        legend: ["Diaper changes per day"],
        unit: "changes",
        type: "bar",
      });
    }
  }, [processedDiaperData, defaultDiaperChartData]);

  // If there are no children, show a message to add a child
  if (noChildren) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.noChildContainer}>
          <Ionicons
            name="bar-chart"
            size={60}
            color={theme.primary}
            style={styles.noChildIcon}
          />
          <Text style={[styles.noChildTitle, { color: theme.text }]}>
            No Data to Chart
          </Text>
          <Text
            style={[styles.noChildSubtitle, { color: theme.textSecondary }]}
          >
            Add a child in the settings to view charts and analytics
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
      </SafeAreaView>
    );
  }

  // Chart configuration
  const getChartConfig = useCallback(() => {
    return (color) => {
      return {
        backgroundGradientFrom: theme.cardBackground,
        backgroundGradientTo: theme.cardBackground,
        color: (opacity = 1) => `rgba(${hexToRgb(color)}, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0, // Show only integers
        labelColor: (opacity = 1) =>
          `rgba(${hexToRgb(theme.text)}, ${opacity})`,
        style: {
          borderRadius: 16,
        },
        propsForDots: {
          r: "5",
          strokeWidth: "2",
          stroke: theme.cardBackground,
        },
        propsForBackgroundLines: {
          strokeDasharray: "", // solid background lines
          strokeWidth: 1,
          stroke: `${theme.text}15`, // very light grid lines
        },
      };
    };
  }, [theme.cardBackground, theme.text]);

  // Update the data useMemo to reflect the changes
  const data = useMemo(() => {
    const sleepData = {
      labels: sleepChartData.labels || [],
      datasets:
        sleepChartData.datasets && sleepChartData.datasets.length > 0
          ? sleepChartData.datasets
          : [
              {
                data: [0],
                color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
                strokeWidth: 2,
              },
            ],
      legend: ["Sleep Progress (%)"],
      unit: "%",
      type: "line",
    };

    const diaperData = {
      labels: diaperChartData.labels || [],
      datasets:
        diaperChartData.datasets && diaperChartData.datasets.length > 0
          ? diaperChartData.datasets
          : [
              {
                data: [0],
                color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
              },
            ],
      legend: ["Diaper changes per day"],
      unit: "changes",
      type: "bar",
    };

    // Rest of the code remains the same
    const feedingData = {
      labels: ["Breakfast", "Lunch", "Snack", "Dinner"],
      datasets: [
        {
          data: [180, 220, 120, 190],
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        },
      ],
      legend: ["Feeding amount (ml)"],
      unit: "ml",
      type: "bar",
    };

    const growthData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [4.2, 4.8, 5.3, 5.9, 6.4, 6.8],
          color: (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Weight (kg)"],
      unit: "kg",
      type: "line",
    };

    return {
      Sleep: sleepData,
      Feeding: feedingData,
      Diaper: diaperData,
      Growth: growthData,
    };
  }, [sleepChartData, diaperChartData]);

  // Custom colors for each category
  const categoryColors = useMemo(
    () => ({
      Sleep: "#5A87FF",
      Feeding: "#FF9500",
      Diaper: "#FF2D55",
      Growth: "#4CD964",
    }),
    []
  );

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    if (!hex) return "0, 0, 0";
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Get icon for current category
  const getCategoryIcon = (category) => {
    const icons = {
      Sleep: "moon",
      Feeding: "restaurant",
      Diaper: "water",
      Growth: "trending-up",
    };

    return icons[category] || "stats-chart";
  };

  // Get time period label
  const getTimePeriodLabelTextValue = () => {
    if (timePeriod === "week") {
      return "Last 7 days";
    } else {
      return "Last 30 days";
    }
  };

  // Add a refresh button
  const handleRefresh = () => {
    fetchSleepData();
  };

  const renderTabsMemoized = useCallback(() => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {Object.keys(data).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === category
                    ? categoryColors[category]
                    : theme.tabBackground,
              },
            ]}
            onPress={() => setActiveTab(category)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === category
                      ? theme.tabActiveText
                      : theme.tabInactiveText,
                },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }, [
    activeTab,
    data,
    categoryColors,
    theme.tabBackground,
    theme.tabActiveText,
    theme.tabInactiveText,
  ]);

  // Render category tabs
  const renderTabs = renderTabsMemoized;

  const renderTimePeriodTabsMemoized = useCallback(
    (activeTab, categoryColors, theme, timePeriod, setTimePeriod) => {
      if (activeTab !== "Sleep" && activeTab !== "Diaper") return null;

      return (
        <View style={styles.timePeriodTabsContainer}>
          <TouchableOpacity
            style={[
              styles.timePeriodTabNew,
              timePeriod === "week" && {
                borderBottomWidth: 3,
                borderBottomColor: categoryColors[activeTab],
              },
            ]}
            onPress={() => setTimePeriod("week")}
          >
            <Text
              style={[
                styles.timePeriodTabTextNew,
                {
                  color:
                    timePeriod === "week"
                      ? categoryColors[activeTab]
                      : theme.textSecondary,
                  fontWeight: timePeriod === "week" ? "700" : "400",
                },
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.timePeriodTabNew,
              timePeriod === "month" && {
                borderBottomWidth: 3,
                borderBottomColor: categoryColors[activeTab],
              },
            ]}
            onPress={() => setTimePeriod("month")}
          >
            <Text
              style={[
                styles.timePeriodTabTextNew,
                {
                  color:
                    timePeriod === "month"
                      ? categoryColors[activeTab]
                      : theme.textSecondary,
                  fontWeight: timePeriod === "month" ? "700" : "400",
                },
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    []
  );

  // Render time period tabs for Sleep category
  const renderTimePeriodTabs = useCallback(() => {
    return renderTimePeriodTabsMemoized(
      activeTab,
      categoryColors,
      theme,
      timePeriod,
      setTimePeriod
    );
  }, [
    activeTab,
    categoryColors,
    theme,
    timePeriod,
    renderTimePeriodTabsMemoized,
  ]);

  const renderCustomSleepChartMemoized = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={categoryColors.Sleep} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading sleep data...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={40}
            color={categoryColors.Sleep}
          />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        </View>
      );
    }

    const chartData = data.Sleep;
    const color = categoryColors.Sleep;

    // Ensure chartData has valid datasets
    if (!chartData || !chartData.datasets || !chartData.datasets.length) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No chart data available
          </Text>
        </View>
      );
    }

    // Calculate responsive width based on screen size
    const chartWidth = Math.min(screenWidth - 40, 500);
    const isSmallScreen = screenWidth < 350;

    const chartConfig = getChartConfig()(color);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContainer}
      >
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={isSmallScreen ? 220 : 260}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero={true}
            bezier={true}
          />
        </View>
      </ScrollView>
    );
  }, [
    isLoading,
    error,
    data,
    categoryColors,
    theme,
    screenWidth,
    getChartConfig,
  ]);

  // Replace the renderCustomSleepChart function with this new implementation that creates an area chart
  const renderCustomSleepChart = renderCustomSleepChartMemoized;

  const renderDailySleepSummaryMemoized = useCallback(() => {
    if (!processedSleepData) return null;

    const {
      labels,
      dates,
      napHours,
      nightHours,
      totalSleepHours,
      sleepProgress,
    } = processedSleepData;

    return (
      <View
        style={[
          styles.dailySleepContainer,
          { backgroundColor: `${theme.cardBackground}80` },
        ]}
      >
        <Text style={[styles.dailySleepTitle, { color: theme.text }]}>
          Daily Sleep Summary
        </Text>

        {labels.map((label, i) => {
          const nap = napHours[i];
          const night = nightHours[i];
          const total = totalSleepHours[i];
          const progress = sleepProgress[i];
          const isPositive = progress >= 0;
          const progressColor = isPositive ? "#2ecc71" : "#e74c3c";

          return (
            <View
              key={`day-${i}`}
              style={[
                styles.dailySleepRow,
                { borderBottomColor: `${theme.text}10` },
                i === labels.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {label}
                </Text>
              </View>

              <View style={styles.hoursColumn}>
                <Text style={[styles.hoursText, { color: theme.text }]}>
                  {total} hrs
                </Text>
              </View>

              <View style={styles.hoursColumn}>
                <Text
                  style={[styles.hoursText, { color: theme.textSecondary }]}
                >
                  {nap} nap / {night} night
                </Text>
              </View>

              <View style={styles.progressColumn}>
                <View style={styles.progressBarContainer}>
                  <View style={styles.centerLine} />

                  {progress < 0 && (
                    <View
                      style={[
                        styles.negativeProgressFill,
                        {
                          width: `${Math.min(Math.abs(progress), 100) / 2}%`,
                          backgroundColor: "#e74c3c",
                        },
                      ]}
                    />
                  )}

                  {progress > 0 && (
                    <View
                      style={[
                        styles.positiveProgressFill,
                        {
                          width: `${Math.min(progress, 100) / 2}%`,
                          backgroundColor: "#2ecc71",
                        },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.progressText, { color: progressColor }]}>
                  {isPositive ? `+${progress}%` : `${progress}%`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [processedSleepData, theme]);

  // Render daily sleep summary table
  const renderDailySleepSummary = renderDailySleepSummaryMemoized;

  const renderDiaperChartMemoized = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={categoryColors.Diaper} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading diaper data...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={40}
            color={categoryColors.Diaper}
          />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        </View>
      );
    }

    const chartData = data.Diaper;
    const color = categoryColors.Diaper;

    // Ensure chartData has valid datasets
    if (!chartData || !chartData.datasets || !chartData.datasets.length) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No chart data available
          </Text>
        </View>
      );
    }

    // Calculate responsive width based on screen size
    const chartWidth = Math.min(screenWidth - 40, 500);
    const isSmallScreen = screenWidth < 350;

    const chartConfig = getChartConfig()(color);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContainer}
      >
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={isSmallScreen ? 220 : 260}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero={true}
          />
        </View>
      </ScrollView>
    );
  }, [
    isLoading,
    error,
    data,
    categoryColors,
    theme,
    screenWidth,
    getChartConfig,
  ]);

  // Add renderDiaperChart similar to renderSleepChart
  const renderDiaperChart = renderDiaperChartMemoized;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.text }]}>
            Your Baby's Progress
          </Text>
          <Text style={[styles.subHeaderText, { color: theme.textSecondary }]}>
            Track your baby's development with our easy-to-read charts
          </Text>
        </View>

        {renderTabs()}
        {renderTimePeriodTabs()}

        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name={getCategoryIcon(activeTab)}
              size={24}
              color={categoryColors[activeTab]}
            />
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              {activeTab}{" "}
              {activeTab === "Sleep" || activeTab === "Diaper"
                ? `(${getTimePeriodLabelTextValue()})`
                : ""}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {activeTab === "Sleep" && renderCustomSleepChart()}
          {activeTab === "Diaper" && renderDiaperChart()}

          {activeTab === "Sleep" && processedSleepData && (
            <View>
              <View
                style={[styles.statsContainer, { borderColor: theme.border }]}
              >
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Average Sleep
                  </Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {processedSleepData.averageTotalSleepHours} hrs
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Average Progress
                  </Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {processedSleepData.averageSleepProgress}%
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Trend
                  </Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {processedSleepData.trendText}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.insightText,
                  { color: theme.textSecondary, borderColor: theme.border },
                ]}
              >
                {processedSleepData.trendText.includes("+")
                  ? "Your baby is sleeping better than before! Keep up the good work!"
                  : processedSleepData.trendText.includes("-")
                  ? "Your baby is sleeping a little less than before. Try to establish a consistent bedtime routine."
                  : "Your baby's sleep pattern is stable. Consistency is key!"}
              </Text>
            </View>
          )}

          {activeTab === "Sleep" && renderDailySleepSummary()}

          {activeTab === "Diaper" && processedDiaperData && (
            <View>
              <View
                style={[styles.statsContainer, { borderColor: theme.border }]}
              >
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Average Changes
                  </Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {processedDiaperData.averageChanges}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Trend
                  </Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {processedDiaperData.trendText}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.insightText,
                  { color: theme.textSecondary, borderColor: theme.border },
                ]}
              >
                {processedDiaperData.trendText.includes("+")
                  ? "Your baby's diaper changes are increasing. Make sure to keep them dry and comfortable!"
                  : processedDiaperData.trendText.includes("-")
                  ? "Your baby's diaper changes are decreasing. This could be a sign of dehydration, so consult your pediatrician."
                  : "Your baby's diaper change pattern is stable. Keep up the good work!"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
