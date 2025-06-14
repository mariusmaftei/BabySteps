import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Dimensions } from "react-native";

import { useTheme } from "../../context/theme-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChildActivity } from "../../context/child-activity-context";
import {
  getWeeklySleepData,
  getYearlySleepData,
  getSleepDataByMonth,
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
  getFeedingDataByMonth,
} from "../../services/feeding-service";

import SleepChartComponent from "../../components/Charts/SleepChartComponent";
import DiaperChartComponent from "../../components/Charts/DiaperChartComponent";
import FeedingChartComponent from "../../components/Charts/FeedingChartComponent";
import GrowthChartComponent from "../../components/Charts/GrowthChartComponent";

const screenWidth = Dimensions.get("window").width;

const safeReduce = (array, callback, initialValue) => {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return initialValue;
  }
  return array.reduce(callback, initialValue);
};

const getDayFromTimestamp = (timestamp) => {
  if (!timestamp) return null;

  try {
    let day;

    if (timestamp.includes("T")) {
      day = timestamp.split("T")[0].split("-")[2];
    } else if (timestamp.includes(" ")) {
      day = timestamp.split(" ")[0].split("-")[2];
    } else if (timestamp.includes("-")) {
      day = timestamp.split("-")[2];
    }

    return day ? Number.parseInt(day, 10).toString() : null;
  } catch (error) {
    console.error("Error parsing timestamp:", error);
    return null;
  }
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
  const [timePeriod, setTimePeriod] = useState("week");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  const noChildren = !currentChild || currentChild.id === "default";

  const categoryColors = useMemo(
    () => ({
      Sleep: "#5A87FF",
      Feeding: "#FF9500",
      Diaper: "#33b2e8",
      Growth: "#4CD964",
    }),
    []
  );

  const defaultSleepChartData = useMemo(() => {
    return {
      labels:
        timePeriod === "week"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : timePeriod === "month"
          ? Array.from({ length: 31 }, (_, i) => (i + 1).toString())
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
              ? Array(31).fill(0)
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
          ? Array.from({ length: 31 }, (_, i) => (i + 1).toString())
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
              ? Array(31).fill(0)
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
          ? Array.from({ length: 31 }, (_, i) => (i + 1).toString())
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
              ? Array(31).fill(0)
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        },
        {
          data:
            timePeriod === "week"
              ? [0, 0, 0, 0, 0, 0, 0]
              : timePeriod === "month"
              ? Array(31).fill(0)
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(90, 200, 250, ${opacity})`,
        },
        {
          data:
            timePeriod === "week"
              ? [0, 0, 0, 0, 0, 0, 0]
              : timePeriod === "month"
              ? Array(31).fill(0)
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
        },
      ],
      legend: ["Breast (min)", "Bottle (ml)", "Solid (g)"],
      unit: "",
      type: "bar",
    };
  }, [timePeriod]);

  const processedFeedingData = useMemo(() => {
    console.log("=== PROCESSING FEEDING DATA ===");
    console.log("Raw feedingData:", feedingData);
    console.log("feedingData length:", feedingData ? feedingData.length : 0);
    console.log("timePeriod:", timePeriod);
    console.log("selectedMonth:", selectedMonth, "selectedYear:", selectedYear);

    if (
      !feedingData ||
      !Array.isArray(feedingData) ||
      feedingData.length === 0
    ) {
      console.log("No feeding data to process");
      return null;
    }

    console.log("All feeding records:");
    feedingData.forEach((record, index) => {
      console.log(`Record ${index}:`, {
        id: record.id,
        type: record.type,
        date: record.date,
        timestamp: record.timestamp,
        amount: record.amount,
        duration: record.duration,
      });
    });

    const feedingByDay = new Map();

    feedingData.forEach((record, index) => {
      console.log(`Processing record ${index}:`, record);
      const day = record.timestamp
        ? getDayFromTimestamp(record.timestamp)
        : record.date
        ? getDayFromTimestamp(record.date)
        : null;

      if (day) {
        if (!feedingByDay.has(day)) {
          feedingByDay.set(day, {
            day,
            label: day,
            breastDuration: 0,
            bottleAmount: 0,
            solidAmount: 0,
            totalCount: 0,
            feedings: [],
            date:
              record.date ||
              (record.timestamp ? record.timestamp.split("T")[0] : null),
          });
        }

        const dayData = feedingByDay.get(day);
        dayData.feedings.push(record);
        dayData.totalCount++;

        if (record.type === "breast") {
          dayData.breastDuration += Number(record.duration) || 0;
        } else if (record.type === "bottle") {
          dayData.bottleAmount += Number(record.amount) || 0;
        } else if (record.type === "solid") {
          dayData.solidAmount += Number(record.amount) || 0;
        }
      } else {
      }
    });

    const dailyFeedings = Array.from(feedingByDay.values()).sort(
      (a, b) => Number(a.day) - Number(b.day)
    );

    const labels = dailyFeedings.map((day) => day.day);
    const breastFeedingData = dailyFeedings.map((day) => day.breastDuration);
    const bottleFeedingData = dailyFeedings.map((day) => day.bottleAmount);
    const solidFoodData = dailyFeedings.map((day) => day.solidAmount);

    const avgBreastDuration =
      breastFeedingData.length > 0
        ? Math.round(
            breastFeedingData.reduce((sum, val) => sum + val, 0) /
              (breastFeedingData.filter((d) => d > 0).length || 1)
          )
        : 0;

    const avgBottleAmount =
      bottleFeedingData.length > 0
        ? Math.round(
            bottleFeedingData.reduce((sum, val) => sum + val, 0) /
              (bottleFeedingData.filter((a) => a > 0).length || 1)
          )
        : 0;

    const avgSolidAmount =
      solidFoodData.length > 0
        ? Math.round(
            solidFoodData.reduce((sum, val) => sum + val, 0) /
              (solidFoodData.filter((a) => a > 0).length || 1)
          )
        : 0;

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

    const breastPercentage =
      totalCount > 0 ? Math.round((breastCount / totalCount) * 100) : 0;
    const bottlePercentage =
      totalCount > 0 ? Math.round((bottleCount / totalCount) * 100) : 0;
    const solidPercentage =
      totalCount > 0 ? Math.round((solidCount / totalCount) * 100) : 0;

    const result = {
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
      rawData: feedingData,
    };

    return result;
  }, [feedingData]);

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
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(formatDateForPeriod(dateStr, "week"));
      }

      sleepHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        return record && record.sleepProgress !== undefined
          ? Number(record.sleepProgress)
          : 0;
      });

      totalSleepHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        if (record) {
          const nap = Number(record.napHours) || 0;
          const night = Number(record.nightHours) || 0;
          return nap + night;
        }
        return 0;
      });

      napHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        return record ? Number(record.napHours) || 0 : 0;
      });

      nightHours = dates.map((date) => {
        const record = sleepData.find((item) => item && item.date === date);
        return record ? Number(record.nightHours) || 0 : 0;
      });
    } else if (timePeriod === "month") {
      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0
      ).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(selectedYear, selectedMonth, i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(i.toString());
      }

      sleepHours = dates.map((date) => {
        const record = sleepData.find((item) => {
          const itemDate =
            typeof item.date === "string"
              ? item.date
              : item.date.toISOString().split("T")[0];
          return item && itemDate === date;
        });
        return record && record.sleepProgress !== undefined
          ? Number(record.sleepProgress)
          : 0;
      });

      totalSleepHours = dates.map((date) => {
        const record = sleepData.find((item) => {
          const itemDate =
            typeof item.date === "string"
              ? item.date
              : item.date.toISOString().split("T")[0];
          return item && itemDate === date;
        });
        if (record) {
          const nap = Number(record.napHours) || 0;
          const night = Number(record.nightHours) || 0;
          return nap + night;
        }
        return 0;
      });

      napHours = dates.map((date) => {
        const record = sleepData.find((item) => {
          const itemDate =
            typeof item.date === "string"
              ? item.date
              : item.date.toISOString().split("T")[0];
          return item && itemDate === date;
        });
        return record ? Number(record.napHours) || 0 : 0;
      });

      nightHours = dates.map((date) => {
        const record = sleepData.find((item) => {
          const itemDate =
            typeof item.date === "string"
              ? item.date
              : item.date.toISOString().split("T")[0];
          return item && itemDate === date;
        });
        return record ? Number(record.nightHours) || 0 : 0;
      });
    } else if (timePeriod === "year") {
      dates = sleepData.map((item) => item && item.date).filter(Boolean);
      labels = sleepData.map((item) => item && item.month).filter(Boolean);

      sleepHours = sleepData.map((item) =>
        item && item.sleepProgress !== undefined
          ? Number(item.sleepProgress)
          : 0
      );

      totalSleepHours = sleepData.map((item) => {
        if (!item) return 0;
        const nap = Number(item.napHours) || 0;
        const night = Number(item.nightHours) || 0;
        return nap + night;
      });

      napHours = sleepData.map((item) =>
        item ? Number(item.napHours) || 0 : 0
      );
      nightHours = sleepData.map((item) =>
        item ? Number(item.nightHours) || 0 : 0
      );
    }

    const totalHours = safeReduce(sleepHours, (sum, hours) => sum + hours, 0);
    const validSleepHours = sleepHours ? sleepHours.filter((h) => h > 0) : [];
    const averageSleepHours =
      validSleepHours.length > 0
        ? Math.round(totalHours / validSleepHours.length)
        : 0;

    let trendPercentage = 0;
    if (sleepHours && sleepHours.length > 0) {
      if (timePeriod === "week") {
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

    const validTotalSleepHours = totalSleepHours
      ? totalSleepHours.filter((h) => h > 0)
      : [];
    const avgTotalSleepHours =
      validTotalSleepHours.length > 0
        ? safeReduce(totalSleepHours, (sum, hours) => sum + hours, 0) /
          validTotalSleepHours.length
        : 0;

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
  }, [sleepData, timePeriod, selectedMonth, selectedYear]);

  const processedDiaperData = useMemo(() => {
    if (!diaperData || !Array.isArray(diaperData) || diaperData.length === 0)
      return null;

    let dates = [];
    let labels = [];
    let diaperCounts = [];

    if (timePeriod === "week") {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(formatDateForPeriod(dateStr, "week"));
      }

      diaperCounts = dates.map((date) => {
        const records = diaperData.filter((item) => item && item.date === date);
        return records.length;
      });
    } else if (timePeriod === "month") {
      const today = new Date();
      for (let i = 29; i >= 0; i -= 3) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
        labels.push(formatDateForPeriod(dateStr, "month"));
      }

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
        return Math.round(count / 3);
      });
    } else if (timePeriod === "year") {
      dates = diaperData.map((item) => item && item.date).filter(Boolean);
      labels = diaperData.map((item) => item && item.month).filter(Boolean);
      diaperCounts = diaperData.map((item) => (item ? item.count : 0));
      diaperCounts = diaperData.map((item) => (item ? item.count / 30 : 0));
    }

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

    let trendPercentage = 0;
    if (diaperCounts && diaperCounts.length > 0) {
      if (timePeriod === "week") {
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

  const handleSleepMonthDataFetch = async (year, month) => {
    if (noChildren || activeTab !== "Sleep") return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSleepDataByMonth(currentChild.id, year, month);

      setSleepData(data || []);

      setSelectedMonth(month - 1);
      setSelectedYear(year);
    } catch (err) {
      setError(`Failed to load sleep data. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedingMonthChange = async (startDate, endDate) => {
    if (noChildren || activeTab !== "Feeding") return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `Fetching feeding data for month: ${
          startDate.getMonth() + 1
        }/${startDate.getFullYear()}`
      );
      const data = await getFeedingDataByMonth(
        currentChild.id,
        startDate.getFullYear(),
        startDate.getMonth()
      );
      console.log(
        `Feeding data fetched for month: ${data ? data.length : 0} records`
      );
      setFeedingData(data || []);
      setSelectedMonth(startDate.getMonth());
      setSelectedYear(startDate.getFullYear());
    } catch (err) {
      console.error(`Error fetching feeding data for month:`, err);
      setError(
        `Failed to load feeding data for the selected month. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    if (noChildren) return;

    setIsLoading(true);
    setError(null);

    try {
      let data;

      if (activeTab === "Sleep") {
        if (timePeriod === "week") {
          data = await getWeeklySleepData(currentChild.id);
        } else if (timePeriod === "month") {
          data = await getSleepDataByMonth(
            currentChild.id,
            selectedYear,
            selectedMonth + 1
          );
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
        if (timePeriod === "week") {
          data = await getWeeklyFeedingData(currentChild.id);
          if (data && data.length > 0) {
            const dates = [...new Set(data.map((item) => item.date))].sort();
            dates.forEach((date) => {
              const count = data.filter((item) => item.date === date).length;
            });
          } else {
          }
        } else if (timePeriod === "month") {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();

          data = await getFeedingDataByMonth(
            currentChild.id,
            currentYear,
            currentMonth
          );

          setSelectedMonth(now.getMonth());
          setSelectedYear(currentYear);
        }
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

  useEffect(() => {
    fetchData();
  }, [currentChild, noChildren, timePeriod, activeTab]);

  const fetchDataRef = useMemo(
    () => fetchData,
    [currentChild, noChildren, timePeriod, activeTab]
  );

  useFocusEffect(
    useCallback(() => {
      fetchDataRef();
      return () => {};
    }, [fetchDataRef])
  );

  useEffect(() => {
    if (timePeriod === "year") {
      setTimePeriod("month");
    }

    if (timePeriod === "month") {
      const now = new Date();
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
    }
  }, [timePeriod]);

  useEffect(() => {
    if (processedSleepData) {
      setSleepChartData({
        labels: processedSleepData.labels,
        datasets: [
          {
            data: processedSleepData.sleepProgress,
            color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Sleep Progress (%)"],
        unit: "%",
        type: "line",
      });
    } else {
      setSleepChartData({
        labels: defaultSleepChartData.labels,
        datasets: defaultSleepChartData.datasets,
        legend: ["Sleep Progress (%)"],
        unit: "%",
        type: "line",
      });
    }
  }, [processedSleepData, defaultSleepChartData]);

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

  const getChartConfig = useCallback(() => {
    return {
      backgroundColor: theme.cardBackground,
      backgroundGradientFrom: theme.cardBackground,
      backgroundGradientTo: theme.cardBackground,
      decimalPlaces: 0,
      color: (opacity = 1) =>
        `rgba(${hexToRgb(categoryColors[activeTab])}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${hexToRgb(theme.text)}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: categoryColors[activeTab],
      },
    };
  }, [theme.cardBackground, theme.text, categoryColors, activeTab]);

  const hexToRgb = (hex) => {
    if (!hex) return "0, 0, 0";
    hex = hex.replace("#", "");

    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Sleep: "moon",
      Feeding: "restaurant",
      Diaper: "water",
      Growth: "trending-up",
    };

    return icons[category] || "stats-chart";
  };

  const getTimePeriodLabelTextValue = () => {
    if (timePeriod === "week") {
      return "Last 7 days";
    } else if (timePeriod === "month") {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `${monthNames[selectedMonth]} ${selectedYear}`;
    } else {
      return "Last 30 days";
    }
  };

  const handleRefresh = () => {
    if (activeTab === "Sleep" && timePeriod === "month") {
      handleSleepMonthDataFetch(selectedYear, selectedMonth + 1);
    } else {
      fetchData();
    }
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
    categoryColors,
    theme.tabBackground,
    theme.tabActiveText,
    theme.tabInactiveText,
  ]);

  const renderTabs = renderTabsMemoized;

  const renderTimePeriodTabsMemoized = useCallback(() => {
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
  }, [activeTab, categoryColors, theme.textSecondary, timePeriod]);

  const renderTimePeriodTabs = renderTimePeriodTabsMemoized;

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

  const data = {
    Sleep: sleepChartData,
    Feeding: feedingChartData,
    Diaper: diaperChartData,
    Growth: {},
  };

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
            getChartConfig={getChartConfig}
            onFetchMonthlyData={handleSleepMonthDataFetch}
            rawSleepData={sleepData}
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
            getChartConfig={getChartConfig}
            rawData={diaperData}
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
            getChartConfig={getChartConfig}
            onMonthChange={handleFeedingMonthChange}
            currentMonth={selectedMonth}
            currentYear={selectedYear}
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
            getChartConfig={getChartConfig}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (
      activeTab === "Sleep" &&
      timePeriod === "month" &&
      currentChild &&
      currentChild.id !== "default"
    ) {
      if (!sleepData || sleepData.length === 0) {
        handleSleepMonthDataFetch(selectedYear, selectedMonth + 1);
      }
    }
  }, [activeTab, timePeriod, currentChild]);

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
