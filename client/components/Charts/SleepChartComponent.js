"use client";

import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

const SleepChartComponent = ({
  isLoading,
  error,
  chartData,
  processedData,
  rawSleepData, // Add this new prop
  theme,
  categoryColor,
  timePeriod,
  getChartConfig,
  onMonthChange,
}) => {
  // State to track the current month
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Array of month names
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

  // Helper function to extract date from datetime string
  const extractDateFromDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    // Handle both formats: "2025-06-03" and "2025-06-03 12:28:14"
    if (dateTimeString.includes(" ")) {
      return dateTimeString.split(" ")[0]; // Extract just the date part
    }
    return dateTimeString;
  };

  // Function to handle month navigation
  const navigateMonth = (direction) => {
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === "next") {
      if (currentMonth === 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
      }
    } else {
      if (currentMonth === 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
      }
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);

    // Call the parent component's handler if provided
    if (onMonthChange) {
      const startDate = new Date(newYear, newMonth, 1);
      const endDate = new Date(newYear, newMonth + 1, 0); // Last day of the month
      onMonthChange(startDate, endDate);
    }
  };

  // Reset to current month when switching to/from month view
  useEffect(() => {
    if (timePeriod === "month") {
      const now = new Date();
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    }
  }, [timePeriod]);

  // Process raw sleep data for charts
  const processRawSleepData = useCallback(() => {
    console.log("🔄 Processing raw sleep data:", rawSleepData);

    if (
      !rawSleepData ||
      !Array.isArray(rawSleepData) ||
      rawSleepData.length === 0
    ) {
      console.log("❌ No raw sleep data available");
      return null;
    }

    // Get date range based on time period
    const now = new Date();
    let startDate,
      endDate,
      labels = [];

    if (timePeriod === "week") {
      // Get current week (last 7 days)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      endDate = new Date(now);

      // Generate labels for the week
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        labels.push(dayNames[date.getDay()]);
      }
    } else {
      // Monthly view - use current month or selected month
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);

      // Generate labels for the month
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
      }
    }

    console.log("📅 Date range:", { startDate, endDate, labels });

    // Filter data for the current period
    const filteredData = rawSleepData.filter((item) => {
      const itemDate = extractDateFromDateTime(item.date);
      if (!itemDate) return false;

      const date = new Date(itemDate);
      return date >= startDate && date <= endDate;
    });

    console.log("🔍 Filtered sleep data:", filteredData);

    // Initialize arrays for chart data
    const napHours = new Array(labels.length).fill(0);
    const nightHours = new Array(labels.length).fill(0);
    const totalSleepHours = new Array(labels.length).fill(0);
    const sleepProgress = new Array(labels.length).fill(0);
    const dates = [];

    // Generate date strings for each label
    if (timePeriod === "week") {
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date.toISOString().split("T")[0]);
      }
    } else {
      for (let i = 1; i <= labels.length; i++) {
        const date = new Date(currentYear, currentMonth, i);
        dates.push(date.toISOString().split("T")[0]);
      }
    }

    // Map filtered data to chart arrays
    filteredData.forEach((item) => {
      const itemDate = extractDateFromDateTime(item.date);
      const dateIndex = dates.findIndex((date) => date === itemDate);

      if (dateIndex !== -1) {
        napHours[dateIndex] = Number.parseFloat(item.napHours) || 0;
        nightHours[dateIndex] = Number.parseFloat(item.nightHours) || 0;
        totalSleepHours[dateIndex] = Number.parseFloat(item.totalHours) || 0;
        sleepProgress[dateIndex] = Number.parseInt(item.sleepProgress) || 0;

        console.log(`📊 Mapped data for ${itemDate} (index ${dateIndex}):`, {
          nap: napHours[dateIndex],
          night: nightHours[dateIndex],
          total: totalSleepHours[dateIndex],
          progress: sleepProgress[dateIndex],
        });
      }
    });

    // Calculate averages
    const totalDaysWithData = totalSleepHours.filter(
      (hours) => hours > 0
    ).length;
    const averageTotalSleepHours =
      totalDaysWithData > 0
        ? (
            totalSleepHours.reduce((sum, hours) => sum + hours, 0) /
            totalDaysWithData
          ).toFixed(1)
        : "0.0";

    const averageSleepProgress =
      totalDaysWithData > 0
        ? Math.round(
            sleepProgress.reduce((sum, progress) => sum + progress, 0) /
              totalDaysWithData
          )
        : 0;

    const result = {
      labels,
      dates,
      napHours,
      nightHours,
      totalSleepHours,
      sleepProgress,
      averageTotalSleepHours,
      averageSleepProgress,
      trendText:
        averageSleepProgress > 0
          ? `+${averageSleepProgress}%`
          : averageSleepProgress < 0
          ? `${averageSleepProgress}%`
          : "Stable",
    };

    console.log("✅ Final processed data:", result);
    return result;
  }, [rawSleepData, timePeriod, currentMonth, currentYear]);

  // Use processed data if rawSleepData is available, otherwise use the passed processedData
  const finalProcessedData = rawSleepData
    ? processRawSleepData()
    : processedData;

  // Generate chart data from processed sleep data
  const generateChartData = useCallback(() => {
    const processed = finalProcessedData;
    if (!processed) {
      console.log("❌ No processed data for chart generation");
      return null;
    }

    const { labels, napHours, nightHours, totalSleepHours } = processed;

    // Check if we have any data
    const hasData = totalSleepHours.some((hours) => hours > 0);
    if (!hasData) {
      console.log("❌ No sleep data found for chart");
      return null;
    }

    console.log("📊 Generating chart data with:", {
      labels,
      totalSleepHours,
      napHours,
      nightHours,
    });

    return {
      labels,
      datasets: [
        {
          data: napHours,
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Orange for naps
          strokeWidth: 3,
        },
        {
          data: nightHours,
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`, // Blue for night sleep
          strokeWidth: 3,
        },
      ],
    };
  }, [finalProcessedData]);

  const renderCustomSleepChart = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={categoryColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading sleep data...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color={categoryColor} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        </View>
      );
    }

    // Generate chart data from processed sleep data
    const generatedChartData = generateChartData();
    if (
      !generatedChartData ||
      !generatedChartData.datasets ||
      !generatedChartData.datasets.length
    ) {
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

    // Create a modified chart config without legend
    const baseConfig = getChartConfig(categoryColor);

    // Create a completely new config object without any legend properties
    const finalChartConfig = {
      backgroundColor: baseConfig.backgroundColor,
      backgroundGradientFrom: baseConfig.backgroundGradientFrom,
      backgroundGradientTo: baseConfig.backgroundGradientTo,
      color: baseConfig.color,
      strokeWidth: baseConfig.strokeWidth,
      barPercentage: baseConfig.barPercentage,
      useShadowColorFromDataset: baseConfig.useShadowColorFromDataset,
      decimalPlaces: baseConfig.decimalPlaces,
      propsForBackgroundLines: baseConfig.propsForBackgroundLines,
      propsForLabels: {
        fontSize:
          timePeriod === "month" ? 0 : baseConfig.propsForLabels?.fontSize,
        fontWeight: baseConfig.propsForLabels?.fontWeight,
      },
      propsForDots: {
        r: "0",
        strokeWidth: "0",
        stroke: "transparent",
      },
      formatYLabel: () => "",
      formatXLabel: timePeriod === "month" ? () => "" : baseConfig.formatXLabel,
    };

    // Remove the datasets legend property if it exists
    const modifiedChartData = { ...generatedChartData };
    if (modifiedChartData.datasets) {
      modifiedChartData.datasets = modifiedChartData.datasets.map((dataset) => {
        const newDataset = { ...dataset };
        delete newDataset.legend;
        return newDataset;
      });
    }

    // Remove the legend property from chartData if it exists
    delete modifiedChartData.legend;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContainer}
      >
        <View style={styles.chartWrapper}>
          <LineChart
            data={modifiedChartData}
            width={chartWidth}
            height={isSmallScreen ? 220 : 260}
            chartConfig={finalChartConfig}
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={timePeriod !== "month"}
            withVerticalLabels={timePeriod !== "month"}
            withDots={false}
            fromZero={true}
            bezier={true}
            withLegend={false}
            hidePointsAtIndex={[0, 1, 2, 3, 4, 5, 6]} // Hide all points
          />
        </View>
      </ScrollView>
    );
  }, [
    isLoading,
    error,
    theme,
    categoryColor,
    getChartConfig,
    timePeriod,
    generateChartData,
  ]);

  // Month navigation controls
  const renderMonthNavigation = () => {
    if (timePeriod !== "month") return null;

    return (
      <View style={styles.monthNavigationContainer}>
        <TouchableOpacity
          style={styles.monthNavigationButton}
          onPress={() => navigateMonth("prev")}
        >
          <Ionicons name="chevron-back" size={24} color={categoryColor} />
        </TouchableOpacity>

        <View style={styles.monthDisplay}>
          <Text style={[styles.monthText, { color: theme.text }]}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.monthNavigationButton}
          onPress={() => navigateMonth("next")}
        >
          <Ionicons name="chevron-forward" size={24} color={categoryColor} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDailySleepSummary = useCallback(() => {
    if (!finalProcessedData) return null;

    const {
      labels,
      dates,
      napHours,
      nightHours,
      totalSleepHours,
      sleepProgress,
    } = finalProcessedData;
    const sunnyColor = "#FF9500"; // Same color as in SleepScreen.js

    // Filter to only include days with actual sleep data
    const daysWithData = labels
      .map((label, i) => ({
        label,
        date: dates[i],
        nap: napHours[i],
        night: nightHours[i],
        total: totalSleepHours[i],
        progress: sleepProgress[i],
        index: i,
      }))
      .filter((day) => day.nap > 0 || day.night > 0);

    // If no data for this month/week, show a message
    if (daysWithData.length === 0) {
      return (
        <View
          style={[
            styles.dailySleepContainer,
            { backgroundColor: `${theme.cardBackground}80` },
          ]}
        >
          <Text style={[styles.dailySleepTitle, { color: theme.text }]}>
            {timePeriod === "week" ? "Weekly" : "Monthly"} Sleep Summary
          </Text>
          <View style={styles.noDataContainer}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={theme.textSecondary}
            />
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No sleep data recorded for this {timePeriod}.
            </Text>
          </View>
        </View>
      );
    }

    // Render the legend row
    const renderLegendRow = () => (
      <View
        style={[styles.legendRow, { borderBottomColor: `${theme.text}20` }]}
      >
        <View style={styles.dayColumn}>
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Day
          </Text>
        </View>
        <View style={styles.sleepTypeColumn}>
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Nap/Bed
          </Text>
        </View>
        <View style={styles.hoursColumn}>
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Total
          </Text>
        </View>
        <View style={styles.progressColumn}>
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Progress
          </Text>
        </View>
      </View>
    );

    return (
      <View
        style={[
          styles.dailySleepContainer,
          { backgroundColor: `${theme.cardBackground}80` },
        ]}
      >
        <Text style={[styles.dailySleepTitle, { color: theme.text }]}>
          {timePeriod === "week" ? "Weekly" : "Monthly"} Sleep Summary
        </Text>

        {/* Add the legend row */}
        {renderLegendRow()}

        {daysWithData.map((day) => {
          const isPositive = day.progress >= 0;
          const progressColor = isPositive ? "#2ecc71" : "#e74c3c";

          // Format the date for display - extract just the day number
          const dateObj = new Date(day.date);
          const dayNumber = dateObj.getDate(); // Just the day number (1-31)

          return (
            <View
              key={`day-${day.index}`}
              style={[
                styles.dailySleepRow,
                { borderBottomColor: `${theme.text}10` },
                day === daysWithData[daysWithData.length - 1] && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              {/* Day column (left) - show only day number for monthly view */}
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {timePeriod === "month" ? dayNumber : day.label}
                </Text>
              </View>

              {/* Sleep type column (middle) */}
              <View style={styles.sleepTypeColumn}>
                <View style={styles.sleepTypeRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${sunnyColor}20` },
                    ]}
                  >
                    <Ionicons name="sunny" size={16} color={sunnyColor} />
                  </View>
                  <Text
                    style={[
                      styles.sleepTypeText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {day.nap} hrs
                  </Text>
                </View>

                <View style={styles.sleepTypeRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${theme.info}20` },
                    ]}
                  >
                    <Ionicons name="moon" size={16} color={theme.info} />
                  </View>
                  <Text
                    style={[
                      styles.sleepTypeText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {day.night} hrs
                  </Text>
                </View>
              </View>

              {/* Total hours column (right) */}
              <View style={styles.hoursColumn}>
                <Text style={[styles.hoursText, { color: theme.text }]}>
                  {day.total} hrs
                </Text>
              </View>

              {/* Progress column (far right) */}
              <View style={styles.progressColumn}>
                <View style={styles.progressBarContainer}>
                  <View style={styles.centerLine} />

                  {day.progress < 0 && (
                    <View
                      style={[
                        styles.negativeProgressFill,
                        {
                          width: `${
                            Math.min(Math.abs(day.progress), 100) / 2
                          }%`,
                          backgroundColor: "#e74c3c",
                        },
                      ]}
                    />
                  )}

                  {day.progress > 0 && (
                    <View
                      style={[
                        styles.positiveProgressFill,
                        {
                          width: `${Math.min(day.progress, 100) / 2}%`,
                          backgroundColor: "#2ecc71",
                        },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.progressText, { color: progressColor }]}>
                  {isPositive ? `+${day.progress}%` : `${day.progress}%`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [finalProcessedData, theme, timePeriod]);

  return (
    <>
      {renderMonthNavigation()}
      {renderCustomSleepChart()}

      {finalProcessedData && (
        <View>
          <View style={[styles.statsContainer, { borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Average Sleep
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {finalProcessedData.averageTotalSleepHours} hrs
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Average Progress
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {finalProcessedData.averageSleepProgress}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Trend
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {finalProcessedData.trendText}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.insightText,
              { color: theme.textSecondary, borderColor: theme.border },
            ]}
          >
            {finalProcessedData.trendText.includes("+")
              ? "Your baby is sleeping better than before! Keep up the good work!"
              : finalProcessedData.trendText.includes("-")
              ? "Your baby is sleeping a little less than before. Try to establish a consistent bedtime routine."
              : "Your baby's sleep pattern is stable. Consistency is key!"}
          </Text>
        </View>
      )}

      {renderDailySleepSummary()}
    </>
  );
};

const styles = StyleSheet.create({
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
    width: 40,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  hoursColumn: {
    width: 60,
    alignItems: "center",
  },
  hoursText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sleepTypeColumn: {
    width: 90,
  },
  sleepTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sleepTypeText: {
    fontSize: 13,
    marginLeft: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  progressColumn: {
    flex: 1,
    maxWidth: 100,
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
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  // Month navigation styles
  monthNavigationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  monthNavigationButton: {
    padding: 8,
    borderRadius: 20,
  },
  monthDisplay: {
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 150,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    flexDirection: "row",
  },
  noDataText: {
    marginLeft: 8,
    fontSize: 14,
  },
  // Legend row styles
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default SleepChartComponent;
