"use client";

import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

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

  // Month selector component
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

  const renderFeedingChart = useCallback(() => {
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

    // Render monthly view (single candle with total values)
    if (timePeriod === "month" && processedData) {
      // Calculate monthly totals
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

      // Find the maximum value for scaling
      const maxValue = Math.max(
        totalBreastDuration,
        totalBottleAmount,
        totalSolidAmount
      );

      // Calculate heights (as percentage of max height)
      const maxHeight = 200;
      const breastHeight =
        maxValue > 0 ? (totalBreastDuration / maxValue) * maxHeight : 0;
      const bottleHeight =
        maxValue > 0 ? (totalBottleAmount / maxValue) * maxHeight : 0;
      const solidHeight =
        maxValue > 0 ? (totalSolidAmount / maxValue) * maxHeight : 0;

      return (
        <View style={styles.customChartContainer}>
          {renderMonthSelector()}

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#FF9500" }]}
              />
              <Text style={[styles.legendText, { color: theme.text }]}>
                Breast (min)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#5AC8FA" }]}
              />
              <Text style={[styles.legendText, { color: theme.text }]}>
                Bottle (ml)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#4CD964" }]}
              />
              <Text style={[styles.legendText, { color: theme.text }]}>
                Solid (g)
              </Text>
            </View>
          </View>

          <View style={styles.monthlyCandleWrapper}>
            <View style={styles.monthlyCandleBody}>
              <View style={styles.monthlyCandleLines}>
                {totalBreastDuration > 0 && (
                  <View
                    style={[
                      styles.monthlyCandleLine,
                      {
                        backgroundColor: "#FF9500",
                        height: breastHeight,
                      },
                    ]}
                  />
                )}
                {totalBottleAmount > 0 && (
                  <View
                    style={[
                      styles.monthlyCandleLine,
                      {
                        backgroundColor: "#5AC8FA",
                        height: bottleHeight,
                      },
                    ]}
                  />
                )}
                {totalSolidAmount > 0 && (
                  <View
                    style={[
                      styles.monthlyCandleLine,
                      {
                        backgroundColor: "#4CD964",
                        height: solidHeight,
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      );
    }

    // Weekly view (clean candles without numbers)
    return (
      <View style={styles.customChartContainer}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9500" }]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}>
              Breast (min)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#5AC8FA" }]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}>
              Bottle (ml)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#4CD964" }]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}>
              Solid (g)
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          <View style={styles.candleChartContainer}>
            {processedData &&
              processedData.labels &&
              processedData.labels.map((label, index) => {
                // Get values for each type
                const breastValue = processedData.breastFeedingData[index] || 0;
                const bottleValue = processedData.bottleFeedingData[index] || 0;
                const solidValue = processedData.solidFoodData[index] || 0;

                // Calculate max value for scaling
                const maxValue = Math.max(breastValue, bottleValue, solidValue);

                // Calculate heights (as percentage of max height)
                const maxHeight = 120;
                const breastHeight =
                  maxValue > 0 ? (breastValue / maxValue) * maxHeight : 0;
                const bottleHeight =
                  maxValue > 0 ? (bottleValue / maxValue) * maxHeight : 0;
                const solidHeight =
                  maxValue > 0 ? (solidValue / maxValue) * maxHeight : 0;

                return (
                  <View key={`candle-${index}`} style={styles.candleContainer}>
                    {/* Removed the values display as requested */}
                    <View style={styles.candleBody}>
                      <View style={styles.candleLines}>
                        {breastValue > 0 && (
                          <View
                            style={[
                              styles.candleLine,
                              {
                                backgroundColor: "#FF9500",
                                height: breastHeight,
                              },
                            ]}
                          />
                        )}
                        {bottleValue > 0 && (
                          <View
                            style={[
                              styles.candleLine,
                              {
                                backgroundColor: "#5AC8FA",
                                height: bottleHeight,
                              },
                            ]}
                          />
                        )}
                        {solidValue > 0 && (
                          <View
                            style={[
                              styles.candleLine,
                              {
                                backgroundColor: "#4CD964",
                                height: solidHeight,
                              },
                            ]}
                          />
                        )}
                      </View>
                    </View>

                    <Text style={[styles.candleLabel, { color: theme.text }]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
          </View>
        </ScrollView>
      </View>
    );
  }, [
    isLoading,
    error,
    chartData,
    processedData,
    theme,
    categoryColor,
    timePeriod,
    selectedMonth,
    selectedYear,
  ]);

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

  const renderDailyFeedingSummary = useCallback(() => {
    if (!processedData || !processedData.dailyFeedings) return null;

    const { dailyFeedings } = processedData;

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

        <View style={styles.feedingLegendContainer}>
          <View style={styles.feedingLegendItem}>
            <Ionicons name="woman-outline" size={24} color="#FF9500" />
            <Text style={[styles.feedingLegendText, { color: theme.text }]}>
              Breast Feeding
            </Text>
          </View>
          <View style={styles.feedingLegendItem}>
            <Ionicons name="water-outline" size={24} color="#5AC8FA" />
            <Text style={[styles.feedingLegendText, { color: theme.text }]}>
              Bottle Feeding
            </Text>
          </View>
          <View style={styles.feedingLegendItem}>
            <Ionicons name="restaurant-outline" size={24} color="#4CD964" />
            <Text style={[styles.feedingLegendText, { color: theme.text }]}>
              Solid Food
            </Text>
          </View>
        </View>

        {dailyFeedings.map((day, i) => {
          return (
            <View
              key={`feeding-day-${i}`}
              style={[
                styles.dailyFeedingRow,
                { borderBottomColor: `${theme.text}10` },
                i === dailyFeedings.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {day.label}
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
          );
        })}
      </View>
    );
  }, [processedData, theme, timePeriod]);

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
  // Custom candle chart styles
  customChartContainer: {
    marginVertical: 20,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
  candleChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150, // Fixed height
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  candleContainer: {
    width: 40,
    marginHorizontal: 5,
    alignItems: "center",
  },
  candleValuesContainer: {
    alignItems: "center",
    marginBottom: 5,
    height: 20,
  },
  candleValue: {
    fontSize: 10,
    marginBottom: 2,
  },
  candleBody: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 100, // Fixed height
  },
  candleLines: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "100%",
  },
  candleLine: {
    width: 8,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  candleLabel: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
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
  // Feeding legend styles
  feedingLegendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  feedingLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 8,
  },
  feedingLegendText: {
    fontSize: 12,
    marginLeft: 6,
  },
  // Monthly candle styles
  monthlyCandleWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    height: 180, // Fixed height
  },
  monthlyCandleBody: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 150, // Fixed height
  },
  monthlyCandleLines: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  monthlyCandleLine: {
    width: 20,
    marginHorizontal: 5,
    borderRadius: 6,
    maxHeight: 150, // Ensure it doesn't exceed the container
  },
  monthlyCandleLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default FeedingChartComponent;
