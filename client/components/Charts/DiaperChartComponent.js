"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
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

// Helper function to extract full date from timestamp
const getDateFromTimestamp = (timestamp) => {
  if (!timestamp) return null;

  try {
    let dateStr;

    // Format: "2025-05-19T08:24:11.000Z" (ISO format)
    if (timestamp.includes("T")) {
      dateStr = timestamp.split("T")[0];
    }
    // Format: "2025-05-19 08:24:11" (database format)
    else if (timestamp.includes(" ")) {
      dateStr = timestamp.split(" ")[0];
    }
    // Format: "2025-05-19" (date only)
    else if (timestamp.includes("-")) {
      dateStr = timestamp;
    }

    if (dateStr) {
      return new Date(dateStr);
    }
    return null;
  } catch (error) {
    console.error("Error parsing timestamp for date:", error);
    return null;
  }
};

// Helper function to extract month and year from timestamp
const getMonthYearFromTimestamp = (timestamp) => {
  if (!timestamp) return null;

  try {
    let month, year;

    // Format: "2025-05-19T08:24:11.000Z" (ISO format)
    if (timestamp.includes("T")) {
      const parts = timestamp.split("T")[0].split("-");
      year = Number.parseInt(parts[0], 10);
      month = Number.parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    }
    // Format: "2025-05-19 08:24:11" (database format)
    else if (timestamp.includes(" ")) {
      const parts = timestamp.split(" ")[0].split("-");
      year = Number.parseInt(parts[0], 10);
      month = Number.parseInt(parts[1], 10) - 1;
    }
    // Format: "2025-05-19" (date only)
    else if (timestamp.includes("-")) {
      const parts = timestamp.split("-");
      year = Number.parseInt(parts[0], 10);
      month = Number.parseInt(parts[1], 10) - 1;
    }

    return { month, year };
  } catch (error) {
    console.error("Error parsing timestamp for month/year:", error);
    return null;
  }
};

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

  // Update local state when props change
  useEffect(() => {
    if (currentMonth !== undefined && currentMonth !== selectedMonth) {
      setSelectedMonth(currentMonth);
    }
    if (currentYear !== undefined && currentYear !== selectedYear) {
      setSelectedYear(currentYear);
    }
  }, [currentMonth, currentYear]);

  // Debug logging for month changes
  useEffect(() => {
    console.log(
      `DiaperChartComponent: Month changed to ${
        selectedMonth + 1
      }/${selectedYear}`
    );
    console.log(`Raw data count: ${rawData ? rawData.length : 0}`);
    console.log(`Time period: ${timePeriod}`);

    if (rawData && rawData.length > 0) {
      console.log(
        "First record date:",
        rawData[0].date || rawData[0].timestamp
      );
    }
  }, [selectedMonth, selectedYear, rawData, timePeriod]);

  // Filter raw data by selected month and year
  const filteredData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];

    return rawData.filter((record) => {
      // Get month and year from the record's date or timestamp
      const dateInfo = getMonthYearFromTimestamp(
        record.date || record.timestamp
      );

      if (!dateInfo) return false;

      // Only include records from the selected month and year
      return dateInfo.month === selectedMonth && dateInfo.year === selectedYear;
    });
  }, [rawData, selectedMonth, selectedYear]);

  // Process filtered data to get daily diaper counts
  const dailyDiapers = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    // Create a map to store diaper data by day
    const diaperByDay = new Map();

    // Process each diaper record
    filteredData.forEach((record) => {
      // Extract the day from the timestamp or date
      let day = null;
      let date = null;

      if (record.timestamp) {
        // Try to extract from timestamp
        day = getDayFromTimestamp(record.timestamp);
        date = getDateFromTimestamp(record.timestamp);
      } else if (record.date) {
        // Try to extract from date
        day = getDayFromTimestamp(record.date);
        date = getDateFromTimestamp(record.date);
      }

      if (day && date) {
        if (!diaperByDay.has(day)) {
          // Get the weekday abbreviation
          const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const weekday = weekdays[date.getDay()];

          diaperByDay.set(day, {
            day,
            weekday,
            date,
            wet: 0,
            dirty: 0,
            both: 0,
            total: 0,
          });
        }

        // Add this record to the day's data
        const dayData = diaperByDay.get(day);
        dayData.total++;

        // Update the counts based on record type
        if (record.type === "wet") dayData.wet++;
        else if (record.type === "dirty") dayData.dirty++;
        else if (record.type === "both") dayData.both++;
      }
    });

    // Convert the map to an array and sort by day
    return Array.from(diaperByDay.values()).sort(
      (a, b) => Number(a.day) - Number(b.day)
    );
  }, [filteredData]);

  // Calculate summary statistics from filtered data
  const summaryStats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalWet: 0,
        totalDirty: 0,
        totalBoth: 0,
        totalDiapers: 0,
        wetPercentage: 0,
        dirtyPercentage: 0,
        bothPercentage: 0,
      };
    }

    // Count diaper types
    let totalWet = 0;
    let totalDirty = 0;
    let totalBoth = 0;

    filteredData.forEach((record) => {
      if (record.type === "wet") totalWet++;
      else if (record.type === "dirty") totalDirty++;
      else if (record.type === "both") totalBoth++;
    });

    const totalDiapers = totalWet + totalDirty + totalBoth;

    // Calculate percentages
    const wetPercentage =
      totalDiapers > 0 ? Math.round((totalWet / totalDiapers) * 100) : 0;
    const dirtyPercentage =
      totalDiapers > 0 ? Math.round((totalDirty / totalDiapers) * 100) : 0;
    const bothPercentage =
      totalDiapers > 0 ? Math.round((totalBoth / totalDiapers) * 100) : 0;

    return {
      totalWet,
      totalDirty,
      totalBoth,
      totalDiapers,
      wetPercentage,
      dirtyPercentage,
      bothPercentage,
    };
  }, [filteredData]);

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
      console.log(`Navigating to previous month: ${newMonth + 1}/${newYear}`);
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
      console.log(`Navigating to next month: ${newMonth + 1}/${newYear}`);
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

  // Update the renderDailySummary function to only show days with data
  const renderDailySummary = useCallback(() => {
    // Filter to only include days with at least one diaper change
    const daysWithData = dailyDiapers.filter(
      (day) => day.wet > 0 || day.dirty > 0 || day.both > 0
    );

    // If no days with data, show a message
    if (daysWithData.length === 0) {
      return (
        <View
          style={[
            styles.dailyDiaperContainer,
            { backgroundColor: `${theme.cardBackground}80` },
          ]}
        >
          <Text style={[styles.dailyDiaperTitle, { color: theme.text }]}>
            {timePeriod === "week" ? "Weekly" : "Monthly"} Diaper Summary
          </Text>
          <View style={styles.noDataContainer}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={theme.textSecondary}
            />
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No diaper data recorded for{" "}
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
          styles.dailyDiaperContainer,
          { backgroundColor: `${theme.cardBackground}80` },
        ]}
      >
        <Text style={[styles.dailyDiaperTitle, { color: theme.text }]}>
          {timePeriod === "week" ? "Weekly" : "Monthly"} Diaper Summary
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
          <View style={styles.diaperTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Wet
            </Text>
          </View>
          <View style={styles.diaperTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Dirty
            </Text>
          </View>
          <View style={styles.diaperTypeColumn}>
            <Text
              style={[
                styles.legendText,
                { color: theme.text, fontWeight: "600" },
              ]}
            >
              Both
            </Text>
          </View>
        </View>

        {/* Data rows - only for days with data */}
        {daysWithData.map((day, i) => (
          <View
            key={`diaper-day-${i}`}
            style={[
              styles.dailyDiaperRow,
              { borderBottomColor: `${theme.text}10` },
              i === daysWithData.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.dayColumn}>
              <Text style={[styles.dayText, { color: theme.text }]}>
                {timePeriod === "week" ? day.weekday : day.day}
              </Text>
            </View>

            <View style={styles.diaperTypeColumn}>
              {day.wet > 0 ? (
                <View style={styles.diaperCountContainer}>
                  <Ionicons
                    name="water"
                    size={16}
                    color="#5A87FF"
                    style={styles.diaperIcon}
                  />
                  <Text style={[styles.diaperTypeText, { color: theme.text }]}>
                    {day.wet}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.diaperTypeText, { color: theme.textTertiary }]}
                >
                  0
                </Text>
              )}
            </View>

            <View style={styles.diaperTypeColumn}>
              {day.dirty > 0 ? (
                <View style={styles.diaperCountContainer}>
                  <FontAwesome5
                    name="poo"
                    size={16}
                    color="#FF9500"
                    style={styles.diaperIcon}
                  />
                  <Text style={[styles.diaperTypeText, { color: theme.text }]}>
                    {day.dirty}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.diaperTypeText, { color: theme.textTertiary }]}
                >
                  0
                </Text>
              )}
            </View>

            <View style={styles.diaperTypeColumn}>
              {day.both > 0 ? (
                <View style={styles.diaperCountContainer}>
                  <View style={styles.combinedIcons}>
                    <Ionicons name="water" size={14} color="#5A87FF" />
                    <FontAwesome5
                      name="poo"
                      size={14}
                      color="#FF9500"
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                  <Text style={[styles.diaperTypeText, { color: theme.text }]}>
                    {day.both}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.diaperTypeText, { color: theme.textTertiary }]}
                >
                  0
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  }, [dailyDiapers, theme, timePeriod, selectedMonth, selectedYear]);

  // Extract pie chart rendering to a separate function
  const renderPieChart = useCallback(() => {
    // Check if there's any data
    const hasData = summaryStats.totalDiapers > 0;

    if (!hasData) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No diaper data recorded for{" "}
            {timePeriod === "month"
              ? getMonthName(selectedMonth) + " " + selectedYear
              : "this " + timePeriod}
            .
          </Text>
        </View>
      );
    }

    // Create pie chart data with transparent legend text to hide it
    const pieChartData = [
      {
        name: "Wet",
        value: summaryStats.totalWet,
        color: "#5A87FF",
        legendFontColor: "transparent", // Hide legend text
        legendFontSize: 0,
      },
      {
        name: "Dirty",
        value: summaryStats.totalDirty,
        color: "#FF9500",
        legendFontColor: "transparent", // Hide legend text
        legendFontSize: 0,
      },
      {
        name: "Both",
        value: summaryStats.totalBoth,
        color: "#bacc1d",
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
          center={[screenWidth / 4, 0]} // Center the chart
          absolute
          hasLegend={false} // Disable the legend completely
        />
      </View>
    );
  }, [summaryStats, theme, timePeriod, selectedMonth, selectedYear]);

  // Update the renderDiaperChart function to always show month selector in month view
  const renderDiaperChart = useCallback(() => {
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
                Loading diaper data...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color={categoryColor} />
              <Text style={[styles.errorText, { color: theme.text }]}>
                {error}
              </Text>
            </View>
          ) : filteredData.length === 0 ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.text }]}>
                No diaper data recorded for {getMonthName(selectedMonth)}{" "}
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
        <View style={styles.customChartContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={categoryColor} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading diaper data...
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

    // Ensure we have data
    if (filteredData.length === 0) {
      return (
        <View style={styles.customChartContainer}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.text }]}>
              No diaper data recorded for this week.
            </Text>
          </View>
        </View>
      );
    }

    return <View style={styles.customChartContainer}>{renderPieChart()}</View>;
  }, [
    isLoading,
    error,
    filteredData,
    theme,
    categoryColor,
    timePeriod,
    selectedMonth,
    selectedYear,
    renderPieChart,
  ]);

  const renderDiaperSummary = useCallback(() => {
    // Check if there's any diaper data
    const hasData = summaryStats.totalDiapers > 0;

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
            Diaper Summary
          </Text>
        </View>

        <View style={styles.summaryStatsContainer}>
          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#5A87FF20" }]}
            >
              <Ionicons name="water" size={20} color="#5A87FF" />
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {summaryStats.totalWet}
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Wet
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#FF950020" }]}
            >
              <FontAwesome5 name="poo" size={20} color="#FF9500" />
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {summaryStats.totalDirty}
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Dirty
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#FF2D5520" }]}
            >
              <View style={styles.combinedIcons}>
                <Ionicons name="water" size={16} color="#5A87FF" />
                <FontAwesome5
                  name="poo"
                  size={16}
                  color="#FF9500"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {summaryStats.totalBoth}
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Both
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
            Diaper Distribution
          </Text>

          <View style={styles.distributionBarContainer}>
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#5A87FF",
                  width: `${summaryStats.wetPercentage}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#FF9500",
                  width: `${summaryStats.dirtyPercentage}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#bacc1d",
                  width: `${summaryStats.bothPercentage}%`,
                },
              ]}
            />
          </View>

          <View style={styles.distributionLabelsContainer}>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Wet {summaryStats.wetPercentage}%
            </Text>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Dirty {summaryStats.dirtyPercentage}%
            </Text>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Both {summaryStats.bothPercentage}%
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
          Your baby's diaper pattern is normal. The frequency and consistency of
          dirty diapers indicate healthy digestion. Continue monitoring for any
          significant changes.
        </Text>
      </View>
    );
  }, [summaryStats, theme]);

  return (
    <>
      {renderDiaperChart()}
      {renderDiaperSummary()}
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
    height: 180,
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
  dailyDiaperContainer: {
    marginTop: 10, // Reduced from 20 to 10
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dayColumn: {
    width: 70,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  diaperTypeColumn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: 70,
  },
  diaperCountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  diaperIcon: {
    marginRight: 4,
  },
  diaperTypeText: {
    fontSize: 12,
  },
  // Custom chart styles
  customChartContainer: {
    marginVertical: 10, // Reduced from 20 to 10
    height: 220, // Reduced from 240 to 220 since we removed the legend
    width: "100%",
  },
  // Month selector styles
  monthSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10, // Increased from 5 to 10 to add more space below month selector
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
    marginTop: 10, // Reduced from 20 to 10
    marginBottom: 0, // Added to ensure consistent spacing
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
  // Combined icons style
  combinedIcons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DiaperChartComponent;
