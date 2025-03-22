import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const GrowthCharts = ({
  theme,
  activeChartTab,
  setActiveChartTab,
  getBarChartData,
  getHeightChartData,
  getHeadCircChartData,
  weightGain,
  heightGain,
  headCircGain,
  isWeightGainSufficient,
  isHeightGainSufficient,
  isHeadCircGainSufficient,
  recommendations,
  targetWeight,
  targetHeight,
  targetHeadCirc,
  currentWeight,
  currentHeight,
  currentHeadCirc,
  birthWeight,
  birthHeight,
  birthHeadCirc,
}) => {
  // Get the birth measurement based on active tab with fallback values
  const getBirthValue = () => {
    switch (activeChartTab) {
      case "weight":
        // Default to 3000g (3kg) if no birth weight is provided
        return Number.parseFloat(birthWeight) || 3000;
      case "height":
        // Default to 500mm (50cm) if no birth height is provided
        return Number.parseFloat(birthHeight) || 500;
      case "headCirc":
        // Default to 350mm (35cm) if no birth head circumference is provided
        return Number.parseFloat(birthHeadCirc) || 350;
      default:
        return 3000; // Default to 3000g for weight
    }
  };

  // Get the current additional measurement value (what user inputs)
  const getAdditionalValue = () => {
    switch (activeChartTab) {
      case "weight":
        return Number.parseFloat(currentWeight) || 0;
      case "height":
        return Number.parseFloat(currentHeight) || 0;
      case "headCirc":
        return Number.parseFloat(currentHeadCirc) || 0;
      default:
        return 0;
    }
  };

  // Get the total measurement (birth + additional input)
  const getTotalValue = () => {
    const birth = getBirthValue();
    const additional = getAdditionalValue();
    return birth + additional;
  };

  // Get the appropriate target value
  const getTargetValue = () => {
    switch (activeChartTab) {
      case "weight":
        return targetWeight;
      case "height":
        return targetHeight;
      case "headCirc":
        return targetHeadCirc;
      default:
        return targetWeight;
    }
  };

  // Calculate the total target (birth + monthly target)
  const getTotalTargetValue = () => {
    const birth = getBirthValue();
    const target = getTargetValue();
    return birth + target;
  };

  // Calculate smooth progress percentage toward total target
  const getSmoothProgress = () => {
    const birth = getBirthValue();
    const additional = getAdditionalValue();
    const totalTarget = getTotalTargetValue();

    // If birth value is already equal to or greater than total target, return 100%
    if (birth >= totalTarget) return 100;

    // Calculate how much progress has been made from birth to total target
    const totalGrowthNeeded = totalTarget - birth;

    // Use the additional value directly as the actual growth
    const actualGrowth = additional;

    // Calculate percentage (capped at 100%)
    const percentage = Math.min(
      Math.round((actualGrowth / totalGrowthNeeded) * 100),
      100
    );

    // Ensure percentage is not negative
    return Math.max(percentage, 0);
  };

  // Get the appropriate gain value (what user inputs)
  const getGainValue = () => {
    return getAdditionalValue();
  };

  // Create custom chart data that correctly shows birth value, current value, and target value
  const createCustomChartData = () => {
    const birthValue = getBirthValue();
    const totalValue = getTotalValue();
    const targetValue = getTotalTargetValue();
    const hasPreviousRecord = getBarChartData().labels.includes("Previous");

    // Calculate a reasonable Y-axis max value to ensure proper scaling
    const maxValue = Math.max(birthValue, totalValue, targetValue) * 1.1; // Add 10% buffer

    // If we have a previous record, include it in the chart
    if (hasPreviousRecord) {
      const previousValue = getBarChartData().datasets[0].data[1]; // Previous value is at index 1

      return {
        labels: ["Birth", "Previous", "Current", "Target"],
        datasets: [
          {
            data: [birthValue, previousValue, totalValue, targetValue],
            color: (opacity = 1) =>
              activeChartTab === "weight"
                ? `rgba(65, 105, 225, ${opacity})`
                : activeChartTab === "height"
                ? `rgba(255, 140, 0, ${opacity})`
                : `rgba(220, 20, 60, ${opacity})`,
            strokeWidth: 4,
          },
        ],
        // Add a second "invisible" dataset with min/max values to control Y-axis scaling
        yMax: maxValue,
      };
    } else {
      // If no previous record, show birth, current, and target
      return {
        labels: ["Birth", "Current", "Target"],
        datasets: [
          {
            data: [birthValue, totalValue, targetValue],
            color: (opacity = 1) =>
              activeChartTab === "weight"
                ? `rgba(65, 105, 225, ${opacity})`
                : activeChartTab === "height"
                ? `rgba(255, 140, 0, ${opacity})`
                : `rgba(220, 20, 60, ${opacity})`,
            strokeWidth: 4,
          },
        ],
        // Add a second "invisible" dataset with min/max values to control Y-axis scaling
        yMax: maxValue,
      };
    }
  };

  // Get the appropriate data based on active tab
  const getChartData = () => {
    return createCustomChartData();
  };

  // Get chart config based on active tab
  const getChartConfig = () => {
    let color;

    switch (activeChartTab) {
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

    return {
      backgroundGradientFrom: theme.cardBackground,
      backgroundGradientTo: theme.cardBackground,
      decimalPlaces: 0,
      color: color,
      labelColor: (opacity = 1) => theme.text,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke:
          activeChartTab === "weight"
            ? "#4169E1"
            : activeChartTab === "height"
            ? "#FF8C00"
            : "#DC143C",
      },
      // Set a custom Y-axis min/max to ensure proper scaling
      yAxisMin: getBirthValue() * 0.95, // Start slightly below birth value
      yAxisMax: getChartData().yMax,
    };
  };

  // Get the appropriate suffix for measurements
  const getYAxisSuffix = () => {
    switch (activeChartTab) {
      case "weight":
        return " g";
      case "height":
      case "headCirc":
        return " mm";
      default:
        return " g";
    }
  };

  // Get the appropriate unit for the active tab
  const getUnit = () => {
    switch (activeChartTab) {
      case "weight":
        return "g";
      case "height":
      case "headCirc":
        return "mm";
      default:
        return "g";
    }
  };

  // Get the appropriate color for progress
  const getProgressColor = () => {
    // Get the progress percentage
    const progress = getSmoothProgress();

    // If progress is at least 85% of target, show success color
    if (progress >= 85) {
      return theme.success;
    }
    // If progress is at least 50% of target, show neutral color
    else if (progress >= 50) {
      return theme.primary;
    }
    // Otherwise show warning color
    else {
      return theme.warning;
    }
  };

  // Get the appropriate icon for the active tab
  const getTabIcon = (tab) => {
    switch (tab) {
      case "weight":
        return "fitness";
      case "height":
        return "resize";
      case "headCirc":
        return "ellipse-outline";
      default:
        return "fitness";
    }
  };

  // Get the appropriate title for the active tab
  const getTabTitle = () => {
    switch (activeChartTab) {
      case "weight":
        return "Weight Growth";
      case "height":
        return "Height Growth";
      case "headCirc":
        return "Head Circumference Growth";
      default:
        return "Weight Growth";
    }
  };

  // Get the growth status text
  const getGrowthStatusText = () => {
    const progress = getSmoothProgress();

    if (progress >= 100) {
      return "Monthly Target Reached";
    } else if (progress >= 85) {
      return "On Track for Monthly Goal";
    } else if (progress >= 50) {
      return `${progress}% of Monthly Target`;
    } else {
      return `Below Monthly Target (${progress}%)`;
    }
  };

  // Calculate remaining growth needed
  const getRemainingGrowth = () => {
    const additional = getAdditionalValue();
    const target = getTargetValue();
    const remaining = target - additional;

    // If additional is already at or above target, return 0
    return Math.max(0, remaining);
  };

  return (
    <View
      style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}
    >
      <View style={styles.chartHeader}>
        <Ionicons
          name="bar-chart"
          size={24}
          color={theme.text}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Growth Charts
        </Text>
      </View>

      {/* Tab Buttons */}
      <View
        style={[
          styles.chartTabsContainer,
          { backgroundColor: `${theme.textSecondary}15` },
        ]}
      >
        {["weight", "height", "headCirc"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.chartTab,
              activeChartTab === tab && {
                backgroundColor:
                  tab === "weight"
                    ? "rgba(65, 105, 225, 0.2)"
                    : tab === "height"
                    ? "rgba(255, 140, 0, 0.2)"
                    : "rgba(220, 20, 60, 0.2)",
              },
            ]}
            onPress={() => setActiveChartTab(tab)}
          >
            <Ionicons
              name={getTabIcon(tab)}
              size={18}
              color={
                activeChartTab === tab
                  ? tab === "weight"
                    ? "#4169E1"
                    : tab === "height"
                    ? "#FF8C00"
                    : "#DC143C"
                  : theme.textSecondary
              }
              style={styles.chartTabIcon}
            />
            <Text
              style={[
                styles.chartTabText,
                {
                  color:
                    activeChartTab === tab
                      ? tab === "weight"
                        ? "#4169E1"
                        : tab === "height"
                        ? "#FF8C00"
                        : "#DC143C"
                      : theme.textSecondary,
                },
              ]}
            >
              {tab === "weight"
                ? "Weight"
                : tab === "height"
                ? "Height"
                : "Head Circ."}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart Title */}
      <Text style={[styles.chartTitle, { color: theme.text }]}>
        {getTabTitle()}
      </Text>

      {/* Line Chart */}
      <View style={styles.lineChartContainer}>
        <LineChart
          data={getChartData()}
          width={screenWidth - 48}
          height={220}
          yAxisSuffix={getYAxisSuffix()}
          chartConfig={getChartConfig()}
          bezier
          style={styles.lineChart}
          withDots={true}
          withShadow={true}
          withInnerLines={false}
          withOuterLines={true}
          fromZero={false} // Keep this false to allow the chart to scale properly
          segments={4} // Increase segments for more detailed Y-axis
          formatYLabel={(value) => Math.round(value).toString()} // Round Y-axis labels to whole numbers
        />
      </View>

      {/* Growth Stats */}
      <View style={styles.growthStatsContainer}>
        <View style={styles.growthStatRow}>
          <View style={styles.growthStatItem}>
            <Text
              style={[styles.growthStatLabel, { color: theme.textSecondary }]}
            >
              Total{" "}
              {activeChartTab === "weight"
                ? "Weight"
                : activeChartTab === "height"
                ? "Height"
                : "Head Circ."}
            </Text>
            <Text style={[styles.growthStatValue, { color: theme.primary }]}>
              {getTotalValue()} {getUnit()}
            </Text>
          </View>

          <View style={styles.growthStatDivider} />

          <View style={styles.growthStatItem}>
            <Text
              style={[styles.growthStatLabel, { color: theme.textSecondary }]}
            >
              Monthly Target
            </Text>
            <Text style={[styles.growthStatValue, { color: theme.success }]}>
              {getTotalTargetValue()} {getUnit()}
            </Text>
          </View>
        </View>

        {/* Growth Details */}
        <View
          style={[
            styles.growthDetailsContainer,
            {
              backgroundColor: `${theme.primary}10`,
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            },
          ]}
        >
          <View style={styles.growthDetailRow}>
            <Text
              style={[styles.growthDetailLabel, { color: theme.textSecondary }]}
            >
              Birth:
            </Text>
            <Text style={[styles.growthDetailValue, { color: theme.text }]}>
              {getBirthValue()} {getUnit()}
            </Text>
          </View>

          <View style={styles.growthDetailRow}>
            <Text
              style={[styles.growthDetailLabel, { color: theme.textSecondary }]}
            >
              Added Growth:
            </Text>
            <Text style={[styles.growthDetailValue, { color: theme.success }]}>
              {getAdditionalValue()} {getUnit()}
            </Text>
          </View>

          <View style={styles.growthDetailRow}>
            <Text
              style={[styles.growthDetailLabel, { color: theme.textSecondary }]}
            >
              Current Total:
            </Text>
            <Text
              style={[
                styles.growthDetailValue,
                { color: theme.primary, fontWeight: "700" },
              ]}
            >
              {getTotalValue()} {getUnit()}
            </Text>
          </View>

          <View style={styles.growthDetailRow}>
            <Text
              style={[styles.growthDetailLabel, { color: theme.textSecondary }]}
            >
              Remaining (This Month):
            </Text>
            <Text style={[styles.growthDetailValue, { color: theme.primary }]}>
              {getRemainingGrowth()} {getUnit()}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: `${theme.textSecondary}20` },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: getProgressColor(),
                  width: `${getSmoothProgress()}%`,
                },
              ]}
            />
          </View>

          <View style={styles.progressBarLabels}>
            <Text
              style={[styles.progressBarStart, { color: theme.textSecondary }]}
            >
              0%
            </Text>
            <Text
              style={[styles.progressBarMiddle, { color: theme.textSecondary }]}
            >
              50%
            </Text>
            <Text
              style={[styles.progressBarEnd, { color: theme.textSecondary }]}
            >
              100%
            </Text>
          </View>
        </View>

        {/* Growth Status */}
        <View
          style={[
            styles.growthStatus,
            { backgroundColor: getProgressColor() + "20" },
          ]}
        >
          <Ionicons
            name={
              getSmoothProgress() >= 100
                ? "checkmark-circle"
                : getSmoothProgress() >= 85
                ? "trending-up"
                : "information-circle"
            }
            size={16}
            color={getProgressColor()}
          />
          <Text
            style={[styles.growthStatusText, { color: getProgressColor() }]}
          >
            {getGrowthStatusText()}
          </Text>
        </View>
      </View>

      {/* Recommendation */}
      <View
        style={[
          styles.recommendationContainer,
          { borderTopColor: `${theme.textSecondary}20` },
        ]}
      >
        <Text
          style={[styles.recommendationLabel, { color: theme.textSecondary }]}
        >
          WHO Recommended Monthly{" "}
          {activeChartTab === "weight"
            ? "Weight"
            : activeChartTab === "height"
            ? "Height"
            : "Head Circ."}{" "}
          Gain:
        </Text>
        <Text style={[styles.recommendationValue, { color: theme.text }]}>
          {activeChartTab === "weight"
            ? `${targetWeight} g/month`
            : activeChartTab === "height"
            ? `${targetHeight} mm/month`
            : `${targetHeadCirc} mm/month`}
        </Text>
      </View>
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
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  chartTabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    padding: 4,
  },
  chartTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  chartTabIcon: {
    marginRight: 6,
  },
  chartTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  lineChartContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  lineChart: {
    borderRadius: 16,
  },
  growthStatsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  growthStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  growthStatItem: {
    flex: 1,
    alignItems: "center",
  },
  growthStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  growthStatLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  growthStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  growthDetailsContainer: {
    marginBottom: 16,
  },
  growthDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  growthDetailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  growthDetailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  progressBarStart: {
    fontSize: 12,
  },
  progressBarMiddle: {
    fontSize: 12,
  },
  progressBarEnd: {
    fontSize: 12,
  },
  growthStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "center",
  },
  growthStatusText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  recommendationContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: "center",
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GrowthCharts;
