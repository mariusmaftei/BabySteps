"use client";

import { useCallback, useEffect, useMemo } from "react"; // Add useMemo
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

const DiaperChartComponent = ({
  isLoading,
  error,
  chartData,
  processedData,
  theme,
  categoryColor,
  timePeriod,
  getChartConfig,
  rawData,
}) => {
  // Add useEffect for debugging
  useEffect(() => {
    console.log(
      "DiaperChartComponent rawData:",
      rawData?.length || 0,
      "records"
    );
    console.log("DiaperChartComponent rawData sample:", rawData?.[0]);
    console.log("DiaperChartComponent chartData:", chartData);
    console.log("DiaperChartComponent processedData:", processedData);
  }, [rawData, chartData, processedData]);

  // Process daily summary data
  const dailySummaryData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // Group diaper changes by date
    const groupedByDate = {};

    // First, collect all dates from the data
    rawData.forEach((record) => {
      const date = new Date(record.date);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {
          date: dateStr,
          displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
          wet: 0,
          dirty: 0,
          both: 0,
          total: 0,
        };
      }

      if (record.type === "wet") groupedByDate[dateStr].wet++;
      else if (record.type === "dirty") groupedByDate[dateStr].dirty++;
      else if (record.type === "both") groupedByDate[dateStr].both++;

      groupedByDate[dateStr].total++;
    });

    // Convert to array and sort by date (newest first)
    const dailyData = Object.values(groupedByDate);
    dailyData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to last 7 days for week view or 10 days for month view
    const limit = timePeriod === "week" ? 7 : 10;
    return dailyData.slice(0, limit);
  }, [rawData, timePeriod]);

  // Fix the date parsing in the renderDiaperChart function
  const renderDiaperChart = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={categoryColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading diaper data...
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

    // If we have raw data but no chart data, process it here as a fallback
    let displayChartData = chartData;
    if (
      !chartData?.datasets?.[0]?.data?.some((val) => val > 0) &&
      rawData &&
      rawData.length > 0
    ) {
      console.log("Processing raw diaper data as fallback");

      // Process raw data into chart format
      const labels = [];
      const wetCounts = [];
      const dirtyCounts = [];
      const bothCounts = [];
      const totalCounts = [];

      // Group by date - handle ISO date strings properly
      const groupedByDate = {};
      rawData.forEach((record) => {
        // Parse the date string to get a Date object
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { wet: 0, dirty: 0, both: 0, total: 0 };
        }

        if (record.type === "wet") groupedByDate[dateStr].wet++;
        else if (record.type === "dirty") groupedByDate[dateStr].dirty++;
        else if (record.type === "both") groupedByDate[dateStr].both++;

        groupedByDate[dateStr].total++;
      });

      // Convert grouped data to arrays for chart
      Object.keys(groupedByDate).forEach((date) => {
        labels.push(date);
        wetCounts.push(groupedByDate[date].wet);
        dirtyCounts.push(groupedByDate[date].dirty);
        bothCounts.push(groupedByDate[date].both);
        totalCounts.push(groupedByDate[date].total);
      });

      displayChartData = {
        labels,
        datasets: [
          {
            data: totalCounts,
            color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`, // Main color - pink
          },
        ],
        legend: ["Diaper changes per day"],
      };

      console.log("Created displayChartData:", displayChartData);
    }

    // Ensure we have valid chart data
    if (!displayChartData?.datasets?.[0]?.data?.some((val) => val > 0)) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No diaper data available for this time period
          </Text>
        </View>
      );
    }

    // Calculate responsive width based on screen size
    const chartWidth = Math.min(screenWidth - 40, 500);
    const isSmallScreen = screenWidth < 350;

    const chartConfig = getChartConfig(categoryColor);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContainer}
      >
        <View style={styles.chartWrapper}>
          <BarChart
            data={displayChartData}
            width={chartWidth}
            height={isSmallScreen ? 220 : 260}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero={true}
            showBarTops={false}
            showValuesOnTopOfBars={true}
            segments={5}
          />
        </View>
      </ScrollView>
    );
  }, [
    isLoading,
    error,
    chartData,
    rawData,
    theme,
    categoryColor,
    getChartConfig,
  ]);

  // Calculate summary statistics from raw data
  const renderSummaryStats = useCallback(() => {
    if (!rawData || rawData.length === 0) return null;

    // Count diaper types
    const counts = { wet: 0, dirty: 0, both: 0, total: rawData.length };
    rawData.forEach((record) => {
      if (record.type === "wet") counts.wet++;
      else if (record.type === "dirty") counts.dirty++;
      else if (record.type === "both") counts.both++;
    });

    // Calculate daily average
    const timeSpan = timePeriod === "week" ? 7 : 30;
    const dailyAverage = (counts.total / timeSpan).toFixed(1);

    // Determine most common type
    let mostCommonType = "wet";
    if (counts.dirty > counts.wet && counts.dirty > counts.both)
      mostCommonType = "dirty";
    if (counts.both > counts.wet && counts.both > counts.dirty)
      mostCommonType = "both";

    return (
      <View>
        <View style={[styles.statsContainer, { borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Changes
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {counts.total}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Daily Average
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {dailyAverage}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Most Common
            </Text>
            <Text
              style={[
                styles.statValue,
                { color: theme.text, textTransform: "capitalize" },
              ]}
            >
              {mostCommonType}
            </Text>
          </View>
        </View>

        <View style={[styles.typeBreakdown, { borderColor: theme.border }]}>
          <Text style={[styles.breakdownTitle, { color: theme.text }]}>
            Diaper Type Breakdown:
          </Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View
                style={[
                  styles.colorIndicator,
                  { backgroundColor: "royalblue" },
                ]}
              />
              <Text style={[styles.breakdownLabel, { color: theme.text }]}>
                Wet: {counts.wet}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.colorIndicator, { backgroundColor: "brown" }]}
              />
              <Text style={[styles.breakdownLabel, { color: theme.text }]}>
                Dirty: {counts.dirty}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.colorIndicator, { backgroundColor: "purple" }]}
              />
              <Text style={[styles.breakdownLabel, { color: theme.text }]}>
                Both: {counts.both}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.insightText,
            { color: theme.textSecondary, borderColor: theme.border },
          ]}
        >
          {dailyAverage >= 6
            ? "Your baby has a healthy number of diaper changes. This indicates good hydration and digestion."
            : dailyAverage >= 4
            ? "Your baby's diaper changes are within normal range. Monitor for any changes in pattern."
            : "Your baby may have fewer diaper changes than expected. Ensure proper hydration and consult your pediatrician if concerned."}
        </Text>
      </View>
    );
  }, [rawData, timePeriod, theme]);

  // Render daily diaper summary
  const renderDailySummary = useCallback(() => {
    if (!dailySummaryData || dailySummaryData.length === 0) return null;

    return (
      <View
        style={[
          styles.dailyDiaperContainer,
          { backgroundColor: `${theme.cardBackground}80` },
        ]}
      >
        <Text style={[styles.dailyDiaperTitle, { color: theme.text }]}>
          Daily Diaper Summary
        </Text>

        {dailySummaryData.map((day, index) => {
          // Calculate the maximum value for proper scaling of bars
          const maxValue = Math.max(day.wet, day.dirty, day.both, 1);

          return (
            <View
              key={`diaper-day-${index}`}
              style={[
                styles.dailyDiaperRow,
                { borderBottomColor: `${theme.text}10` },
                index === dailySummaryData.length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {day.displayDate}
                </Text>
              </View>

              <View style={styles.totalColumn}>
                <Text style={[styles.totalText, { color: theme.text }]}>
                  {day.total} changes
                </Text>
              </View>

              <View style={styles.typesColumn}>
                {/* Wet diapers */}
                <View style={styles.typeRow}>
                  <View
                    style={[
                      styles.typeIndicator,
                      { backgroundColor: "royalblue" },
                    ]}
                  />
                  <Text
                    style={[styles.typeText, { color: theme.textSecondary }]}
                  >
                    Wet:
                  </Text>
                  <View style={styles.typeBarContainer}>
                    <View
                      style={[
                        styles.typeBarFill,
                        {
                          width: `${(day.wet / maxValue) * 100}%`,
                          backgroundColor: "royalblue",
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.typeCount, { color: theme.text }]}>
                    {day.wet}
                  </Text>
                </View>

                {/* Dirty diapers */}
                <View style={styles.typeRow}>
                  <View
                    style={[styles.typeIndicator, { backgroundColor: "brown" }]}
                  />
                  <Text
                    style={[styles.typeText, { color: theme.textSecondary }]}
                  >
                    Dirty:
                  </Text>
                  <View style={styles.typeBarContainer}>
                    <View
                      style={[
                        styles.typeBarFill,
                        {
                          width: `${(day.dirty / maxValue) * 100}%`,
                          backgroundColor: "brown",
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.typeCount, { color: theme.text }]}>
                    {day.dirty}
                  </Text>
                </View>

                {/* Both diapers */}
                <View style={styles.typeRow}>
                  <View
                    style={[
                      styles.typeIndicator,
                      { backgroundColor: "purple" },
                    ]}
                  />
                  <Text
                    style={[styles.typeText, { color: theme.textSecondary }]}
                  >
                    Both:
                  </Text>
                  <View style={styles.typeBarContainer}>
                    <View
                      style={[
                        styles.typeBarFill,
                        {
                          width: `${(day.both / maxValue) * 100}%`,
                          backgroundColor: "purple",
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.typeCount, { color: theme.text }]}>
                    {day.both}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [dailySummaryData, theme]);

  return (
    <>
      {renderDiaperChart()}
      {renderSummaryStats()}
      {renderDailySummary()}
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
    paddingHorizontal: 20,
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
    marginVertical: 10,
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
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  typeBreakdown: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  breakdownLabel: {
    fontSize: 13,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  // Daily diaper summary styles
  dailyDiaperContainer: {
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
    padding: 16,
  },
  dailyDiaperTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dailyDiaperRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dayColumn: {
    marginBottom: 8,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
  },
  totalColumn: {
    marginBottom: 8,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "500",
  },
  typesColumn: {
    marginTop: 4,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  typeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    width: 40,
  },
  typeBarContainer: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  typeBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  typeCount: {
    fontSize: 12,
    width: 20,
    textAlign: "right",
  },
});

export default DiaperChartComponent;
