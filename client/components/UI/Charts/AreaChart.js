"use client";

import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const ProgressBar = ({ progress, color, width }) => {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.progressBarContainer, { width }]}>
      <View style={[styles.progressBarBackground, { width }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${safeProgress}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color }]}>{safeProgress}%</Text>
    </View>
  );
};

const AreaCharts = ({
  theme,
  onProgressCalculated,
  targetWeight,
  targetHeight,
  targetHeadCirc,
  currentWeight, // This is the current input/latest today's record
  currentHeight, // This is the current input/latest today's record
  currentHeadCirc, // This is the current input/latest today's record
  birthWeight,
  birthHeight,
  birthHeadCirc,
  hasWeightMeasurement = false, // Indicates if currentWeight is populated (today's record or new input)
  hasHeightMeasurement = false,
  hasHeadCircMeasurement = false,
  allGrowthRecords, // All historical growth records from DB
}) => {
  console.log("AreaChart props:", {
    birthWeight,
    birthHeight,
    birthHeadCirc,
    currentWeight,
    currentHeight,
    currentHeadCirc,
    hasWeightMeasurement,
    hasHeightMeasurement,
    hasHeadCircMeasurement,
    allGrowthRecords,
  });

  const ensureNumber = (value) => {
    if (!value) return 0;
    const num = Number.parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const getBirthValue = (type) => {
    switch (type) {
      case "weight":
        return ensureNumber(birthWeight) || 3500;
      case "height":
        return ensureNumber(birthHeight) || 50;
      case "headCirc":
        return ensureNumber(birthHeadCirc) || 35;
      default:
        return 3500;
    }
  };

  const getTargetValue = (type) => {
    switch (type) {
      case "weight":
        return Math.round(targetWeight);
      case "height":
        // Convert from mm to cm for display
        return Math.round(targetHeight / 10);
      case "headCirc":
        // Convert from mm to cm for display
        return Math.round(targetHeadCirc / 10);
      default:
        return Math.round(targetWeight);
    }
  };

  const getTotalTargetValue = (type) => {
    return getTargetValue(type);
  };

  const getSmoothProgress = (type) => {
    const birth = getBirthValue(type);
    const totalTarget = getTotalTargetValue(type);

    // Determine the latest actual measurement for progress calculation
    let latestActualMeasurementForProgress;
    if (
      (type === "weight" && hasWeightMeasurement) ||
      (type === "height" && hasHeightMeasurement) ||
      (type === "headCirc" && hasHeadCircMeasurement)
    ) {
      // Use current input if available (meaning a record for today or new input)
      latestActualMeasurementForProgress =
        type === "weight"
          ? ensureNumber(currentWeight)
          : type === "height"
          ? ensureNumber(currentHeight)
          : ensureNumber(currentHeadCirc);
    } else if (allGrowthRecords && allGrowthRecords.length > 0) {
      // Otherwise, use the latest record from the database
      const lastRecord = allGrowthRecords[allGrowthRecords.length - 1];
      latestActualMeasurementForProgress =
        type === "weight"
          ? ensureNumber(lastRecord.weight)
          : type === "height"
          ? ensureNumber(lastRecord.height / 10) // Convert mm to cm
          : ensureNumber(lastRecord.headCircumference / 10); // Convert mm to cm
    } else {
      // If no records at all, progress starts from birth value
      latestActualMeasurementForProgress = birth;
    }

    // Handle edge cases for target
    if (totalTarget <= 0) return 100; // Avoid division by zero or negative target

    // NEW CALCULATION: (current_total_value / target_total_value) * 100
    const percentage = (latestActualMeasurementForProgress / totalTarget) * 100;

    // Ensure progress is between 0 and 100
    return Math.round(Math.min(Math.max(percentage, 0), 100));
  };

  const calculateProgressValues = useMemo(() => {
    return {
      weightProgress: getSmoothProgress("weight"),
      heightProgress: getSmoothProgress("height"),
      headCircProgress: getSmoothProgress("headCirc"),
    };
  }, [
    currentWeight,
    currentHeight,
    currentHeadCirc,
    targetWeight,
    targetHeight,
    targetHeadCirc,
    birthWeight,
    birthHeight,
    birthHeadCirc,
    hasWeightMeasurement,
    hasHeightMeasurement,
    hasHeadCircMeasurement,
    allGrowthRecords, // Added allGrowthRecords to dependencies for progress calculation
  ]);

  useEffect(() => {
    if (onProgressCalculated) {
      onProgressCalculated(calculateProgressValues);
    }
  }, [calculateProgressValues, onProgressCalculated]);

  const createCustomChartData = (type) => {
    const birthValue = getBirthValue(type);
    const targetValue = getTotalTargetValue(type);

    // Calculate the value for the second dot based on the progress percentage
    const progressPercentage = calculateProgressValues[type + "Progress"];
    const progressBasedValue = (progressPercentage / 100) * targetValue;

    const labels = ["Birth", "Latest", "Target"];
    const data = [birthValue, progressBasedValue, targetValue]; // MODIFIED LINE

    // --- ADDED CONSOLE LOG FOR DEBUGGING ---
    console.log(`DEBUG: Chart Data for ${type}:`, {
      labels,
      data,
      progressPercentage,
      progressBasedValue,
    });
    // ---------------------------------------

    // Calculate max and min for Y-axis dynamically based on these three points
    const allValues = [...data];
    const maxValue = Math.max(...allValues) * 1.1; // 10% buffer
    const minValue = Math.min(...allValues) * 0.95; // 5% buffer

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          color: (opacity = 1) =>
            type === "weight"
              ? `rgba(65, 105, 225, ${opacity})`
              : type === "height"
              ? `rgba(255, 140, 0, ${opacity})`
              : `rgba(220, 20, 60, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      yMax: maxValue,
      yMin: minValue,
    };
  };

  const getChartConfig = (type) => {
    let color;

    switch (type) {
      case "weight":
        color = (opacity = 1) => `rgba(65, 105, 225, ${opacity})`;
        break;
      case "height":
        color = (opacity = 1) => `rgba(255, 140, 0, ${opacity})`;
        break;
      case "headCirc":
        color = (opacity = 1) => `rgba(220, 20, 60, ${opacity})`;
        break;
      default:
        color = (opacity = 1) => `rgba(65, 105, 225, ${opacity})`;
    }

    const chartData = createCustomChartData(type); // Get data to extract yMin/yMax

    return {
      backgroundGradientFrom: theme.cardBackground,
      backgroundGradientTo: theme.cardBackground,
      decimalPlaces: 0,
      color: color,
      labelColor: (opacity = 1) => theme.text,
      style: {
        borderRadius: 10,
      },
      propsForDots: {
        r: "3",
        strokeWidth: "1",
        stroke:
          type === "weight"
            ? "#4169E1"
            : type === "height"
            ? "#FF8C00"
            : "#DC143C",
      },
      yAxisMin: chartData.yMin, // Use calculated min
      yAxisMax: chartData.yMax, // Use calculated max
      propsForLabels: {
        fontSize: 8,
      },
    };
  };

  const getYAxisSuffix = (type) => {
    switch (type) {
      case "weight":
        return "g";
      case "height":
      case "headCirc":
        return "cm";
      default:
        return "g";
    }
  };

  const getUnit = (type) => {
    switch (type) {
      case "weight":
        return "g";
      case "height":
      case "headCirc":
        return "cm";
      default:
        return "g";
    }
  };

  const getChartTitle = (type) => {
    switch (type) {
      case "weight":
        return "Weight";
      case "height":
        return "Height";
      case "headCirc":
        return "Head Circ.";
      default:
        return "Weight";
    }
  };

  const getChartIcon = (type) => {
    switch (type) {
      case "weight":
        return "fitness";
      case "height":
        return "resize";
      case "headCirc":
        return "ellipse";
      default:
        return "fitness";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "weight":
        return "#4169E1";
      case "height":
        return "#FF8C00";
      case "headCirc":
        return "#DC143C";
      default:
        return "#4169E1";
    }
  };

  const renderChartSection = (type) => {
    const chartWidth = ((screenWidth - 40) / 3) * 0.8;
    const progress = getSmoothProgress(type);
    const typeColor = getTypeColor(type);

    // Get the latest actual measurement for display below the chart
    // This should be the current input if available, otherwise the latest from DB, otherwise birth
    let displayValue;
    let isDisplayValueBirth = false;

    if (
      (type === "weight" && hasWeightMeasurement) ||
      (type === "height" && hasHeightMeasurement) ||
      (type === "headCirc" && hasHeadCircMeasurement)
    ) {
      // Use current input if available (meaning a record for today or new input)
      displayValue =
        type === "weight"
          ? ensureNumber(currentWeight)
          : type === "height"
          ? ensureNumber(currentHeight)
          : ensureNumber(currentHeadCirc);
    } else if (allGrowthRecords && allGrowthRecords.length > 0) {
      // Otherwise, use the latest record from the database
      const lastRecord = allGrowthRecords[allGrowthRecords.length - 1];
      displayValue =
        type === "weight"
          ? ensureNumber(lastRecord.weight)
          : type === "height"
          ? ensureNumber(lastRecord.height / 10)
          : ensureNumber(lastRecord.headCircumference / 10);
    } else {
      // If no records at all, use birth value
      displayValue = getBirthValue(type);
      isDisplayValueBirth = true;
    }

    return (
      <View style={styles.chartSection} key={type}>
        <View style={styles.chartTitleContainer}>
          <Ionicons name={getChartIcon(type)} size={14} color={typeColor} />
          <Text style={[styles.chartTitle, { color: theme.text }]}>
            {getChartTitle(type)}
          </Text>
        </View>

        <View style={styles.lineChartContainer}>
          {createCustomChartData(type).datasets &&
          createCustomChartData(type).datasets[0] &&
          createCustomChartData(type).datasets[0].data &&
          createCustomChartData(type).datasets[0].data.length > 0 ? (
            <LineChart
              data={createCustomChartData(type)}
              width={chartWidth}
              height={96}
              yAxisSuffix={getYAxisSuffix(type)}
              chartConfig={getChartConfig(type)}
              // Removed bezier to ensure dots are plotted precisely at their coordinates
              style={styles.lineChart}
              withDots={true}
              withShadow={false}
              withInnerLines={false}
              withOuterLines={true}
              fromZero={false}
              segments={3}
              formatYLabel={(value) => Math.round(value).toString()}
            />
          ) : (
            <View
              style={[
                styles.noDataContainer,
                {
                  backgroundColor: theme.backgroundSecondary,
                  width: chartWidth,
                  height: 96,
                },
              ]}
            >
              <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
                No data
              </Text>
            </View>
          )}
        </View>

        <ProgressBar
          progress={progress}
          color={typeColor}
          width={chartWidth - 8}
        />

        <View style={styles.growthStatsContainer}>
          <Text
            style={[styles.growthStatLabel, { color: theme.textSecondary }]}
          >
            Current:{" "}
            <Text style={[styles.growthStatValue, { color: theme.primary }]}>
              {displayValue}
              {getUnit(type)}
            </Text>
            {isDisplayValueBirth && (
              <Text
                style={[styles.growthStatNote, { color: theme.textSecondary }]}
              >
                {" "}
                (Birth)
              </Text>
            )}
          </Text>
          <Text
            style={[styles.growthStatLabel, { color: theme.textSecondary }]}
          >
            Target:{" "}
            <Text style={[styles.growthStatValue, { color: theme.success }]}>
              {getTotalTargetValue(type)}
              {getUnit(type)}
            </Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}
    >
      <View style={styles.chartHeader}>
        <Ionicons
          name="bar-chart"
          size={22}
          color={theme.text}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Growth Charts
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flex: 1, justifyContent: "center" }}
      >
        {renderChartSection("weight")}
        {renderChartSection("height")}
        {renderChartSection("headCirc")}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    borderRadius: 16,
    marginBottom: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  chartsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  chartSection: {
    marginHorizontal: 4,
    alignItems: "center",
  },
  chartTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  lineChartContainer: {
    alignItems: "center",
    marginBottom: 6,
  },
  lineChart: {
    borderRadius: 10,
  },
  noDataContainer: {
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 11,
    fontWeight: "500",
  },
  growthStatsContainer: {
    alignItems: "center",
    marginTop: 3,
  },
  growthStatLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 1,
  },
  growthStatValue: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  growthStatNote: {
    fontSize: 10,
    fontStyle: "italic",
  },
});

export default AreaCharts;
