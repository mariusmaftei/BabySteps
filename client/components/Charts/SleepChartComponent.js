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
  theme,
  categoryColor,
  timePeriod,
  getChartConfig,
  onMonthChange, // New prop for handling month changes
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

    // Create a modified chart config for month view
    let finalChartConfig;
    if (timePeriod === "month") {
      // For month view, create a config with no labels
      finalChartConfig = {
        ...getChartConfig(categoryColor),
        // Override label functions to return empty strings
        propsForLabels: {
          fontSize: 0, // Make labels invisible
        },
        propsForDots: {
          r: "2", // Smaller dots for month view
          strokeWidth: "1",
          stroke: categoryColor,
        },
        // Remove all labels
        formatYLabel: () => "",
        formatXLabel: () => "",
        // Keep the legend
        legend: ["Sleep Progress (%)"],
      };
    } else {
      // For week view, use the normal config
      finalChartConfig = getChartConfig(categoryColor);
    }

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
            chartConfig={finalChartConfig}
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={timePeriod !== "month"}
            withVerticalLabels={timePeriod !== "month"}
            withDots={true}
            fromZero={true}
            bezier={true}
            getDotColor={() => categoryColor}
            // Make sure the legend is always shown
            withLegend={true}
            legendStyle={{
              color: theme.text,
              marginBottom: 8,
            }}
          />
        </View>
      </ScrollView>
    );
  }, [
    isLoading,
    error,
    chartData,
    theme,
    categoryColor,
    getChartConfig,
    timePeriod,
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
    if (!processedData) return null;

    const {
      labels,
      dates,
      napHours,
      nightHours,
      totalSleepHours,
      sleepProgress,
    } = processedData;
    const sunnyColor = "#FF9500"; // Same color as in SleepScreen.js

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
              {/* Day column (left) */}
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {label}
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
                    {nap} hrs
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
                    {night} hrs
                  </Text>
                </View>
              </View>

              {/* Total hours column (right) */}
              <View style={styles.hoursColumn}>
                <Text style={[styles.hoursText, { color: theme.text }]}>
                  {total} hrs
                </Text>
              </View>

              {/* Progress column (far right) */}
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
  }, [processedData, theme, timePeriod]);

  return (
    <>
      {renderMonthNavigation()}
      {renderCustomSleepChart()}

      {processedData && (
        <View>
          <View style={[styles.statsContainer, { borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Average Sleep
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {processedData.averageTotalSleepHours} hrs
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Average Progress
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {processedData.averageSleepProgress}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Trend
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {processedData.trendText}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.insightText,
              { color: theme.textSecondary, borderColor: theme.border },
            ]}
          >
            {processedData.trendText.includes("+")
              ? "Your baby is sleeping better than before! Keep up the good work!"
              : processedData.trendText.includes("-")
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
});

export default SleepChartComponent;
