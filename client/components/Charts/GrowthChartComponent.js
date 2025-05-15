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
  const [selectedMetric, setSelectedMetric] = useState("all"); // "all", "weight", "height", "head"

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

  // Professional color palette
  const chartColors = useMemo(() => {
    return {
      weight: "#2E7D32", // Green
      height: "#1565C0", // Blue
      head: "#E65100", // Orange
      weightLight: "rgba(46, 125, 50, 0.15)", // Light green for backgrounds
      heightLight: "rgba(21, 101, 192, 0.15)", // Light blue for backgrounds
      headLight: "rgba(230, 81, 0, 0.15)", // Light orange for backgrounds
      weightMedium: "rgba(46, 125, 50, 0.3)", // Medium green for borders
      heightMedium: "rgba(21, 101, 192, 0.3)", // Medium blue for borders
      headMedium: "rgba(230, 81, 0, 0.3)", // Medium orange for borders
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
        // For "all", use a mix or default to category color
        return type === "light"
          ? chartColors.heightLight
          : type === "medium"
          ? chartColors.heightMedium
          : categoryColor;
      }
    },
    [selectedMetric, chartColors, categoryColor]
  );

  // Create chart data based on selected metric
  const getChartDataForMetric = useCallback(() => {
    if (selectedMetric === "all") {
      return {
        labels: sampleGrowthData.labels,
        datasets: [
          {
            data: sampleGrowthData.weight,
            color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`, // Weight
            strokeWidth: 3,
          },
          {
            data: sampleGrowthData.height.map((h) => h / 10), // Scale height to fit
            color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`, // Height
            strokeWidth: 3,
          },
          {
            data: sampleGrowthData.headCircumference.map((hc) => hc / 10), // Scale head to fit
            color: (opacity = 1) => `rgba(230, 81, 0, ${opacity})`, // Head
            strokeWidth: 3,
          },
        ],
        legend: ["Weight (kg)", "Height (cm/10)", "Head (cm/10)"],
      };
    } else if (selectedMetric === "weight") {
      return {
        labels: sampleGrowthData.labels,
        datasets: [
          {
            data: sampleGrowthData.weight,
            color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
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
            color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
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
            color: (opacity = 1) => `rgba(230, 81, 0, ${opacity})`,
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
            selectedMetric === "all" && {
              backgroundColor: getMetricColor("light"),
              borderBottomWidth: 3,
              borderBottomColor: categoryColor,
            },
          ]}
          onPress={() => setSelectedMetric("all")}
        >
          <Text
            style={[
              styles.metricTabText,
              {
                color:
                  selectedMetric === "all" ? theme.text : theme.textSecondary,
              },
            ]}
          >
            All Metrics
          </Text>
        </TouchableOpacity>

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
        </TouchableOpacity>
      </View>
    );
  }, [selectedMetric, theme, categoryColor, chartColors, getMetricColor]);

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
                // Only show dot content for the selected metric or if all metrics are selected
                if (selectedMetric !== "all") {
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
                }
                return null;
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

  // Render enhanced legend
  const renderEnhancedLegend = useCallback(() => {
    // Only show relevant legend items based on selected metric
    const legendItems = [];

    if (selectedMetric === "all" || selectedMetric === "weight") {
      legendItems.push({
        color: chartColors.weight,
        label: "Weight (kg)",
        value: sampleGrowthData.weight[sampleGrowthData.weight.length - 1],
      });
    }

    if (selectedMetric === "all" || selectedMetric === "height") {
      legendItems.push({
        color: chartColors.height,
        label: "Height (cm)",
        value: sampleGrowthData.height[sampleGrowthData.height.length - 1],
      });
    }

    if (selectedMetric === "all" || selectedMetric === "head") {
      legendItems.push({
        color: chartColors.head,
        label: "Head Circ. (cm)",
        value:
          sampleGrowthData.headCircumference[
            sampleGrowthData.headCircumference.length - 1
          ],
      });
    }

    return (
      <View
        style={[
          styles.enhancedLegendContainer,
          { borderBottomColor: getMetricColor("medium") },
        ]}
      >
        {legendItems.map((item, index) => (
          <View key={index} style={styles.enhancedLegendItem}>
            <View
              style={[styles.legendColorBox, { backgroundColor: item.color }]}
            />
            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
              {item.label}
            </Text>
            <Text style={[styles.legendValue, { color: theme.text }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    );
  }, [selectedMetric, chartColors, sampleGrowthData, theme, getMetricColor]);

  // Render growth details based on selected metric
  const renderGrowthDetails = useCallback(() => {
    // Get the appropriate data based on selected metric
    let title, data, color, percentiles, unit;

    if (selectedMetric === "weight") {
      title = "Weight Growth";
      data = sampleGrowthData.weight;
      color = chartColors.weight;
      percentiles = sampleGrowthData.weightPercentile;
      unit = "kg";
    } else if (selectedMetric === "height") {
      title = "Height Growth";
      data = sampleGrowthData.height;
      color = chartColors.height;
      percentiles = sampleGrowthData.heightPercentile;
      unit = "cm";
    } else if (selectedMetric === "head") {
      title = "Head Circumference";
      data = sampleGrowthData.headCircumference;
      color = chartColors.head;
      percentiles = sampleGrowthData.headPercentile;
      unit = "cm";
    } else {
      // For "all" metrics, show a summary
      return renderGrowthSummary();
    }

    // Calculate growth rate
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const growthAmount = lastValue - firstValue;
    const growthPercent = ((growthAmount / firstValue) * 100).toFixed(1);
    const monthlyGrowth = (growthAmount / (data.length - 1)).toFixed(2);

    // Get current percentile
    const currentPercentile = percentiles[percentiles.length - 1];

    const lightColor =
      color === chartColors.weight
        ? chartColors.weightLight
        : color === chartColors.height
        ? chartColors.heightLight
        : chartColors.headLight;

    return (
      <View
        style={[
          styles.growthDetailsContainer,
          { borderColor: color, backgroundColor: lightColor },
        ]}
      >
        <Text style={[styles.growthDetailsTitle, { color }]}>{title}</Text>

        <View style={styles.growthDetailsRow}>
          <View style={styles.growthDetailItem}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Starting
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {firstValue} {unit}
            </Text>
          </View>

          <View style={styles.growthDetailItem}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Current
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {lastValue} {unit}
            </Text>
          </View>

          <View style={styles.growthDetailItem}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Growth
            </Text>
            <Text style={[styles.detailValue, { color }]}>
              +{growthAmount.toFixed(1)} {unit}
            </Text>
          </View>
        </View>

        <View style={styles.growthDetailsRow}>
          <View style={styles.growthDetailItem}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Monthly
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              +{monthlyGrowth} {unit}
            </Text>
          </View>

          <View style={styles.growthDetailItem}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Percentile
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {currentPercentile}th
            </Text>
          </View>

          <View style={styles.growthDetailItem}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Total %
            </Text>
            <Text style={[styles.detailValue, { color }]}>
              +{growthPercent}%
            </Text>
          </View>
        </View>

        <View style={styles.percentileBarContainer}>
          <Text
            style={[styles.percentileLabel, { color: theme.textSecondary }]}
          >
            Percentile Range
          </Text>
          <View
            style={[styles.percentileBar, { backgroundColor: `${color}20` }]}
          >
            <View
              style={[
                styles.percentileFill,
                {
                  width: `${currentPercentile}%`,
                  backgroundColor: color,
                },
              ]}
            />
            <View
              style={[
                styles.percentileMarker,
                {
                  left: `${currentPercentile}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <View style={styles.percentileLabelsContainer}>
            <Text
              style={[
                styles.percentileRangeLabel,
                { color: theme.textSecondary },
              ]}
            >
              0%
            </Text>
            <Text
              style={[
                styles.percentileRangeLabel,
                { color: theme.textSecondary },
              ]}
            >
              50%
            </Text>
            <Text
              style={[
                styles.percentileRangeLabel,
                { color: theme.textSecondary },
              ]}
            >
              100%
            </Text>
          </View>
        </View>
      </View>
    );
  }, [
    selectedMetric,
    sampleGrowthData,
    chartColors,
    theme,
    renderGrowthSummary,
  ]);

  // Render growth summary for "all" metrics view
  const renderGrowthSummary = useCallback(() => {
    const {
      weight,
      height,
      headCircumference,
      weightPercentile,
      heightPercentile,
      headPercentile,
    } = sampleGrowthData;

    // Calculate overall growth percentages
    const weightGrowth = (
      ((weight[weight.length - 1] - weight[0]) / weight[0]) *
      100
    ).toFixed(1);
    const heightGrowth = (
      ((height[height.length - 1] - height[0]) / height[0]) *
      100
    ).toFixed(1);
    const headGrowth = (
      ((headCircumference[headCircumference.length - 1] -
        headCircumference[0]) /
        headCircumference[0]) *
      100
    ).toFixed(1);

    return (
      <View style={styles.growthSummaryContainer}>
        <Text style={[styles.growthSummaryTitle, { color: theme.text }]}>
          Growth Summary
        </Text>

        <View style={styles.growthSummaryRow}>
          <View
            style={[
              styles.growthSummaryCard,
              {
                borderColor: chartColors.weight,
                backgroundColor: chartColors.weightLight,
              },
            ]}
          >
            <View style={styles.summaryCardHeader}>
              <Ionicons
                name="scale-outline"
                size={18}
                color={chartColors.weight}
              />
              <Text
                style={[styles.summaryCardTitle, { color: chartColors.weight }]}
              >
                Weight
              </Text>
            </View>
            <Text style={[styles.summaryCardValue, { color: theme.text }]}>
              {weight[weight.length - 1]} kg
            </Text>
            <View style={styles.summaryCardFooter}>
              <Text
                style={[
                  styles.summaryCardGrowth,
                  { color: chartColors.weight },
                ]}
              >
                +{weightGrowth}%
              </Text>
              <Text
                style={[
                  styles.summaryCardPercentile,
                  { color: theme.textSecondary },
                ]}
              >
                {weightPercentile[weightPercentile.length - 1]}th percentile
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.growthSummaryCard,
              {
                borderColor: chartColors.height,
                backgroundColor: chartColors.heightLight,
              },
            ]}
          >
            <View style={styles.summaryCardHeader}>
              <Ionicons
                name="resize-outline"
                size={18}
                color={chartColors.height}
              />
              <Text
                style={[styles.summaryCardTitle, { color: chartColors.height }]}
              >
                Height
              </Text>
            </View>
            <Text style={[styles.summaryCardValue, { color: theme.text }]}>
              {height[height.length - 1]} cm
            </Text>
            <View style={styles.summaryCardFooter}>
              <Text
                style={[
                  styles.summaryCardGrowth,
                  { color: chartColors.height },
                ]}
              >
                +{heightGrowth}%
              </Text>
              <Text
                style={[
                  styles.summaryCardPercentile,
                  { color: theme.textSecondary },
                ]}
              >
                {heightPercentile[heightPercentile.length - 1]}th percentile
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.growthSummaryCard,
              {
                borderColor: chartColors.head,
                backgroundColor: chartColors.headLight,
              },
            ]}
          >
            <View style={styles.summaryCardHeader}>
              <Ionicons
                name="ellipse-outline"
                size={18}
                color={chartColors.head}
              />
              <Text
                style={[styles.summaryCardTitle, { color: chartColors.head }]}
              >
                Head
              </Text>
            </View>
            <Text style={[styles.summaryCardValue, { color: theme.text }]}>
              {headCircumference[headCircumference.length - 1]} cm
            </Text>
            <View style={styles.summaryCardFooter}>
              <Text
                style={[styles.summaryCardGrowth, { color: chartColors.head }]}
              >
                +{headGrowth}%
              </Text>
              <Text
                style={[
                  styles.summaryCardPercentile,
                  { color: theme.textSecondary },
                ]}
              >
                {headPercentile[headPercentile.length - 1]}th percentile
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.growthInsightContainer,
            { backgroundColor: chartColors.heightLight },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={categoryColor}
            style={styles.insightIcon}
          />
          <Text
            style={[styles.growthInsightText, { color: theme.textSecondary }]}
          >
            Your baby is growing at a healthy rate across all measurements. All
            metrics are within normal percentile ranges, which indicates
            consistent and proportional development.
          </Text>
        </View>
      </View>
    );
  }, [sampleGrowthData, theme, chartColors, categoryColor]);

  // Render growth history table
  const renderGrowthHistory = useCallback(() => {
    // Only show history for the selected metric
    if (selectedMetric === "all") return null;

    let data, label, unit, color, lightColor;

    if (selectedMetric === "weight") {
      data = sampleGrowthData.weight;
      label = "Weight";
      unit = "kg";
      color = chartColors.weight;
      lightColor = chartColors.weightLight;
    } else if (selectedMetric === "height") {
      data = sampleGrowthData.height;
      label = "Height";
      unit = "cm";
      color = chartColors.height;
      lightColor = chartColors.heightLight;
    } else if (selectedMetric === "head") {
      data = sampleGrowthData.headCircumference;
      label = "Head Circ.";
      unit = "cm";
      color = chartColors.head;
      lightColor = chartColors.headLight;
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
      <View style={[styles.historyContainer, { backgroundColor: lightColor }]}>
        <Text style={[styles.historyTitle, { color: color }]}>
          {label} History
        </Text>

        <View style={styles.historyTable}>
          <View
            style={[
              styles.historyHeaderRow,
              { borderBottomColor: `${color}40` },
            ]}
          >
            <Text
              style={[
                styles.historyHeaderCell,
                { color: theme.textSecondary, flex: 2 },
              ]}
            >
              Date
            </Text>
            <Text
              style={[
                styles.historyHeaderCell,
                { color: theme.textSecondary, flex: 1 },
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                styles.historyHeaderCell,
                { color: theme.textSecondary, flex: 1 },
              ]}
            >
              Change
            </Text>
          </View>

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

            return (
              <View
                key={index}
                style={[
                  styles.historyRow,
                  { borderBottomColor: `${color}20` },
                  index === sampleGrowthData.dates.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <Text
                  style={[styles.historyCell, { color: theme.text, flex: 2 }]}
                >
                  {formatDate(date)}
                </Text>
                <Text
                  style={[styles.historyCell, { color: theme.text, flex: 1 }]}
                >
                  {currentValue} {unit}
                </Text>
                <Text
                  style={[
                    styles.historyCell,
                    {
                      color: index === 0 ? theme.textSecondary : color,
                      flex: 1,
                      fontWeight: index === 0 ? "normal" : "bold",
                    },
                  ]}
                >
                  {changeText}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }, [selectedMetric, sampleGrowthData, theme, chartColors]);

  return (
    <>
      {renderMetricSelector()}
      {renderEnhancedGrowthChart()}
      {renderEnhancedLegend()}
      {renderGrowthDetails()}
      {renderGrowthHistory()}

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
  metricTabText: {
    fontSize: 13,
    fontWeight: "600",
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
  enhancedLegendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  enhancedLegendItem: {
    flexDirection: "column",
    alignItems: "center",
  },
  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  growthDetailsContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  growthDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  growthDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  growthDetailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  percentileBarContainer: {
    marginTop: 8,
  },
  percentileLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  percentileBar: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  percentileFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  percentileMarker: {
    position: "absolute",
    width: 4,
    height: 16,
    top: -2,
    marginLeft: -2,
    borderRadius: 2,
  },
  percentileLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  percentileRangeLabel: {
    fontSize: 10,
  },
  growthSummaryContainer: {
    marginBottom: 20,
  },
  growthSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  growthSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  growthSummaryCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  summaryCardFooter: {
    flexDirection: "column",
  },
  summaryCardGrowth: {
    fontSize: 12,
    fontWeight: "bold",
  },
  summaryCardPercentile: {
    fontSize: 10,
  },
  growthInsightContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
  },
  insightIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  growthInsightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  historyContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  historyTable: {
    width: "100%",
  },
  historyHeaderRow: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  historyHeaderCell: {
    fontSize: 12,
    fontWeight: "bold",
  },
  historyRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  historyCell: {
    fontSize: 13,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});

export default GrowthChartComponent;
