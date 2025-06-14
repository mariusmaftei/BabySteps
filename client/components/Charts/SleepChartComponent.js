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
  processedData,
  rawSleepData,
  theme,
  categoryColor,
  timePeriod,
  getChartConfig,
  onFetchMonthlyData,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

  const extractDateFromDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    if (dateTimeString.includes(" ")) {
      return dateTimeString.split(" ")[0];
    }
    return dateTimeString;
  };

  const navigateMonth = async (direction) => {
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

    if (onFetchMonthlyData) {
      console.log(
        ` Fetching data for ${monthNames[newMonth]} ${newYear} (month: ${
          newMonth + 1
        })`
      );
      await onFetchMonthlyData(newYear, newMonth + 1);
    }
  };

  useEffect(() => {
    if (timePeriod === "month") {
      const now = new Date();
      const initMonth = now.getMonth();
      const initYear = now.getFullYear();

      if (currentMonth !== initMonth || currentYear !== initYear) {
        setCurrentMonth(initMonth);
        setCurrentYear(initYear);

        if (onFetchMonthlyData) {
          console.log(` Initial fetch for ${initYear}-${initMonth + 1}`);
          onFetchMonthlyData(initYear, initMonth + 1);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (rawSleepData && rawSleepData.length > 0) {
      console.log(`Raw sleep data updated:`, rawSleepData);
      console.log(
        ` Current month/year: ${monthNames[currentMonth]} ${currentYear}`
      );
    }
  }, [rawSleepData, currentMonth, currentYear, monthNames]);

  const processRawSleepData = useCallback(() => {
    console.log(
      " Processing raw sleep data for",
      `${monthNames[currentMonth]} ${currentYear}:`,
      rawSleepData
    );

    if (
      !rawSleepData ||
      !Array.isArray(rawSleepData) ||
      rawSleepData.length === 0
    ) {
      if (timePeriod === "month") {
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate();
        const labels = [];
        for (let i = 1; i <= daysInMonth; i++) {
          labels.push(i.toString());
        }

        return {
          labels,
          dates: [],
          napHours: new Array(labels.length).fill(0),
          nightHours: new Array(labels.length).fill(0),
          totalSleepHours: new Array(labels.length).fill(0),
          sleepProgress: new Array(labels.length).fill(0),
          averageTotalSleepHours: "0.0",
          averageSleepProgress: 0,
          trendText: "No Data",
        };
      }
      return null;
    }

    rawSleepData.forEach((record, index) => {
      console.log(`  Record ${index}:`, {
        id: record.id,
        date: record.date,
        napHours: record.napHours,
        nightHours: record.nightHours,
        totalHours: record.totalHours,
      });
    });

    const now = new Date();
    let startDate,
      endDate,
      labels = [];

    if (timePeriod === "week") {
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);

      console.log(" Weekly range (client-side for labels):", {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        labels.push(dayNames[date.getDay()]);
      }
    } else {
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);

      console.log(
        ` Monthly range for ${monthNames[currentMonth]} ${currentYear}:`,
        {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          daysInMonth: endDate.getDate(),
        }
      );

      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
      }
    }

    const napHours = new Array(labels.length).fill(0);
    const nightHours = new Array(labels.length).fill(0);
    const totalSleepHours = new Array(labels.length).fill(0);
    const sleepProgress = new Array(labels.length).fill(0);
    const recordCounts = new Array(labels.length).fill(0);
    const dates = [];

    if (timePeriod === "week") {
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        dates.push(dateStr);
      }
    } else {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const day = i < 10 ? `0${i}` : `${i}`;
        const month =
          currentMonth + 1 < 10
            ? `0${currentMonth + 1}`
            : `${currentMonth + 1}`;
        dates.push(`${currentYear}-${month}-${day}`);
      }
    }

    rawSleepData.forEach((item, index) => {
      const itemDate = extractDateFromDateTime(item.date);

      const dateIndex = dates.findIndex((date) => {
        return date === itemDate;
      });

      console.log(` Mapping item ${index}:`, {
        itemDate,
        itemFullDate: item.date,
        dateIndex,
        napHours: item.napHours,
        nightHours: item.nightHours,
        totalHours: item.totalHours,
        sleepProgress: item.sleepProgress,
        matchFound: dateIndex !== -1,
      });

      if (dateIndex !== -1) {
        napHours[dateIndex] = Number.parseFloat(item.napHours) || 0;
        nightHours[dateIndex] = Number.parseFloat(item.nightHours) || 0;
        totalSleepHours[dateIndex] =
          Number.parseFloat(item.totalHours) ||
          napHours[dateIndex] + nightHours[dateIndex];
        sleepProgress[dateIndex] = Number.parseInt(item.sleepProgress) || 0;
        recordCounts[dateIndex] = 1;

        console.log(` Set data for ${itemDate} (index ${dateIndex}):`, {
          nap: napHours[dateIndex],
          night: nightHours[dateIndex],
          total: totalSleepHours[dateIndex],
          progress: sleepProgress[dateIndex],
        });
      } else {
        console.log(` Could not find date index for ${itemDate}`);
        console.log(` Available dates for matching:`, dates);
        console.log(`Date comparison details:`, {
          itemDate,
          expectedFormat: "YYYY-MM-DD",
          dateMatches: dates.map((d) => ({ date: d, matches: d === itemDate })),
        });
      }
    });

    for (let i = 0; i < labels.length; i++) {
      if (recordCounts[i] > 1) {
        napHours[i] = napHours[i] / recordCounts[i];
        nightHours[i] = nightHours[i] / recordCounts[i];
        totalSleepHours[i] = totalSleepHours[i] / recordCounts[i];
        sleepProgress[i] = Math.round(sleepProgress[i] / recordCounts[i]);
      }
    }

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

    console.log(
      "aFinal processed data for",
      `${monthNames[currentMonth]} ${currentYear}:`,
      result
    );
    return result;
  }, [rawSleepData, timePeriod, currentMonth, currentYear, monthNames]);

  const finalProcessedData = rawSleepData
    ? processRawSleepData()
    : processedData;

  const generateChartData = useCallback(() => {
    const processed = finalProcessedData;
    if (!processed) {
      console.log(" No processed data for chart generation");
      return null;
    }

    const { labels, napHours, nightHours, totalSleepHours } = processed;

    const hasData = totalSleepHours.some((hours) => hours > 0);
    if (!hasData) {
      console.log("  No sleep data found for chart");
      return null;
    }

    console.log("  Generating chart data with:", {
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
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: nightHours,
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
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

    const chartWidth = Math.min(screenWidth - 40, 500);
    const isSmallScreen = screenWidth < 350;

    const baseConfig = getChartConfig(categoryColor);

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

    const modifiedChartData = { ...generatedChartData };
    if (modifiedChartData.datasets) {
      modifiedChartData.datasets = modifiedChartData.datasets.map((dataset) => {
        const newDataset = { ...dataset };
        delete newDataset.legend;
        return newDataset;
      });
    }

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
            hidePointsAtIndex={[0, 1, 2, 3, 4, 5, 6]}
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
    const sunnyColor = "#FF9500";

    const daysWithData = labels
      .map((label, i) => ({
        label,
        date: dates[i],
        nap: Number.parseFloat(napHours[i]) || 0,
        night: Number.parseFloat(nightHours[i]) || 0,
        total: Number.parseFloat(totalSleepHours[i]) || 0,
        progress: sleepProgress[i],
        index: i,
      }))
      .filter((day) => {
        const hasData = day.nap > 0 || day.night > 0 || day.total > 0;
        console.log(` Day ${day.label} (${day.date}):`, {
          nap: day.nap,
          night: day.night,
          total: day.total,
          hasData,
        });
        return hasData;
      });

    console.log(` Days with data for ${timePeriod} view:`, daysWithData);

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
              No sleep data recorded for {monthNames[currentMonth]}{" "}
              {currentYear}.
            </Text>
          </View>
        </View>
      );
    }

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

        {renderLegendRow()}

        {daysWithData.map((day) => {
          const isPositive = day.progress >= 0;
          const progressColor = isPositive ? "#2ecc71" : "#e74c3c";

          const dateObj = new Date(day.date);
          const dayNumber = dateObj.getDate();

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
              <View style={styles.dayColumn}>
                <Text style={[styles.dayText, { color: theme.text }]}>
                  {timePeriod === "month" ? dayNumber : day.label}
                </Text>
              </View>

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

              <View style={styles.hoursColumn}>
                <Text style={[styles.hoursText, { color: theme.text }]}>
                  {day.total} hrs
                </Text>
              </View>

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
  }, [
    finalProcessedData,
    theme,
    timePeriod,
    monthNames,
    currentMonth,
    currentYear,
  ]);

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
