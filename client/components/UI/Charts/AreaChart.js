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
  getBarChartData,
  getHeightChartData,
  getHeadCircChartData,
  onProgressCalculated,
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
  const mmToCm = (mm) => {
    if (!mm) return 0;
    return Math.round(mm / 10);
  };

  const getBirthValue = (type) => {
    switch (type) {
      case "weight":
        return Number.parseFloat(birthWeight) || 3000;
      case "height":
        return mmToCm(Number.parseFloat(birthHeight)) || 50;
      case "headCirc":
        return mmToCm(Number.parseFloat(birthHeadCirc)) || 35;
      default:
        return 3000;
    }
  };

  const getAdditionalValue = (type) => {
    switch (type) {
      case "weight":
        return Number.parseFloat(currentWeight) || 0;
      case "height":
        return mmToCm(Number.parseFloat(currentHeight)) || 0;
      case "headCirc":
        return mmToCm(Number.parseFloat(currentHeadCirc)) || 0;
      default:
        return 0;
    }
  };

  const getTotalValue = (type) => {
    const birth = getBirthValue(type);
    const additional = getAdditionalValue(type);
    return birth + additional;
  };

  const getTargetValue = (type) => {
    switch (type) {
      case "weight":
        return Math.round(targetWeight);
      case "height":
        return Math.round(mmToCm(targetHeight));
      case "headCirc":
        return Math.round(mmToCm(targetHeadCirc));
      default:
        return Math.round(targetWeight);
    }
  };

  const getTotalTargetValue = (type) => {
    const birth = getBirthValue(type);
    const target = getTargetValue(type);
    return birth + target;
  };

  const getSmoothProgress = (type) => {
    const birth = getBirthValue(type);
    const additional = getAdditionalValue(type);
    const totalTarget = getTotalTargetValue(type);

    if (birth >= totalTarget) return 100;

    const totalGrowthNeeded = totalTarget - birth;
    const actualGrowth = additional;
    const percentage = Math.min(
      Math.round((actualGrowth / totalGrowthNeeded) * 100),
      100
    );

    return Math.max(percentage, 0);
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
  ]);

  useEffect(() => {
    if (onProgressCalculated) {
      onProgressCalculated(calculateProgressValues);
    }
  }, [calculateProgressValues, onProgressCalculated]);

  const createCustomChartData = (type) => {
    let baseData;

    switch (type) {
      case "weight":
        baseData = getBarChartData();
        break;
      case "height":
        baseData = getHeightChartData();
        break;
      case "headCirc":
        baseData = getHeadCircChartData();
        break;
      default:
        baseData = getBarChartData();
    }

    if (!baseData.datasets || !baseData.datasets[0]) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            color: () => "rgba(0,0,0,0)",
          },
        ],
        yMax: 100,
      };
    }

    const birthValue = getBirthValue(type);
    const totalValue = getTotalValue(type);
    const targetValue = getTotalTargetValue(type);
    const hasPreviousRecord =
      baseData.labels && baseData.labels.includes("Previous");

    const maxValue = Math.max(birthValue, totalValue, targetValue) * 1.1;

    if (hasPreviousRecord) {
      let previousValue;

      switch (type) {
        case "weight":
          previousValue = baseData.datasets[0].data[1];
          break;
        case "height":
          previousValue = mmToCm(getHeightChartData().datasets[0].data[1]);
          break;
        case "headCirc":
          previousValue = mmToCm(getHeadCircChartData().datasets[0].data[1]);
          break;
        default:
          previousValue = 0;
      }

      return {
        labels: ["Birth", "Prev", "Now", "Target"],
        datasets: [
          {
            data: [birthValue, previousValue, totalValue, targetValue],
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
      };
    } else {
      return {
        labels: ["Birth", "Now", "Target"],
        datasets: [
          {
            data: [birthValue, totalValue, targetValue],
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
      };
    }
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
      yAxisMin: getBirthValue(type) * 0.95,
      yAxisMax: createCustomChartData(type).yMax,
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
              bezier
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
              {getTotalValue(type)}
              {getUnit(type)}
            </Text>
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
});

export default AreaCharts;
