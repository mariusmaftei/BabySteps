"use client";

import { useCallback, useMemo, useState } from "react";
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

  // Process data for pie chart
  const getPieChartData = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return [
        {
          name: "No Data",
          population: 1,
          color: "#CCCCCC",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        },
      ];
    }

    // For monthly view, filter by selected month
    let filteredData = rawData;
    if (timePeriod === "month") {
      filteredData = rawData.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === selectedMonth &&
          recordDate.getFullYear() === selectedYear
        );
      });
    } else if (timePeriod === "week") {
      // For weekly view, filter by current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      filteredData = rawData.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      });
    }

    // Count diaper types
    let wetCount = 0;
    let dirtyCount = 0;
    let bothCount = 0;

    filteredData.forEach((record) => {
      if (record.type === "wet") wetCount++;
      else if (record.type === "dirty") dirtyCount++;
      else if (record.type === "both") bothCount++;
    });

    const data = [];

    if (wetCount > 0) {
      data.push({
        name: "Wet",
        population: wetCount,
        color: "#5A87FF",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    if (dirtyCount > 0) {
      data.push({
        name: "Dirty",
        population: dirtyCount,
        color: "#FF9500",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    if (bothCount > 0) {
      data.push({
        name: "Both",
        population: bothCount,
        color: "#FF2D55",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    // If no data, add a placeholder
    if (data.length === 0) {
      data.push({
        name: "No Data",
        population: 1,
        color: "#CCCCCC",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    return data;
  }, [rawData, theme, timePeriod, selectedMonth, selectedYear]);

  // Process weekly data
  const weeklyData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // Get current date
    const today = new Date();

    // Find the previous Sunday (start of week)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Find the next Saturday (end of week)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Create an array for each day of the week
    const weekDays = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      weekDays.push({
        date: day,
        label: dayNames[i],
        wet: 0,
        dirty: 0,
        both: 0,
        total: 0,
      });
    }

    // Fill in the data
    rawData.forEach((record) => {
      const recordDate = new Date(record.date);

      // Check if the record is within the current week
      if (recordDate >= startOfWeek && recordDate <= endOfWeek) {
        const dayIndex = recordDate.getDay(); // 0 for Sunday, 1 for Monday, etc.

        if (record.type === "wet") weekDays[dayIndex].wet++;
        else if (record.type === "dirty") weekDays[dayIndex].dirty++;
        else if (record.type === "both") weekDays[dayIndex].both++;

        weekDays[dayIndex].total++;
      }
    });

    return weekDays;
  }, [rawData]);

  // Process monthly data
  const monthlyData = useMemo(() => {
    if (!rawData || rawData.length === 0 || timePeriod !== "month") return [];

    // Create an array for each day of the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const monthDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(selectedYear, selectedMonth, i);

      monthDays.push({
        date: day,
        label: `${i}`,
        wet: 0,
        dirty: 0,
        both: 0,
        total: 0,
      });
    }

    // Fill in the data
    rawData.forEach((record) => {
      const recordDate = new Date(record.date);

      // Check if the record is within the selected month
      if (
        recordDate.getMonth() === selectedMonth &&
        recordDate.getFullYear() === selectedYear
      ) {
        const dayIndex = recordDate.getDate() - 1; // Array is 0-indexed, days are 1-indexed

        if (dayIndex >= 0 && dayIndex < monthDays.length) {
          if (record.type === "wet") monthDays[dayIndex].wet++;
          else if (record.type === "dirty") monthDays[dayIndex].dirty++;
          else if (record.type === "both") monthDays[dayIndex].both++;

          monthDays[dayIndex].total++;
        }
      }
    });

    return monthDays;
  }, [rawData, selectedMonth, selectedYear, timePeriod]);

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

    return (
      <View style={styles.customChartContainer}>
        {timePeriod === "month" && renderMonthSelector()}

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#5A87FF" }]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}>Wet</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9500" }]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}>
              Dirty
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF2D55" }]}
            />
            <Text style={[styles.legendText, { color: theme.text }]}>Both</Text>
          </View>
        </View>

        {/* Custom centered chart container with adjustment */}
        <View style={styles.chartOuterContainer}>
          <View style={[styles.chartInnerContainer, { marginLeft: 140 }]}>
            <PieChart
              data={getPieChartData}
              width={300} // Fixed width
              height={180}
              chartConfig={{
                backgroundColor: theme.cardBackground,
                backgroundGradientFrom: theme.cardBackground,
                backgroundGradientTo: theme.cardBackground,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => theme.text,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend={false}
            />
          </View>
        </View>
      </View>
    );
  }, [
    isLoading,
    error,
    getPieChartData,
    theme,
    categoryColor,
    timePeriod,
    selectedMonth,
    selectedYear,
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
              style={[styles.summaryStatIcon, { backgroundColor: "#5A87FF" }]}
            >
              <Ionicons name="water" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {counts.wet}
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Wet
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#FF9500" }]}
            >
              <FontAwesome5 name="poo" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {counts.dirty}
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Dirty
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <View
              style={[styles.summaryStatIcon, { backgroundColor: "#FF2D55" }]}
            >
              <View style={styles.combinedIcons}>
                <Ionicons name="water" size={16} color="#FFFFFF" />
                <FontAwesome5
                  name="poo"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
            <Text style={[styles.summaryStatValue, { color: theme.text }]}>
              {counts.both}
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
                  width: `${(counts.wet / counts.total) * 100}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#FF9500",
                  width: `${(counts.dirty / counts.total) * 100}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: "#FF2D55",
                  width: `${(counts.both / counts.total) * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.distributionLabelsContainer}>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Wet {Math.round((counts.wet / counts.total) * 100)}%
            </Text>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Dirty {Math.round((counts.dirty / counts.total) * 100)}%
            </Text>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Both {Math.round((counts.both / counts.total) * 100)}%
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
          {dailyAverage >= 6
            ? "Your baby has a healthy number of diaper changes. This indicates good hydration and digestion."
            : dailyAverage >= 4
            ? "Your baby's diaper changes are within normal range. Monitor for any changes in pattern."
            : "Your baby may have fewer diaper changes than expected. Ensure proper hydration and consult your pediatrician if concerned."}
        </Text>
      </View>
    );
  }, [rawData, timePeriod, theme]);

  // Render daily diaper summary - EXACTLY matching the feeding chart UI
  const renderDailySummary = useCallback(() => {
    const data = timePeriod === "week" ? weeklyData : monthlyData;
    if (!data || data.length === 0) return null;

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

        <View style={styles.diaperLegendContainer}>
          <View style={styles.diaperLegendItem}>
            <Ionicons name="water" size={24} color="#5A87FF" />
            <Text style={[styles.diaperLegendText, { color: theme.text }]}>
              Wet
            </Text>
          </View>
          <View style={styles.diaperLegendItem}>
            <FontAwesome5 name="poo" size={24} color="#FF9500" />
            <Text style={[styles.diaperLegendText, { color: theme.text }]}>
              Dirty
            </Text>
          </View>
          <View style={styles.diaperLegendItem}>
            <View style={styles.combinedIcons}>
              <Ionicons name="water" size={16} color="#5A87FF" />
              <FontAwesome5
                name="poo"
                size={16}
                color="#FF9500"
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text style={[styles.diaperLegendText, { color: theme.text }]}>
              Both
            </Text>
          </View>
        </View>

        {data.map((day, i) => {
          return (
            <View
              key={`diaper-day-${i}`}
              style={[
                styles.dailyDiaperRow,
                { borderBottomColor: `${theme.text}10` },
                i === data.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {day.label}
                </Text>
              </View>

              <View style={styles.diaperTypeColumn}>
                <View
                  style={[
                    styles.diaperTypeIndicator,
                    { backgroundColor: "#5A87FF" },
                  ]}
                />
                <Text style={[styles.diaperTypeText, { color: theme.text }]}>
                  {day.wet}
                </Text>
              </View>

              <View style={styles.diaperTypeColumn}>
                <View
                  style={[
                    styles.diaperTypeIndicator,
                    { backgroundColor: "#FF9500" },
                  ]}
                />
                <Text style={[styles.diaperTypeText, { color: theme.text }]}>
                  {day.dirty}
                </Text>
              </View>

              <View style={styles.diaperTypeColumn}>
                <View
                  style={[
                    styles.diaperTypeIndicator,
                    { backgroundColor: "#FF2D55" },
                  ]}
                />
                <Text style={[styles.diaperTypeText, { color: theme.text }]}>
                  {day.both}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [weeklyData, monthlyData, theme, timePeriod]);

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
  // Custom chart styles
  customChartContainer: {
    marginVertical: 20,
    alignItems: "center",
    width: "100%",
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
  // Chart containers with fixed centering
  chartOuterContainer: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  chartInnerContainer: {
    width: 300, // Fixed width to match chart
    height: 180,
    alignItems: "center",
    justifyContent: "center",
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
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Daily diaper summary styles - EXACTLY matching feeding chart
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
  diaperLegendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  diaperLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 8,
  },
  diaperLegendText: {
    fontSize: 12,
    marginLeft: 6,
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
    width: 50,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  diaperTypeColumn: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  diaperTypeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  diaperTypeText: {
    fontSize: 12,
  },
  combinedIcons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DiaperChartComponent;
