"use client";

import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

// Helper function to get day of week abbreviation from date
const getDayOfWeekAbbr = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } catch (error) {
    console.error("Error getting day of week:", error);
    return null;
  }
};

const FeedingChartComponent = ({
  isLoading,
  error,
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

  // Feeding colors - same as in FeedingScreen.js
  const breastColor = "#FF9500";
  const bottleColor = "#5A87FF";
  const solidColor = "#4CD964";

  // Debug the processed data when it changes
  useEffect(() => {
    console.log("=== PROCESSED DATA CHANGED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Processed data:", processedData);
    console.log("Current timePeriod:", timePeriod);
    console.log("Selected month/year:", selectedMonth, selectedYear);
  }, [processedData, timePeriod, selectedMonth, selectedYear]);

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

  // Render the chart based on the time period
  const renderChart = useCallback(() => {
    if (
      !processedData ||
      !processedData.dailyFeedings ||
      processedData.dailyFeedings.length === 0
    ) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No feeding data recorded for{" "}
            {timePeriod === "month"
              ? getMonthName(selectedMonth) + " " + selectedYear
              : "this " + timePeriod}
            .
          </Text>
        </View>
      );
    }

    // For pie chart showing distribution
    if (processedData.breastPercentage !== undefined) {
      const pieData = [
        {
          name: "Breast",
          value: processedData.breastPercentage,
          color: breastColor,
          legendFontColor: "transparent",
          legendFontSize: 0,
        },
        {
          name: "Bottle",
          value: processedData.bottlePercentage,
          color: bottleColor,
          legendFontColor: "transparent",
          legendFontSize: 0,
        },
      ];

      if (processedData.solidPercentage > 0) {
        pieData.push({
          name: "Solid",
          value: processedData.solidPercentage,
          color: solidColor,
          legendFontColor: "transparent",
          legendFontSize: 0,
        });
      }

      return (
        <View style={styles.chartWrapper}>
          <PieChart
            data={pieData}
            width={screenWidth}
            height={180}
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
            center={[screenWidth / 4, 0]}
            absolute
            hasLegend={false}
          />
        </View>
      );
    }

    // Fallback to bar chart
    const chartData = {
      labels:
        processedData.labels ||
        processedData.dailyFeedings.map((day) => day.day),
      datasets: [
        {
          data: processedData.dailyFeedings.map(
            (day) => day.breastDuration + day.bottleAmount + day.solidAmount
          ),
          color: (opacity = 1) => categoryColor,
        },
      ],
    };

    return (
      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          width={screenWidth - 32}
          height={180}
          chartConfig={{
            backgroundColor: theme.cardBackground,
            backgroundGradientFrom: theme.cardBackground,
            backgroundGradientTo: theme.cardBackground,
            decimalPlaces: 0,
            color: (opacity = 1) => categoryColor,
            labelColor: (opacity = 1) => theme.text,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
          showValuesOnTopOfBars={true}
        />
      </View>
    );
  }, [
    processedData,
    theme,
    categoryColor,
    timePeriod,
    selectedMonth,
    selectedYear,
    breastColor,
    bottleColor,
    solidColor,
  ]);

  // Render the feeding chart with loading/error states
  const renderFeedingChart = useCallback(() => {
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
          ) : !processedData ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.text }]}>
                No feeding data recorded for {getMonthName(selectedMonth)}{" "}
                {selectedYear}.
              </Text>
            </View>
          ) : (
            renderChart()
          )}
        </View>
      );
    }

    // For week view
    if (isLoading) {
      return (
        <View style={styles.customChartContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={categoryColor} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading feeding data...
            </Text>
          </View>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.customChartContainer}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={40} color={categoryColor} />
            <Text style={[styles.errorText, { color: theme.text }]}>
              {error}
            </Text>
          </View>
        </View>
      );
    }

    if (!processedData) {
      return (
        <View style={styles.customChartContainer}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.text }]}>
              No feeding data recorded for this week.
            </Text>
          </View>
        </View>
      );
    }

    return <View style={styles.customChartContainer}>{renderChart()}</View>;
  }, [
    isLoading,
    error,
    processedData,
    theme,
    categoryColor,
    timePeriod,
    selectedMonth,
    selectedYear,
    renderChart,
  ]);

  // Render the daily feeding summary
  const renderDailySummary = useCallback(() => {
    if (
      !processedData ||
      !processedData.dailyFeedings ||
      processedData.dailyFeedings.length === 0
    ) {
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
              No feeding data recorded for{" "}
              {timePeriod === "month"
                ? getMonthName(selectedMonth) + " " + selectedYear
                : "this " + timePeriod}
              .
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
              Breast
            </Text>
          </View>
          <View style={styles.feedingTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Bottle
            </Text>
          </View>
          <View style={styles.feedingTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Solid
            </Text>
          </View>
        </View>

        {processedData.dailyFeedings.map((day, i) => {
          // For weekly view, show day of week (Mon, Tue, etc.)
          // For monthly view, show day number (1, 2, 3, etc.)
          const dayDisplay =
            timePeriod === "week" && day.date
              ? getDayOfWeekAbbr(day.date)
              : day.day;

          return (
            <View
              key={`feeding-day-${i}`}
              style={[
                styles.dailyFeedingRow,
                { borderBottomColor: `${theme.text}10` },
                i === processedData.dailyFeedings.length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {dayDisplay}
                </Text>
              </View>

              <View style={styles.feedingTypeColumn}>
                <View
                  style={[
                    styles.feedingTypeIndicator,
                    { backgroundColor: breastColor },
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
                    { backgroundColor: bottleColor },
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
                    { backgroundColor: solidColor },
                  ]}
                />
                <Text style={[styles.feedingTypeText, { color: theme.text }]}>
                  {day.solidAmount} g
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [
    processedData,
    theme,
    timePeriod,
    selectedMonth,
    selectedYear,
    breastColor,
    bottleColor,
    solidColor,
  ]);

  // Render the feeding summary
  const renderFeedingSummary = useCallback(() => {
    if (!processedData) return null;

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
              style={[
                styles.summaryStatIcon,
                { backgroundColor: `${breastColor}20` },
              ]}
            >
              <FontAwesome5 name="heart" size={20} color={breastColor} />
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
              style={[
                styles.summaryStatIcon,
                { backgroundColor: `${bottleColor}20` },
              ]}
            >
              <Ionicons name="water" size={20} color={bottleColor} />
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

          {processedData.avgSolidAmount > 0 && (
            <View style={styles.summaryStatItem}>
              <View
                style={[
                  styles.summaryStatIcon,
                  { backgroundColor: `${solidColor}20` },
                ]}
              >
                <Ionicons name="restaurant" size={20} color={solidColor} />
              </View>
              <Text style={[styles.summaryStatValue, { color: theme.text }]}>
                {processedData.avgSolidAmount} g
              </Text>
              <Text
                style={[
                  styles.summaryStatLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Avg. Solid
              </Text>
            </View>
          )}
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
                  backgroundColor: breastColor,
                  width: `${processedData.breastPercentage}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: bottleColor,
                  width: `${processedData.bottlePercentage}%`,
                },
              ]}
            />
            {processedData.solidPercentage > 0 && (
              <View
                style={[
                  styles.distributionBarSegment,
                  {
                    backgroundColor: solidColor,
                    width: `${processedData.solidPercentage}%`,
                  },
                ]}
              />
            )}
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
            {processedData.solidPercentage > 0 && (
              <Text
                style={[
                  styles.distributionLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Solid {processedData.solidPercentage}%
              </Text>
            )}
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
  }, [processedData, theme, breastColor, bottleColor, solidColor]);

  return (
    <>
      {renderFeedingChart()}
      {renderFeedingSummary()}
      {renderDailySummary()}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    height: 180,
  },
  chart: {
    marginVertical: 12,
    borderRadius: 16,
  },
  dailyFeedingContainer: {
    marginTop: 10,
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
  customChartContainer: {
    marginVertical: 10,
    height: 220,
    width: "100%",
  },
  monthSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  monthNavButton: {
    padding: 5,
  },
  monthSelectorText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 10,
  },
  summaryContainer: {
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 0,
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
