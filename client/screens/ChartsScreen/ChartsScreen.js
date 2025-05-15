"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
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
import {
  getWeeklyFeedingData,
  getMonthlyFeedingData,
  getFeedingDataByDateRange,
} from "../../services/feeding-service";

// Import chart components
import SleepChartComponent from "../../components/Charts/SleepChartComponent";
import DiaperChartComponent from "../../components/Charts/DiaperChartComponent";
import FeedingChartComponent from "../../components/Charts/FeedingChartComponent";
import GrowthChartComponent from "../../components/Charts/GrowthChartComponent";

const screenWidth = Dimensions.get("window").width;

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
  const [feedingData, setFeedingData] = useState([]);
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

  const [feedingChartData, setFeedingChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [0],
        color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
      },
    ],
    legend: ["Feeding amount per day"],
    unit: "",
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

  const defaultFeedingChartData = useMemo(() => {
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
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        },
        {
          data:
            timePeriod === "week"
              ? [0, 0, 0, 0, 0, 0, 0]
              : timePeriod === "month"
              ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(90, 200, 250, ${opacity})`,
        },
        {
          data:
            timePeriod === "week"
              ? [0, 0, 0, 0, 0, 0, 0]
              : timePeriod === "month"
              ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
        },
      ],
      legend: ["Breast (min)", "Bottle (ml)", "Solid (g)"],
      unit: "",
      type: "bar",
    };
  }, [timePeriod]);

  // Function to fetch data based on selected time period and active tab
  const fetchData = async () => {
    if (noChildren) return;

    setIsLoading(true);
    setError(null);

    try {
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
      } else if (activeTab === "Feeding") {
        // Fetch feeding data
        if (timePeriod === "week") {
          data = await getWeeklyFeedingData(currentChild.id);
        } else if (timePeriod === "month") {
          data = await getMonthlyFeedingData(currentChild.id);
        }
        console.log(
          `${timePeriod} feeding data fetched for charts:`,
          data ? data.length : 0,
          "records"
        );
        setFeedingData(data || []);
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

  // Fetch data when the component mounts, when the current child changes, or when time period changes
  useEffect(() => {
    fetchData();
  }, [currentChild, noChildren, timePeriod, activeTab]);

  // Add a focus effect to refresh data when the screen comes into focus
  const fetchDataRef = useMemo(
    () => fetchData,
    [currentChild, noChildren, timePeriod, activeTab]
  );

  useFocusEffect(
    useCallback(() => {
      console.log("ChartsScreen focused, refreshing data...");
      fetchDataRef();
      return () => {
        // This runs when the screen is unfocused
        console.log("ChartsScreen unfocused");
      };
    }, [fetchDataRef])
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

  // Process feeding data for the chart
  const processedFeedingData = useMemo(() => {
    if (!feedingData || !Array.isArray(feedingData) || feedingData.length === 0)
      return null;

    const dates = [];
    const labels = [];
    const breastFeedingData = [];
    const bottleFeedingData = [];
    const solidFoodData = [];
    const dailyFeedings = [];

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

      // Process feeding data by type for each day
      dates.forEach((date, index) => {
        const dayFeedings = feedingData.filter(
          (item) => item && item.date === date
        );

        // Get breast feeding duration total
        const breastFeedings = dayFeedings.filter(
          (item) => item && item.type === "breast"
        );
        const breastDuration = safeReduce(
          breastFeedings,
          (sum, item) => sum + (Number(item.duration) || 0),
          0
        );
        breastFeedingData.push(breastDuration);

        // Get bottle feeding amount total
        const bottleFeedings = dayFeedings.filter(
          (item) => item && item.type === "bottle"
        );
        const bottleAmount = safeReduce(
          bottleFeedings,
          (sum, item) => sum + (Number(item.amount) || 0),
          0
        );
        bottleFeedingData.push(bottleAmount);

        // Get solid food amount total
        const solidFeedings = dayFeedings.filter(
          (item) => item && item.type === "solid"
        );
        const solidAmount = safeReduce(
          solidFeedings,
          (sum, item) => sum + (Number(item.amount) || 0),
          0
        );
        solidFoodData.push(solidAmount);

        // Store daily feedings for the summary
        dailyFeedings.push({
          date,
          label: labels[index],
          feedings: dayFeedings,
          breastDuration,
          bottleAmount,
          solidAmount,
          totalCount: dayFeedings.length,
        });
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

      // Process feeding data for each 3-day period
      dates.forEach((date, index) => {
        let periodFeedings = [];
        let totalBreastDuration = 0;
        let totalBottleAmount = 0;
        let totalSolidAmount = 0;

        // Collect data for 3 days
        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + i);
          const checkDateStr = checkDate.toISOString().split("T")[0];

          const dayFeedings = feedingData.filter(
            (item) => item && item.date === checkDateStr
          );
          periodFeedings = [...periodFeedings, ...dayFeedings];

          // Calculate breast feeding duration
          const breastFeedings = dayFeedings.filter(
            (item) => item && item.type === "breast"
          );
          totalBreastDuration += safeReduce(
            breastFeedings,
            (sum, item) => sum + (Number(item.duration) || 0),
            0
          );

          // Calculate bottle feeding amount
          const bottleFeedings = dayFeedings.filter(
            (item) => item && item.type === "bottle"
          );
          totalBottleAmount += safeReduce(
            bottleFeedings,
            (sum, item) => sum + (Number(item.amount) || 0),
            0
          );

          // Calculate solid food amount
          const solidFeedings = dayFeedings.filter(
            (item) => item && item.type === "solid"
          );
          totalSolidAmount += safeReduce(
            solidFeedings,
            (sum, item) => sum + (Number(item.amount) || 0),
            0
          );
        }

        // Calculate daily averages
        const avgBreastDuration = Math.round(totalBreastDuration / 3);
        const avgBottleAmount = Math.round(totalBottleAmount / 3);
        const avgSolidAmount = Math.round(totalSolidAmount / 3);

        breastFeedingData.push(avgBreastDuration);
        bottleFeedingData.push(avgBottleAmount);
        solidFoodData.push(avgSolidAmount);

        // Store period data for the summary
        dailyFeedings.push({
          date,
          label: labels[index],
          feedings: periodFeedings,
          breastDuration: avgBreastDuration,
          bottleAmount: avgBottleAmount,
          solidAmount: avgSolidAmount,
          totalCount: Math.round(periodFeedings.length / 3),
        });
      });
    }

    // Calculate averages
    const avgBreastDuration =
      breastFeedingData.length > 0
        ? Math.round(
            safeReduce(
              breastFeedingData,
              (sum, duration) => sum + duration,
              0
            ) / breastFeedingData.filter((d) => d > 0).length || 1
          )
        : 0;

    const avgBottleAmount =
      bottleFeedingData.length > 0
        ? Math.round(
            safeReduce(bottleFeedingData, (sum, amount) => sum + amount, 0) /
              (bottleFeedingData.filter((a) => a > 0).length || 1)
          )
        : 0;

    const avgSolidAmount =
      solidFoodData.length > 0
        ? Math.round(
            safeReduce(solidFoodData, (sum, amount) => sum + amount, 0) /
              (solidFoodData.filter((a) => a > 0).length || 1)
          )
        : 0;

    // Calculate feeding counts by type
    const breastCount = feedingData.filter(
      (item) => item && item.type === "breast"
    ).length;
    const bottleCount = feedingData.filter(
      (item) => item && item.type === "bottle"
    ).length;
    const solidCount = feedingData.filter(
      (item) => item && item.type === "solid"
    ).length;
    const totalCount = feedingData.length;

    // Calculate percentages
    const breastPercentage =
      totalCount > 0 ? Math.round((breastCount / totalCount) * 100) : 0;
    const bottlePercentage =
      totalCount > 0 ? Math.round((bottleCount / totalCount) * 100) : 0;
    const solidPercentage =
      totalCount > 0 ? Math.round((solidCount / totalCount) * 100) : 0;

    // Calculate trend
    let breastTrend = 0;
    let bottleTrend = 0;
    let solidTrend = 0;

    if (breastFeedingData.length > 0) {
      const halfIndex = Math.floor(breastFeedingData.length / 2);
      const recentBreast = breastFeedingData
        .slice(halfIndex)
        .filter((d) => d > 0);
      const previousBreast = breastFeedingData
        .slice(0, halfIndex)
        .filter((d) => d > 0);

      const recentAvg =
        recentBreast.length > 0
          ? safeReduce(recentBreast, (sum, d) => sum + d, 0) /
            recentBreast.length
          : 0;
      const previousAvg =
        previousBreast.length > 0
          ? safeReduce(previousBreast, (sum, d) => sum + d, 0) /
            previousBreast.length
          : 0;

      if (previousAvg > 0) {
        breastTrend = Math.round(
          ((recentAvg - previousAvg) / previousAvg) * 100
        );
      }
    }

    if (bottleFeedingData.length > 0) {
      const halfIndex = Math.floor(bottleFeedingData.length / 2);
      const recentBottle = bottleFeedingData
        .slice(halfIndex)
        .filter((a) => a > 0);
      const previousBottle = bottleFeedingData
        .slice(0, halfIndex)
        .filter((a) => a > 0);

      const recentAvg =
        recentBottle.length > 0
          ? safeReduce(recentBottle, (sum, a) => sum + a, 0) /
            recentBottle.length
          : 0;
      const previousAvg =
        previousBottle.length > 0
          ? safeReduce(previousBottle, (sum, a) => sum + a, 0) /
            previousBottle.length
          : 0;

      if (previousAvg > 0) {
        bottleTrend = Math.round(
          ((recentAvg - previousAvg) / previousAvg) * 100
        );
      }
    }

    if (solidFoodData.length > 0) {
      const halfIndex = Math.floor(solidFoodData.length / 2);
      const recentSolid = solidFoodData.slice(halfIndex).filter((a) => a > 0);
      const previousSolid = solidFoodData
        .slice(0, halfIndex)
        .filter((a) => a > 0);

      const recentAvg =
        recentSolid.length > 0
          ? safeReduce(recentSolid, (sum, a) => sum + a, 0) / recentSolid.length
          : 0;
      const previousAvg =
        previousSolid.length > 0
          ? safeReduce(previousSolid, (sum, a) => sum + a, 0) /
            previousSolid.length
          : 0;

      if (previousAvg > 0) {
        solidTrend = Math.round(
          ((recentAvg - previousAvg) / previousAvg) * 100
        );
      }
    }

    // Format trend text
    const formatTrendText = (trend) => {
      return trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : "Stable";
    };

    return {
      labels,
      breastFeedingData,
      bottleFeedingData,
      solidFoodData,
      dailyFeedings,
      avgBreastDuration,
      avgBottleAmount,
      avgSolidAmount,
      breastCount,
      bottleCount,
      solidCount,
      totalCount,
      breastPercentage,
      bottlePercentage,
      solidPercentage,
      breastTrendText: formatTrendText(breastTrend),
      bottleTrendText: formatTrendText(bottleTrend),
      solidTrendText: formatTrendText(solidTrend),
    };
  }, [feedingData, timePeriod]);

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

  // Add useEffect for feedingChartData
  useEffect(() => {
    if (processedFeedingData) {
      setFeedingChartData({
        labels: processedFeedingData.labels,
        datasets: [
          {
            data: processedFeedingData.breastFeedingData,
            color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
          },
          {
            data: processedFeedingData.bottleFeedingData,
            color: (opacity = 1) => `rgba(90, 200, 250, ${opacity})`,
          },
          {
            data: processedFeedingData.solidFoodData,
            color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
          },
        ],
        legend: ["Breast (min)", "Bottle (ml)", "Solid (g)"],
        unit: "",
        type: "bar",
      });
    } else {
      setFeedingChartData({
        labels: defaultFeedingChartData.labels,
        datasets: defaultFeedingChartData.datasets,
        legend: defaultFeedingChartData.legend,
        unit: defaultFeedingChartData.unit,
        type: defaultFeedingChartData.type,
      });
    }
  }, [processedFeedingData, defaultFeedingChartData]);

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

    const feedingData = {
      labels: feedingChartData.labels || [],
      datasets:
        feedingChartData.datasets && feedingChartData.datasets.length > 0
          ? feedingChartData.datasets
          : [
              {
                data: [0],
                color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              },
              {
                data: [0],
                color: (opacity = 1) => `rgba(90, 200, 250, ${opacity})`,
              },
              {
                data: [0],
                color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
              },
            ],
      legend: ["Breast (min)", "Bottle (ml)", "Solid (g)"],
      unit: "",
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
  }, [sleepChartData, diaperChartData, feedingChartData]);

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
    fetchData();
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
      if (
        activeTab !== "Sleep" &&
        activeTab !== "Diaper" &&
        activeTab !== "Feeding"
      )
        return null;

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

  // Render the appropriate component based on the active tab
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "Sleep":
        return (
          <SleepChartComponent
            isLoading={isLoading}
            error={error}
            chartData={data.Sleep}
            processedData={processedSleepData}
            theme={theme}
            categoryColor={categoryColors.Sleep}
            timePeriod={timePeriod}
            getChartConfig={getChartConfig()}
          />
        );
      case "Diaper":
        return (
          <DiaperChartComponent
            isLoading={isLoading}
            error={error}
            chartData={data.Diaper}
            processedData={processedDiaperData}
            theme={theme}
            categoryColor={categoryColors.Diaper}
            timePeriod={timePeriod}
            getChartConfig={getChartConfig()}
            rawData={diaperData} // Add this line to pass the raw data
          />
        );
      case "Feeding":
        return (
          <FeedingChartComponent
            isLoading={isLoading}
            error={error}
            chartData={data.Feeding}
            processedData={processedFeedingData}
            theme={theme}
            categoryColor={categoryColors.Feeding}
            timePeriod={timePeriod}
            getChartConfig={getChartConfig()}
          />
        );
      case "Growth":
        return (
          <GrowthChartComponent
            isLoading={isLoading}
            error={error}
            chartData={data.Growth}
            processedData={{}}
            theme={theme}
            categoryColor={categoryColors.Growth}
            timePeriod={timePeriod}
            getChartConfig={getChartConfig()}
          />
        );
      default:
        return null;
    }
  };

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
              {(activeTab === "Sleep" ||
                activeTab === "Diaper" ||
                activeTab === "Feeding") &&
                `(${getTimePeriodLabelTextValue()})`}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {renderActiveTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
});
