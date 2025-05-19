"use client";

import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

// Helper function to extract day from ISO timestamp
const getDayFromTimestamp = (timestamp) => {
  if (!timestamp) return null;

  try {
    // Handle different timestamp formats
    let day;

    // Format: "2025-05-19T08:24:11.000Z" (ISO format)
    if (timestamp.includes("T")) {
      day = timestamp.split("T")[0].split("-")[2];
    }
    // Format: "2025-05-19 08:24:11" (database format)
    else if (timestamp.includes(" ")) {
      day = timestamp.split(" ")[0].split("-")[2];
    }
    // Format: "2025-05-19" (date only)
    else if (timestamp.includes("-")) {
      day = timestamp.split("-")[2];
    }

    // Remove leading zeros if any
    return day ? Number.parseInt(day, 10).toString() : null;
  } catch (error) {
    console.error("Error parsing timestamp:", error);
    return null;
  }
};

const FeedingChartComponent = ({
  isLoading,
  error,
  chartData,
  processedData,
  theme,
  categoryColor,
  timePeriod,
  getChartConfig,
  onMonthChange,
  currentMonth,
  currentYear,
}) => {
  // State for month navigation
  const [selectedMonth, setSelectedMonth] = useState(
    currentMonth || new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    currentYear || new Date().getFullYear()
  );

  // Debug the processed data when it changes
  useEffect(() => {
    if (processedData) {
      console.log("DEBUG: Processed feeding data received:", processedData);

      if (processedData.dailyFeedings) {
        console.log(
          "Daily feedings count:",
          processedData.dailyFeedings.length
        );
        processedData.dailyFeedings.forEach((day, index) => {
          console.log(
            `Day ${index}: day=${day.day}, breastDuration=${day.breastDuration}, bottleAmount=${day.bottleAmount}, solidAmount=${day.solidAmount}`
          );
        });
      }

      if (processedData.rawData) {
        console.log("Raw data sample:", processedData.rawData.slice(0, 3));
      }
    }
  }, [processedData]);

  // Handle month navigation
  const handlePreviousMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear = newYear - 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);

    if (onMonthChange) {
      const startDate = new Date(newYear, newMonth, 1);
      const endDate = new Date(newYear, newMonth + 1, 0);
      onMonthChange(startDate, endDate);
    }
  };

  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear = newYear + 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);

    if (onMonthChange) {
      const startDate = new Date(newYear, newMonth, 1);
      const endDate = new Date(newYear, newMonth + 1, 0);
      onMonthChange(startDate, endDate);
    }
  };

  // Month selector component - Always render this for month view
  const renderMonthSelector = () => {
    if (timePeriod !== "month") return null;

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

    return (
      <View style={styles.monthSelectorContainer}>
        <TouchableOpacity
          onPress={handlePreviousMonth}
          style={styles.monthNavButton}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.monthSelectorText, { color: theme.text }]}>
          {monthNames[selectedMonth]} {selectedYear}
        </Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.monthNavButton}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    );
  };

  // Update the renderDailyFeedingSummary function to only show days with data
  const renderDailyFeedingSummary = useCallback(() => {
    if (!processedData || !processedData.dailyFeedings) return null;

    // We're already getting filtered data from ChartsScreen, so we can use it directly
    const daysWithData = processedData.dailyFeedings.filter(
      (day) =>
        day.breastDuration > 0 || day.bottleAmount > 0 || day.solidAmount > 0
    );

    // If no days with data, show a message
    if (daysWithData.length === 0) {
      return (
        <View
          style={[
            styles.dailyFeedingContainer,
            { backgroundColor: `${theme.cardBackground}80` },
          ]}
        >
          <Text style={[styles.dailyFeedingTitle, { color: theme.text }]}>
            {timePeriod === "week" ? "Weekly" : "Monthly"} Feeding Summary
          </Text>
          <View style={styles.noDataContainer}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={theme.textSecondary}
            />
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No feeding data recorded for this {timePeriod}.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.dailyFeedingContainer,
          { backgroundColor: `${theme.cardBackground}80` },
        ]}
      >
        <Text style={[styles.dailyFeedingTitle, { color: theme.text }]}>
          {timePeriod === "week" ? "Weekly" : "Monthly"} Feeding Summary
        </Text>

        {/* Legend row */}
        <View
          style={[styles.legendRow, { borderBottomColor: `${theme.text}20` }]}
        >
          <View style={styles.dayColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Day
            </Text>
          </View>
          <View style={styles.feedingTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Breast Feeding
            </Text>
          </View>
          <View style={styles.feedingTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Bottle Feeding
            </Text>
          </View>
          <View style={styles.feedingTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Solid Food
            </Text>
          </View>
        </View>

        {/* Data rows - only for days with data */}
        {daysWithData.map((day, i) => (
          <View
            key={`feeding-day-${i}`}
            style={[
              styles.dailyFeedingRow,
              { borderBottomColor: `${theme.text}10` },
              i === daysWithData.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.dayColumn}>
              <Text style={[styles.dayText, { color: theme.text }]}>
                {day.day}
              </Text>
            </View>

            <View style={styles.feedingTypeColumn}>
              <View
                style={[
                  styles.feedingTypeIndicator,
                  { backgroundColor: "#FF9500" },
                ]}
              />
              <Text style={[styles.feedingTypeText, { color: theme.text }]}>
                {day.breastDuration} min
              </Text>
            </View>

            <View style={styles.feedingTypeColumn}>
              <View
                style={[
                  styles.feedingTypeIndicator,
                  { backgroundColor: "#5AC8FA" },
                ]}
              />
              <Text style={[styles.feedingTypeText, { color: theme.text }]}>
                {day.bottleAmount} ml
              </Text>
            </View>

            <View style={styles.feedingTypeColumn}>
              <View
                style={[
                  styles.feedingTypeIndicator,
                  { backgroundColor: "#4CD964" },
                ]}
              />
              <Text style={[styles.feedingTypeText, { color: theme.text }]}>
                {day.solidAmount} g
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }, [processedData, theme, timePeriod]);

  // Update the renderFeedingChart function to always show month selector in month view
  const renderFeedingChart = useCallback(() => {
    // Always show month selector in month view, even when loading or no data
    if (timePeriod === "month") {
      return (
        <View style={styles.customChartContainer}>
          {renderMonthSelector()}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={categoryColor} />
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Loading feeding data...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color={categoryColor} />
              <Text style={[styles.errorText, { color: theme.text }]}>
                {error}
              </Text>
            </View>
          ) : !processedData ||
            !processedData.dailyFeedings ||
            processedData.dailyFeedings.length === 0 ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.text }]}>
                No feeding data recorded for {getMonthName(selectedMonth)}{" "}
                {selectedYear}.
              </Text>
            </View>
          ) : (
            renderPieChart()
          )}
        </View>
      );
    }

    // For week view, use the original logic
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={categoryColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading feeding data...
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

    // Ensure we have processed data
    if (
      !processedData ||
      !processedData.dailyFeedings ||
      processedData.dailyFeedings.length === 0
    ) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No feeding data recorded for this week.
          </Text>
        </View>
      );
    }

    return renderPieChart();
  }, [
    isLoading,
    error,
    processedData,
    theme,
    categoryColor,
    timePeriod,
    selectedMonth,
    selectedYear,
  ]);

  // Helper function to get month name
  const getMonthName = (monthIndex) => {
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
    return monthNames[monthIndex];
  };

  // Extract pie chart rendering to a separate function
  const renderPieChart = useCallback(() => {
    // Calculate total values for pie chart
    const totalBreastDuration = processedData.breastFeedingData.reduce(
      (sum, val) => sum + val,
      0
    );
    const totalBottleAmount = processedData.bottleFeedingData.reduce(
      (sum, val) => sum + val,
      0
    );
    const totalSolidAmount = processedData.solidFoodData.reduce(
      (sum, val) => sum + val,
      0
    );

    // Check if there's any data
    const hasData =
      totalBreastDuration > 0 || totalBottleAmount > 0 || totalSolidAmount > 0;

    if (!hasData) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No feeding data recorded for this {timePeriod}.
          </Text>
        </View>
      );
    }

    // Create pie chart data with transparent legend text to hide it
    const pieChartData = [
      {
        name: "Breast",
        value: totalBreastDuration,
        color: "#FF9500",
        legendFontColor: "transparent", // Hide legend text
        legendFontSize: 0,
      },
      {
        name: "Bottle",
        value: totalBottleAmount,
        color: "#5AC8FA",
        legendFontColor: "transparent", // Hide legend text
        legendFontSize: 0,
      },
      {
        name: "Solid",
        value: totalSolidAmount,
        color: "#4CD964",
        legendFontColor: "transparent", // Hide legend text
        legendFontSize: 0,
      },
    ];

    // Filter out zero values
    const filteredPieData = pieChartData.filter((item) => item.value > 0);

    return (
      <View style={styles.chartWrapper}>
        <PieChart
          data={filteredPieData}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: theme.cardBackground,
            backgroundGradientFrom: theme.cardBackground,
            backgroundGradientTo: theme.cardBackground,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => theme.text,
          }}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="0"
          center={[screenWidth / 4, 0]} // Center the chart
          absolute
          hasLegend={false} // Disable the legend completely
        />
      </View>
    );
  }, [processedData, theme, timePeriod]);

  const renderFeedingSummary = useCallback(() => {
    if (!processedData) return null;

    // Check if there's any feeding data
    const hasData =
      processedData.breastFeedingData.some((val) => val > 0) ||
      processedData.bottleFeedingData.some((val) => val > 0) ||
      processedData.solidFoodData.some((val) => val > 0);

    if (!hasData) return null;

    return (
      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: theme.cardBackground },
        ]}
      >
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Feeding Summary
          </Text>
        </View>

        <View style={styles.summaryStatsContainer}>
          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#FF9500" }]}
            >
              <Ionicons name="woman-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {processedData.avgBreastDuration} min
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Avg. Breast
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#5AC8FA" }]}
            >
              <Ionicons name="water-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {processedData.avgBottleAmount} ml
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Avg. Bottle
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#4CD964" }]}
            >
              <Ionicons name="restaurant-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {processedData.avgSolidAmount} g
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Avg. Solid
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryDivider,
            { backgroundColor: `${theme.text}15` },
          ]}
        />

        <View style={styles.summaryDistributionContainer}>
          <Text
            style={[styles.summaryDistributionTitle, { color: theme.text }]}
          >
            Feeding Distribution
          </Text>

          <View style={styles.distributionBarContainer}>
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#FF9500",
                  width: `${processedData.breastPercentage}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#5AC8FA",
                  width: `${processedData.bottlePercentage}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#4CD964",
                  width: `${processedData.solidPercentage}%`,
                },
              ]}
            />
          </View>

          <View style={styles.distributionLabelsContainer}>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Breast {processedData.breastPercentage}%
            </Text>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Bottle {processedData.bottlePercentage}%
            </Text>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Solid {processedData.solidPercentage}%
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryDivider,
            { backgroundColor: `${theme.text}15` },
          ]}
        />

        <Text style={[styles.insightText, { color: theme.textSecondary }]}>
          Your baby's feeding pattern shows a good balance between different
          feeding types. Maintain a consistent schedule for optimal growth and
          development.
        </Text>
      </View>
    );
  }, [processedData, theme]);

  return (
    <>
      {renderFeedingChart()}
      {renderFeedingSummary()}
      {renderDailyFeedingSummary()}
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
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dailyFeedingContainer: {
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
    padding: 16,
  },
  dailyFeedingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dailyFeedingRow: {
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
  feedingTypeColumn: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  feedingTypeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  feedingTypeText: {
    fontSize: 12,
  },
  // Custom chart styles
  customChartContainer: {
    marginVertical: 20,
    height: 220,
    width: "100%",
  },
  // Month selector styles
  monthSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  monthNavButton: {
    padding: 5,
  },
  monthSelectorText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 10,
  },
  // Summary styles
  summaryContainer: {
    borderRadius: 12,
    marginTop: 20,
    overflow: "hidden",
  },
  summaryHeader: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryStatItem: {
    alignItems: "center",
  },
  summaryStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryDivider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
  },
  summaryDistributionContainer: {
    paddingHorizontal: 16,
  },
  summaryDistributionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  distributionBarContainer: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  distributionBarSegment: {
    height: "100%",
  },
  distributionLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  distributionLabel: {
    fontSize: 12,
  },
  // Legend row styles
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  legendText: {
    fontSize: 12,
  },
  // No data styles
  noDataContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noDataText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default FeedingChartComponent;
