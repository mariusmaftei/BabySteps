"use client";

import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

const GrowthChartComponent = ({
  isLoading,
  error,
  chartData,
  processedData,
  theme,
  categoryColor,
  timePeriod,
  getChartConfig,
}) => {
  // State to track which metric is selected for detailed view
  const [selectedMetric, setSelectedMetric] = useState("weight"); // "weight", "height", "head"

  // Generate sample growth data for demonstration
  const sampleGrowthData = useMemo(() => {
    // More realistic data points for 6 months
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      dates: [
        "2025-01-15",
        "2025-02-15",
        "2025-03-15",
        "2025-04-15",
        "2025-05-15",
        "2025-06-15",
      ],
      weight: [4.2, 4.8, 5.3, 5.9, 6.4, 6.8], // in kg
      height: [54, 57, 60, 62, 64, 66], // in cm
      headCircumference: [37, 38.5, 39.8, 40.5, 41.2, 42], // in cm
      weightPercentile: [55, 58, 62, 65, 67, 65],
      heightPercentile: [60, 65, 68, 70, 72, 72],
      headPercentile: [50, 52, 55, 56, 58, 58],
    };
  }, []);

  // Professional color palette - matching GrowthScreen.js
  const chartColors = useMemo(() => {
    return {
      weight: "#5a87ff", // Blue for weight
      height: "#ff9500", // Orange for height
      head: "#ff2d55", // Red for head circumference
      weightLight: "rgba(90, 135, 255, 0.15)", // Light blue for backgrounds
      heightLight: "rgba(255, 149, 0, 0.15)", // Light orange for backgrounds
      headLight: "rgba(255, 45, 85, 0.15)", // Light red for backgrounds
      weightMedium: "rgba(90, 135, 255, 0.3)", // Medium blue for borders
      heightMedium: "rgba(255, 149, 0, 0.3)", // Medium orange for borders
      headMedium: "rgba(255, 45, 85, 0.3)", // Medium red for borders
      text: theme.text,
      background: theme.cardBackground,
    };
  }, [theme]);

  // Get color based on selected metric
  const getMetricColor = useCallback(
    (type = "primary") => {
      if (selectedMetric === "weight") {
        return type === "light"
          ? chartColors.weightLight
          : type === "medium"
          ? chartColors.weightMedium
          : chartColors.weight;
      } else if (selectedMetric === "height") {
        return type === "light"
          ? chartColors.heightLight
          : type === "medium"
          ? chartColors.heightMedium
          : chartColors.height;
      } else if (selectedMetric === "head") {
        return type === "light"
          ? chartColors.headLight
          : type === "medium"
          ? chartColors.headMedium
          : chartColors.head;
      } else {
        // Default to weight if somehow no valid metric is selected
        return type === "light"
          ? chartColors.weightLight
          : type === "medium"
          ? chartColors.weightMedium
          : chartColors.weight;
      }
    },
    [selectedMetric, chartColors]
  );

  // Create chart data based on selected metric
  const getChartDataForMetric = useCallback(() => {
    if (selectedMetric === "weight") {
      return {
        labels: sampleGrowthData.labels,
        datasets: [
          {
            data: sampleGrowthData.weight,
            color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`, // Blue for weight
            strokeWidth: 3,
          },
        ],
        legend: ["Weight (kg)"],
      };
    } else if (selectedMetric === "height") {
      return {
        labels: sampleGrowthData.labels,
        datasets: [
          {
            data: sampleGrowthData.height,
            color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Orange for height
            strokeWidth: 3,
          },
        ],
        legend: ["Height (cm)"],
      };
    } else if (selectedMetric === "head") {
      return {
        labels: sampleGrowthData.labels,
        datasets: [
          {
            data: sampleGrowthData.headCircumference,
            color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`, // Red for head
            strokeWidth: 3,
          },
        ],
        legend: ["Head Circumference (cm)"],
      };
    }
  }, [selectedMetric, sampleGrowthData]);

  // Enhanced chart configuration
  const enhancedChartConfig = useCallback(() => {
    const metricColor = getMetricColor();
    const gridColor = getMetricColor("medium");

    return {
      backgroundColor: theme.cardBackground,
      backgroundGradientFrom: theme.cardBackground,
      backgroundGradientTo: theme.cardBackground,
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(${hexToRgb(metricColor)}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${hexToRgb(theme.text)}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "5",
        strokeWidth: "2",
        stroke: theme.cardBackground,
      },
      propsForBackgroundLines: {
        strokeDasharray: "", // solid background lines
        strokeWidth: 1,
        stroke: gridColor, // colored grid lines based on selected metric
      },
      propsForLabels: {
        fontSize: 10,
        fontWeight: "bold",
      },
    };
  }, [theme, getMetricColor]);

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    if (!hex) return "0, 0, 0";
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Get icon name based on metric - matching GrowthScreen.js
  const getMetricIcon = useCallback((metric) => {
    switch (metric) {
      case "weight":
        return "scale-outline"; // Scale icon for weight
      case "height":
        return "resize-outline"; // Resize icon for height
      case "head":
        return "ellipse-outline"; // Circle icon for head circumference
      default:
        return "scale-outline";
    }
  }, []);

  // Render metric selector tabs
  const renderMetricSelector = useCallback(() => {
    return (
      <View
        style={[
          styles.metricSelectorContainer,
          { borderBottomColor: getMetricColor("medium") },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.metricTab,
            selectedMetric === "weight" && {
              backgroundColor: chartColors.weightLight,
              borderBottomWidth: 3,
              borderBottomColor: chartColors.weight,
            },
          ]}
          onPress={() => setSelectedMetric("weight")}
        >
          <View style={styles.metricTabContent}>
            <Ionicons
              name={getMetricIcon("weight")}
              size={18}
              color={
                selectedMetric === "weight"
                  ? chartColors.weight
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.metricTabText,
                {
                  color:
                    selectedMetric === "weight"
                      ? chartColors.weight
                      : theme.textSecondary,
                },
              ]}
            >
              Weight
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.metricTab,
            selectedMetric === "height" && {
              backgroundColor: chartColors.heightLight,
              borderBottomWidth: 3,
              borderBottomColor: chartColors.height,
            },
          ]}
          onPress={() => setSelectedMetric("height")}
        >
          <View style={styles.metricTabContent}>
            <Ionicons
              name={getMetricIcon("height")}
              size={18}
              color={
                selectedMetric === "height"
                  ? chartColors.height
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.metricTabText,
                {
                  color:
                    selectedMetric === "height"
                      ? chartColors.height
                      : theme.textSecondary,
                },
              ]}
            >
              Height
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.metricTab,
            selectedMetric === "head" && {
              backgroundColor: chartColors.headLight,
              borderBottomWidth: 3,
              borderBottomColor: chartColors.head,
            },
          ]}
          onPress={() => setSelectedMetric("head")}
        >
          <View style={styles.metricTabContent}>
            <Ionicons
              name={getMetricIcon("head")}
              size={18}
              color={
                selectedMetric === "head"
                  ? chartColors.head
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.metricTabText,
                {
                  color:
                    selectedMetric === "head"
                      ? chartColors.head
                      : theme.textSecondary,
                },
              ]}
            >
              Head
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [selectedMetric, theme, chartColors, getMetricColor, getMetricIcon]);

  // Render the enhanced growth chart
  const renderEnhancedGrowthChart = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getMetricColor()} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading growth data...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color={getMetricColor()} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        </View>
      );
    }

    // Calculate responsive width based on screen size
    const chartWidth = Math.min(screenWidth - 40, 500);
    const isSmallScreen = screenWidth < 350;

    const chartData = getChartDataForMetric();
    const chartConfig = enhancedChartConfig();

    // Determine y-axis suffix based on selected metric
    let yAxisSuffix = "";
    if (selectedMetric === "weight") yAxisSuffix = " kg";
    else if (selectedMetric === "height" || selectedMetric === "head")
      yAxisSuffix = " cm";

    return (
      <View
        style={[
          styles.enhancedChartContainer,
          { shadowColor: getMetricColor() },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          <View
            style={[
              styles.chartWrapper,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <LineChart
              data={chartData}
              width={chartWidth}
              height={isSmallScreen ? 220 : 260}
              chartConfig={chartConfig}
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              bezier={true}
              fromZero={false}
              yAxisSuffix={yAxisSuffix}
              yAxisInterval={1}
              segments={5}
              formatYLabel={(value) => {
                // Format y-axis labels to be cleaner
                return Number.parseFloat(value).toFixed(1);
              }}
              renderDotContent={({ x, y, index, indexData }) => {
                return (
                  <View
                    key={index}
                    style={[
                      styles.dataPointLabel,
                      {
                        top: y - 24,
                        left: x - 20,
                        backgroundColor: `${getMetricColor()}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dataPointText,
                        { color: getMetricColor() },
                      ]}
                    >
                      {indexData}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }, [
    isLoading,
    error,
    theme,
    getMetricColor,
    screenWidth,
    getChartDataForMetric,
    enhancedChartConfig,
    selectedMetric,
  ]);

  // Render current value and percentile
  const renderCurrentValue = useCallback(() => {
    let data, label, unit, color, percentile;

    if (selectedMetric === "weight") {
      data = sampleGrowthData.weight;
      label = "Weight";
      unit = "kg";
      color = chartColors.weight;
      percentile =
        sampleGrowthData.weightPercentile[
          sampleGrowthData.weightPercentile.length - 1
        ];
    } else if (selectedMetric === "height") {
      data = sampleGrowthData.height;
      label = "Height";
      unit = "cm";
      color = chartColors.height;
      percentile =
        sampleGrowthData.heightPercentile[
          sampleGrowthData.heightPercentile.length - 1
        ];
    } else if (selectedMetric === "head") {
      data = sampleGrowthData.headCircumference;
      label = "Head Circumference";
      unit = "cm";
      color = chartColors.head;
      percentile =
        sampleGrowthData.headPercentile[
          sampleGrowthData.headPercentile.length - 1
        ];
    }

    const currentValue = data[data.length - 1];

    return (
      <View
        style={[
          styles.currentValueContainer,
          { backgroundColor: `${color}15` },
        ]}
      >
        <View style={styles.currentValueHeader}>
          <Ionicons
            name={getMetricIcon(selectedMetric)}
            size={24}
            color={color}
          />
          <Text style={[styles.currentValueTitle, { color }]}>{label}</Text>
        </View>
        <Text style={[styles.currentValueNumber, { color: theme.text }]}>
          {currentValue} {unit}
        </Text>
        <Text
          style={[
            styles.currentValuePercentile,
            { color: theme.textSecondary },
          ]}
        >
          {percentile}th percentile
        </Text>
      </View>
    );
  }, [selectedMetric, sampleGrowthData, theme, chartColors, getMetricIcon]);

  // Render growth records list
  const renderGrowthRecords = useCallback(() => {
    let data, label, unit, color;

    if (selectedMetric === "weight") {
      data = sampleGrowthData.weight;
      label = "Weight";
      unit = "kg";
      color = chartColors.weight;
    } else if (selectedMetric === "height") {
      data = sampleGrowthData.height;
      label = "Height";
      unit = "cm";
      color = chartColors.height;
    } else if (selectedMetric === "head") {
      data = sampleGrowthData.headCircumference;
      label = "Head Circumference";
      unit = "cm";
      color = chartColors.head;
    }

    // Format dates for display
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    return (
      <View style={styles.recordsContainer}>
        <View
          style={[styles.recordsHeader, { borderBottomColor: `${color}30` }]}
        >
          <Ionicons
            name={getMetricIcon(selectedMetric)}
            size={20}
            color={color}
          />
          <Text style={[styles.recordsTitle, { color }]}>{label} Records</Text>
        </View>

        <ScrollView
          style={styles.recordsList}
          showsVerticalScrollIndicator={false}
        >
          {sampleGrowthData.dates.map((date, index) => {
            // Calculate change from previous measurement
            const currentValue = data[index];
            const prevValue = index > 0 ? data[index - 1] : currentValue;
            const change = currentValue - prevValue;
            const changeText =
              index === 0
                ? "-"
                : change > 0
                ? `+${change.toFixed(1)}`
                : change.toFixed(1);
            const changeColor =
              index === 0
                ? theme.textSecondary
                : change > 0
                ? color
                : "#E53935";

            return (
              <View
                key={index}
                style={[
                  styles.recordItem,
                  { borderBottomColor: `${color}15` },
                  index === sampleGrowthData.dates.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View style={styles.recordMain}>
                  <Text
                    style={[styles.recordDate, { color: theme.textSecondary }]}
                  >
                    {formatDate(date)}
                  </Text>
                  <View style={styles.recordValueContainer}>
                    <Text style={[styles.recordValue, { color: theme.text }]}>
                      {currentValue} {unit}
                    </Text>
                    <Text style={[styles.recordChange, { color: changeColor }]}>
                      {changeText !== "-" && changeText}
                    </Text>
                  </View>
                </View>

                {index > 0 && (
                  <View style={styles.recordDetails}>
                    <View
                      style={[
                        styles.recordIndicator,
                        { backgroundColor: color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.recordDetailText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {change > 0 ? "Increased" : "Decreased"} by{" "}
                      {Math.abs(change).toFixed(1)} {unit} since last
                      measurement
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [selectedMetric, sampleGrowthData, theme, chartColors, getMetricIcon]);

  return (
    <>
      {renderMetricSelector()}
      {renderEnhancedGrowthChart()}
      {renderCurrentValue()}
      {renderGrowthRecords()}

      <Text
        style={[
          styles.insightText,
          { color: theme.textSecondary, borderColor: getMetricColor("medium") },
        ]}
      >
        Your baby's growth is tracking well along expected patterns. Continue
        with regular check-ups to monitor development. The next recommended
        measurement should be taken in 4 weeks.
      </Text>
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
  metricSelectorContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricTabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  metricTabText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  enhancedChartContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 12,
    padding: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  dataPointLabel: {
    position: "absolute",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dataPointText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  currentValueContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  currentValueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  currentValueTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  currentValueNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  currentValuePercentile: {
    fontSize: 14,
  },
  recordsContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  recordsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  recordsList: {
    maxHeight: 300,
  },
  recordItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  recordMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordDate: {
    fontSize: 14,
  },
  recordValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  recordChange: {
    fontSize: 14,
    fontWeight: "500",
  },
  recordDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  recordIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  recordDetailText: {
    fontSize: 12,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    textAlign: "center",
  },
});

export default GrowthChartComponent;
