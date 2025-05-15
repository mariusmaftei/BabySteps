import React, { useCallback } from "react";
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

const FeedingChartComponent = ({
  isLoading,
  error,
  chartData,
  processedData,
  theme,
  categoryColor,
  timePeriod,
  getChartConfig,
}) => {
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

    const chartConfig = getChartConfig(categoryColor);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContainer}
      >
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={isSmallScreen ? 220 : 260}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero={true}
          />
        </View>
      </ScrollView>
    );
  }, [isLoading, error, chartData, theme, categoryColor, getChartConfig]);

  const renderDailyFeedingSummary = useCallback(() => {
    if (!processedData) return null;

    const { dailyFeedings } = processedData;

    return (
      <View
        style={[
          styles.dailyFeedingContainer,
          { backgroundColor: `${theme.cardBackground}80` },
        ]}
      >
        <Text style={[styles.dailyFeedingTitle, { color: theme.text }]}>
          Daily Feeding Summary
        </Text>

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
                    { backgroundColor: "#5856D6" },
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
  }, [processedData, theme]);

  return (
    <>
      {renderFeedingChart()}

      {processedData && (
        <View>
          <View style={[styles.statsContainer, { borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Breast
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {processedData.avgBreastDuration} min
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Bottle
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {processedData.avgBottleAmount} ml
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Solid
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {processedData.avgSolidAmount} g
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.insightText,
              { color: theme.textSecondary, borderColor: theme.border },
            ]}
          >
            Your baby's feeding pattern shows {processedData.breastPercentage}%
            breast feeding, {processedData.bottlePercentage}% bottle feeding,
            and {processedData.solidPercentage}% solid food. Maintain a balanced
            diet for optimal growth.
          </Text>
        </View>
      )}

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
    paddingTop: 16,
    borderTopWidth: 1,
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
});

export default FeedingChartComponent;
