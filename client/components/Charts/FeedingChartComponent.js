import { useCallback, useState, useEffect, useRef } from "react";
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
  onFetchMonthlyData,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(
    currentMonth || new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    currentYear || new Date().getFullYear()
  );

  const [stableData, setStableData] = useState(null);
  const dataInitialized = useRef(false);

  const breastColor = "#FF9500";
  const bottleColor = "#5A87FF";
  const solidColor = "#4CD964";

  const BREAST_TO_ML_CONVERSION = 20;

  useEffect(() => {
    console.log("FeedingChartComponent mounted, initializing data");
    if (timePeriod === "month" && onFetchMonthlyData) {
      onFetchMonthlyData(selectedYear, selectedMonth);
    }
  }, []);

  useEffect(() => {
    if (
      processedData &&
      processedData.dailyFeedings &&
      processedData.dailyFeedings.length > 0
    ) {
      console.log("Updating stable data with new processed data");
      setStableData(processedData);
      dataInitialized.current = true;
    }
  }, [processedData]);

  useEffect(() => {
    console.log("=== PROCESSED DATA CHANGED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Is loading:", isLoading);
    console.log("Processed data:", processedData);
    console.log("Stable data:", stableData);
    console.log("Current timePeriod:", timePeriod);
    console.log("Selected month/year:", selectedMonth, selectedYear);

    if (processedData && processedData.dailyFeedings) {
      console.log("Daily feedings count:", processedData.dailyFeedings.length);

      if (processedData.dailyFeedings.length > 0) {
        const firstDay = processedData.dailyFeedings[0];
        console.log("First day data:", firstDay);

        if (firstDay.breastFeedings) {
          console.log("Using new aggregated format");
          console.log("Breast minutes:", firstDay.breastFeedings.totalMinutes);
          console.log("Bottle ml:", firstDay.bottleFeedings.totalMl);
          console.log("Solid grams:", firstDay.solidFeedings.totalGrams);
        } else {
          console.log("Using old format");
          console.log("Breast duration:", firstDay.breastDuration);
          console.log("Bottle amount:", firstDay.bottleAmount);
          console.log("Solid amount:", firstDay.solidAmount);
        }
      }
    } else {
      console.log("No daily feedings data available");
    }
  }, [
    processedData,
    isLoading,
    stableData,
    timePeriod,
    selectedMonth,
    selectedYear,
  ]);

  const handlePreviousMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear = newYear - 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);

    if (onFetchMonthlyData) {
      console.log(`Fetching data for ${newYear}-${newMonth + 1} directly`);
      onFetchMonthlyData(newYear, newMonth);
    } else if (onMonthChange) {
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

    if (onFetchMonthlyData) {
      console.log(`Fetching data for ${newYear}-${newMonth + 1} directly`);
      onFetchMonthlyData(newYear, newMonth);
    } else if (onMonthChange) {
      const startDate = new Date(newYear, newMonth, 1);
      const endDate = new Date(newYear, newMonth + 1, 0);
      onMonthChange(startDate, endDate);
    }
  };

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

  const getActiveData = () => {
    if (isLoading && stableData) {
      return stableData;
    }

    if (
      processedData &&
      processedData.dailyFeedings &&
      processedData.dailyFeedings.length > 0
    ) {
      return processedData;
    }

    if (stableData) {
      return stableData;
    }

    return null;
  };

  const calculateTotalsAndPercentages = (dailyData) => {
    let totalBreastMinutes = 0;
    let totalBottle = 0;
    let totalSolid = 0;

    dailyData.forEach((day) => {
      let breastValue = 0;
      let bottleValue = 0;
      let solidValue = 0;

      if (day.breastFeedings) {
        breastValue = day.breastFeedings.totalMinutes || 0;
        bottleValue = day.bottleFeedings.totalMl || 0;
        solidValue = day.solidFeedings.totalGrams || 0;
      } else {
        breastValue = day.breastDuration || 0;
        bottleValue = day.bottleAmount || 0;
        solidValue = day.solidAmount || 0;
      }

      totalBreastMinutes += breastValue;
      totalBottle += bottleValue;
      totalSolid += solidValue;
    });

    const totalBreastMl = totalBreastMinutes * BREAST_TO_ML_CONVERSION;

    const totalForChart = totalBreastMl + totalBottle + totalSolid;

    const breastPercentage =
      totalForChart > 0 ? Math.round((totalBreastMl / totalForChart) * 100) : 0;
    const bottlePercentage =
      totalForChart > 0 ? Math.round((totalBottle / totalForChart) * 100) : 0;
    const solidPercentage =
      totalForChart > 0 ? Math.round((totalSolid / totalForChart) * 100) : 0;

    console.log(
      `Calculated totals: Breast=${totalBreastMinutes}min (${totalBreastMl}ml), Bottle=${totalBottle}ml, Solid=${totalSolid}g`
    );
    console.log(
      `Calculated percentages: Breast=${breastPercentage}%, Bottle=${bottlePercentage}%, Solid=${solidPercentage}%`
    );

    return {
      totalBreastMinutes,
      totalBreastMl,
      totalBottle,
      totalSolid,
      totalForChart,
      breastPercentage,
      bottlePercentage,
      solidPercentage,
    };
  };

  const renderChart = useCallback(() => {
    const activeData = getActiveData();

    if (
      !activeData ||
      !activeData.dailyFeedings ||
      activeData.dailyFeedings.length === 0
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

    const dataToUse =
      activeData.rawData && activeData.rawData.length > 0
        ? activeData.rawData
        : activeData.dailyFeedings;

    const totals = calculateTotalsAndPercentages(dataToUse);

    if (totals.totalForChart === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            No feeding data to display for{" "}
            {timePeriod === "month"
              ? getMonthName(selectedMonth) + " " + selectedYear
              : "this " + timePeriod}
            .
          </Text>
        </View>
      );
    }

    const pieData = [];

    if (totals.totalBreastMl > 0) {
      pieData.push({
        name: "Breast",
        value: totals.breastPercentage,
        color: breastColor,
        legendFontColor: "transparent",
        legendFontSize: 0,
      });
    }

    if (totals.totalBottle > 0) {
      pieData.push({
        name: "Bottle",
        value: totals.bottlePercentage,
        color: bottleColor,
        legendFontColor: "transparent",
        legendFontSize: 0,
      });
    }

    if (totals.totalSolid > 0) {
      pieData.push({
        name: "Solid",
        value: totals.solidPercentage,
        color: solidColor,
        legendFontColor: "transparent",
        legendFontSize: 0,
      });
    }

    if (pieData.length > 0) {
      return (
        <View style={styles.chartWrapper}>
          <PieChart
            data={pieData}
            width={screenWidth}
            height={200}
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

    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          No feeding data to display for{" "}
          {timePeriod === "month"
            ? getMonthName(selectedMonth) + " " + selectedYear
            : "this " + timePeriod}
          .
        </Text>
      </View>
    );
  }, [
    processedData,
    stableData,
    isLoading,
    theme,
    categoryColor,
    timePeriod,
    selectedMonth,
    selectedYear,
    breastColor,
    bottleColor,
    solidColor,
  ]);

  const renderDailySummary = useCallback(() => {
    const activeData = getActiveData();

    if (
      !activeData ||
      !activeData.dailyFeedings ||
      activeData.dailyFeedings.length === 0
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

    const dataToUse =
      activeData.rawData && activeData.rawData.length > 0
        ? activeData.rawData
        : activeData.dailyFeedings;

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

        {dataToUse.map((day, i) => {
          const dayDisplay =
            timePeriod === "week" && day.date
              ? getDayOfWeekAbbr(day.date)
              : day.day;

          let breastValue = 0;
          let bottleValue = 0;
          let solidValue = 0;

          if (day.breastFeedings && day.bottleFeedings && day.solidFeedings) {
            breastValue = day.breastFeedings.totalMinutes || 0;
            bottleValue = day.bottleFeedings.totalMl || 0;
            solidValue = day.solidFeedings.totalGrams || 0;
          } else {
            breastValue = day.breastDuration || 0;
            bottleValue = day.bottleAmount || 0;
            solidValue = day.solidAmount || 0;
          }

          console.log(
            `Day ${i} (${dayDisplay}): breast=${breastValue}, bottle=${bottleValue}, solid=${solidValue}`
          );

          return (
            <View
              key={`feeding-day-${i}`}
              style={[
                styles.dailyFeedingRow,
                { borderBottomColor: `${theme.text}10` },
                i === dataToUse.length - 1 && {
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
                  {breastValue} min
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
                  {bottleValue} ml
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
                  {solidValue} g
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [
    processedData,
    stableData,
    theme,
    timePeriod,
    selectedMonth,
    selectedYear,
    breastColor,
    bottleColor,
    solidColor,
  ]);

  const renderFeedingSummary = useCallback(() => {
    const activeData = getActiveData();
    if (!activeData) return null;

    const dataToUse =
      activeData.rawData && activeData.rawData.length > 0
        ? activeData.rawData
        : activeData.dailyFeedings;

    if (!dataToUse || dataToUse.length === 0) return null;

    const totals = calculateTotalsAndPercentages(dataToUse);

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
              {totals.totalBreastMinutes} min
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Total Breast
            </Text>
            <Text
              style={[styles.summaryConversion, { color: theme.textSecondary }]}
            >
              (~{totals.totalBreastMl} ml)
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
              {totals.totalBottle} ml
            </Text>
            <Text
              style={[styles.summaryStatLabel, { color: theme.textSecondary }]}
            >
              Total Bottle
            </Text>
          </View>

          {totals.totalSolid > 0 && (
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
                {totals.totalSolid} g
              </Text>
              <Text
                style={[
                  styles.summaryStatLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Total Solid
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
                  width: `${totals.breastPercentage}%`,
                },
              ]}
            />
            <View
              style={[
                styles.distributionBarSegment,
                {
                  backgroundColor: bottleColor,
                  width: `${totals.bottlePercentage}%`,
                },
              ]}
            />
            {totals.solidPercentage > 0 && (
              <View
                style={[
                  styles.distributionBarSegment,
                  {
                    backgroundColor: solidColor,
                    width: `${totals.solidPercentage}%`,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.distributionLabelsContainer}>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Breast {totals.breastPercentage}%
            </Text>
            <Text
              style={[styles.distributionLabel, { color: theme.textSecondary }]}
            >
              Bottle {totals.bottlePercentage}%
            </Text>
            {totals.solidPercentage > 0 && (
              <Text
                style={[
                  styles.distributionLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Solid {totals.solidPercentage}%
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
          feeding types. Chart percentages calculated using 1 min breast = 20 ml
          conversion.
        </Text>
      </View>
    );
  }, [processedData, stableData, theme, breastColor, bottleColor, solidColor]);

  const renderFeedingChart = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.text} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading feeding data...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            Error loading feeding data: {error}
          </Text>
        </View>
      );
    }

    return (
      <View>
        {renderMonthSelector()}
        {renderChart()}
      </View>
    );
  }, [isLoading, error, theme, renderChart, renderMonthSelector]);

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
    height: 200,
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
  // NEW: Style for conversion text
  summaryConversion: {
    fontSize: 10,
    fontStyle: "italic",
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
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
});

export default FeedingChartComponent;
