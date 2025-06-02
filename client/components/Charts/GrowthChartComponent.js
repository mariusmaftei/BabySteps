import { useState, useEffect, useCallback } from "react";
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
import {
  getGrowthRecords,
  getLatestGrowthRecord,
} from "../../services/growth-service";
import { useChildActivity } from "../../context/child-activity-context";
import { WHO_STANDARDS } from "../../utils/growth-utils";

const screenWidth = Dimensions.get("window").width;

const GrowthChartComponent = ({ theme }) => {
  const { currentChild } = useChildActivity();
  const [activeTab, setActiveTab] = useState("weight");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);

  const birthWeight = currentChild?.birthWeight || currentChild?.weight || 0;
  const birthHeight = currentChild?.birthHeight || currentChild?.height || 0;
  const birthHeadCirc =
    currentChild?.birthHeadCircumference ||
    currentChild?.headCircumference ||
    0;

  const colors = {
    weight: "#5a87ff",
    height: "#ff9500",
    head: "#ff2d55",
  };

  useEffect(() => {
    const fetchGrowthData = async () => {
      if (!currentChild || !currentChild.id) {
        console.log("No current child in context");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Fetching growth records for child ${currentChild.id}`);

        const records = await getGrowthRecords(currentChild.id);
        console.log(`Fetched ${records.length} growth records`);

        const sortedRecords = [...records].sort((a, b) => {
          return (
            new Date(a.recordDate || a.date || a.createdAt) -
            new Date(b.recordDate || b.date || b.createdAt)
          );
        });

        setGrowthRecords(sortedRecords);

        try {
          const latest = await getLatestGrowthRecord(currentChild.id);
          setLatestRecord(latest);
          console.log("Latest growth record:", latest);
        } catch (err) {
          console.log("No latest growth record found");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching growth records:", err);
        setError("Failed to load growth records");
        setLoading(false);
      }
    };

    fetchGrowthData();
  }, [currentChild]);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A";
    return Number(Number.parseFloat(num).toFixed(2));
  };

  const getChartData = useCallback(() => {
    let birthValue = 0;
    if (activeTab === "weight") {
      birthValue = Number(birthWeight) || 0;
    } else if (activeTab === "height") {
      birthValue = Number(birthHeight) || 0;
    } else if (activeTab === "head") {
      birthValue = Number(birthHeadCirc) || 0;
    }

    let currentValue = 0;
    let currentDate = "Current";

    if (latestRecord) {
      currentDate = formatDate(
        latestRecord.recordDate || latestRecord.date || latestRecord.createdAt
      );
      if (activeTab === "weight") {
        currentValue = birthValue + Number(latestRecord.weight) || 0;
      } else if (activeTab === "height") {
        currentValue = birthValue + Number(latestRecord.height) || 0;
      } else if (activeTab === "head") {
        currentValue =
          birthValue +
            Number(latestRecord.headCircumference || latestRecord.headCirc) ||
          0;
      }
    } else if (growthRecords.length > 0) {
      const latest = growthRecords[growthRecords.length - 1];
      currentDate = formatDate(
        latest.recordDate || latest.date || latest.createdAt
      );
      if (activeTab === "weight") {
        currentValue = birthValue + Number(latest.weight) || 0;
      } else if (activeTab === "height") {
        currentValue = birthValue + Number(latest.height) || 0;
      } else if (activeTab === "head") {
        currentValue =
          birthValue + Number(latest.headCircumference || latest.headCirc) || 0;
      }
    } else {
      if (activeTab === "weight") {
        currentValue = birthValue + 200;
      } else if (activeTab === "height") {
        currentValue = birthValue + 5;
      } else if (activeTab === "head") {
        currentValue = birthValue + 2;
      }
    }

    const chartData = {
      labels: ["Birth", currentDate],
      datasets: [
        {
          data: [birthValue, currentValue],
          color: (opacity = 1) => `rgba(${getColorRGB(activeTab)}, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    console.log(`SIMPLIFIED Chart data for ${activeTab}:`, chartData);
    return chartData;
  }, [
    activeTab,
    birthWeight,
    birthHeight,
    birthHeadCirc,
    latestRecord,
    growthRecords,
  ]);

  const getColorRGB = (type) => {
    switch (type) {
      case "weight":
        return "90, 135, 255";
      case "height":
        return "255, 149, 0";
      case "head":
        return "255, 45, 85";
      default:
        return "90, 135, 255";
    }
  };

  const getUnit = () => {
    switch (activeTab) {
      case "weight":
        return "g";
      case "height":
        return "cm";
      case "head":
        return "cm";
      default:
        return "";
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case "weight":
        return "Weight";
      case "height":
        return "Height";
      case "head":
        return "Head Circumference";
      default:
        return "";
    }
  };

  const getWHOOneYearStandard = () => {
    const gender = currentChild?.gender || "male";
    const standards =
      gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

    const oneYearStandard = standards.find((standard) => standard.age === 12);

    if (!oneYearStandard) return null;

    return {
      weight: oneYearStandard.weight * 1000,
      height: oneYearStandard.height,
      headCirc: oneYearStandard.headCirc,
    };
  };

  const calculateWHOProgress = () => {
    const whoOneYearStandard = getWHOOneYearStandard();
    if (!whoOneYearStandard)
      return { percentage: 0, currentTotal: 0, whoTarget: 0 };

    let birthValue = 0;
    if (activeTab === "weight") {
      birthValue = Number(birthWeight) || 0;
    } else if (activeTab === "height") {
      birthValue = Number(birthHeight) || 0;
    } else if (activeTab === "head") {
      birthValue = Number(birthHeadCirc) || 0;
    }

    let currentGain = 0;
    if (latestRecord) {
      if (activeTab === "weight") {
        currentGain = Number(latestRecord.weight) || 0;
      } else if (activeTab === "height") {
        currentGain = Number(latestRecord.height) || 0;
      } else if (activeTab === "head") {
        currentGain =
          Number(latestRecord.headCircumference || latestRecord.headCirc) || 0;
      }
    } else if (growthRecords.length > 0) {
      const latest = growthRecords[growthRecords.length - 1];
      if (activeTab === "weight") {
        currentGain = Number(latest.weight) || 0;
      } else if (activeTab === "height") {
        currentGain = Number(latest.height) || 0;
      } else if (activeTab === "head") {
        currentGain = Number(latest.headCircumference || latest.headCirc) || 0;
      }
    } else {
      if (activeTab === "weight") {
        currentGain = 200;
      } else if (activeTab === "height") {
        currentGain = 5;
      } else if (activeTab === "head") {
        currentGain = 2;
      }
    }

    const currentTotal = birthValue + currentGain;

    let whoTarget = 0;
    if (activeTab === "weight") {
      whoTarget = whoOneYearStandard.weight;
    } else if (activeTab === "height") {
      whoTarget = whoOneYearStandard.height;
    } else if (activeTab === "head") {
      whoTarget = whoOneYearStandard.headCirc;
    }

    const expectedGrowth = whoTarget - birthValue;
    const actualGrowth = currentTotal - birthValue;
    const percentage =
      expectedGrowth > 0
        ? Math.min(100, Math.max(0, (actualGrowth / expectedGrowth) * 100))
        : 0;

    return {
      percentage: Math.round(percentage),
      currentTotal: formatNumber(currentTotal),
      whoTarget: formatNumber(whoTarget),
      birthValue: formatNumber(birthValue),
      expectedGrowth: formatNumber(expectedGrowth),
      actualGrowth: formatNumber(actualGrowth),
    };
  };

  const renderTabs = () => (
    <View style={styles.tabSelectorContainer}>
      <TouchableOpacity
        onPress={() =>
          setActiveTab(
            activeTab === "weight"
              ? "head"
              : activeTab === "height"
              ? "weight"
              : "height"
          )
        }
        style={styles.tabNavButton}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text || "#333"} />
      </TouchableOpacity>

      <Text style={[styles.tabSelectorText, { color: colors[activeTab] }]}>
        {activeTab === "weight"
          ? "Weight"
          : activeTab === "height"
          ? "Height"
          : "Head Circumference"}
      </Text>

      <TouchableOpacity
        onPress={() =>
          setActiveTab(
            activeTab === "weight"
              ? "height"
              : activeTab === "height"
              ? "head"
              : "weight"
          )
        }
        style={styles.tabNavButton}
      >
        <Ionicons
          name="chevron-forward"
          size={24}
          color={theme.text || "#333"}
        />
      </TouchableOpacity>
    </View>
  );

  const renderProgressBar = () => {
    const whoProgress = calculateWHOProgress();
    const color = colors[activeTab];

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{getTitle()} Growth Progress</Text>

        <View style={styles.progressStats}>
          <Text style={styles.progressStatsText}>
            Progress toward WHO 1-year milestone:{" "}
            <Text style={{ color, fontWeight: "bold" }}>
              {whoProgress.percentage}%
            </Text>
          </Text>
        </View>

        <View style={styles.milestoneProgressContainer}>
          <View style={styles.milestoneMarker}>
            <Text style={styles.milestoneValue}>
              {whoProgress.birthValue} {getUnit()}
            </Text>
            <Text style={styles.milestoneLabel}>Birth</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${whoProgress.percentage}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.milestoneMarker}>
            <Text style={styles.milestoneValue}>
              {whoProgress.whoTarget} {getUnit()}
            </Text>
            <Text style={styles.milestoneLabel}>WHO 1-Year</Text>
          </View>
        </View>

        <View style={styles.currentProgressIndicator}>
          <View
            style={[
              styles.currentMarker,
              {
                left: `${whoProgress.percentage}%`,
                backgroundColor: color,
              },
            ]}
          >
            <Text style={styles.currentMarkerText}>
              {whoProgress.currentTotal} {getUnit()}
            </Text>
          </View>
        </View>

        <View style={styles.milestoneSectionDivider} />
        <Text style={styles.milestoneTitle}>Growth Milestone Details</Text>

        <View style={styles.milestoneDetailRow}>
          <View style={styles.milestoneDetailItem}>
            <Text style={styles.milestoneDetailLabel}>Expected Growth</Text>
            <Text style={[styles.milestoneDetailValue, { color }]}>
              {whoProgress.expectedGrowth} {getUnit()}
            </Text>
            <Text style={styles.milestoneDetailSubtext}>Birth to 1 Year</Text>
          </View>

          <View style={styles.milestoneDetailItem}>
            <Text style={styles.milestoneDetailLabel}>Current Growth</Text>
            <Text style={[styles.milestoneDetailValue, { color }]}>
              {whoProgress.actualGrowth} {getUnit()}
            </Text>
            <Text style={styles.milestoneDetailSubtext}>Birth to Now</Text>
          </View>

          <View style={styles.milestoneDetailItem}>
            <Text style={styles.milestoneDetailLabel}>Progress</Text>
            <Text style={[styles.milestoneDetailValue, { color }]}>
              {whoProgress.percentage}%
            </Text>
            <Text style={styles.milestoneDetailSubtext}>Toward WHO Target</Text>
          </View>
        </View>

        <Text style={styles.milestoneNote}>
          According to WHO standards, the average{" "}
          {currentChild?.gender === "female" ? "girl" : "boy"} should grow from{" "}
          {whoProgress.birthValue} to {whoProgress.whoTarget} {getUnit()} in the
          first year.
        </Text>

        <View style={styles.divider} />
      </View>
    );
  };

  const renderChart = () => {
    const chartData = getChartData();
    const chartConfig = {
      backgroundColor: theme.cardBackground || "white",
      backgroundGradientFrom: theme.cardBackground || "white",
      backgroundGradientTo: theme.cardBackground || "white",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(${getColorRGB(activeTab)}, ${opacity})`,
      labelColor: (opacity = 1) => theme.text || "#333",
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: colors[activeTab],
      },
      propsForLabels: {
        fontSize: 10,
      },
    };

    let birthValue = 0;
    if (activeTab === "weight") {
      birthValue = Number(birthWeight) || 0;
    } else if (activeTab === "height") {
      birthValue = Number(birthHeight) || 0;
    } else if (activeTab === "head") {
      birthValue = Number(birthHeadCirc) || 0;
    }

    let currentGain = 0;
    let currentDate = "Current";

    if (latestRecord) {
      currentDate = formatDate(
        latestRecord.recordDate || latestRecord.date || latestRecord.createdAt
      );
      if (activeTab === "weight") {
        currentGain = Number(latestRecord.weight) || 0;
      } else if (activeTab === "height") {
        currentGain = Number(latestRecord.height) || 0;
      } else if (activeTab === "head") {
        currentGain =
          Number(latestRecord.headCircumference || latestRecord.headCirc) || 0;
      }
    } else if (growthRecords.length > 0) {
      const latest = growthRecords[growthRecords.length - 1];
      currentDate = formatDate(
        latest.recordDate || latest.date || latest.createdAt
      );
      if (activeTab === "weight") {
        currentGain = Number(latest.weight) || 0;
      } else if (activeTab === "height") {
        currentGain = Number(latest.height) || 0;
      } else if (activeTab === "head") {
        currentGain = Number(latest.headCircumference || latest.headCirc) || 0;
      }
    } else {
      if (activeTab === "weight") {
        currentGain = 200;
      } else if (activeTab === "height") {
        currentGain = 5;
      } else if (activeTab === "head") {
        currentGain = 2;
      }
    }

    const currentTotal = birthValue + currentGain;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{getTitle()} Growth Chart</Text>
        <View style={styles.chartExplanation}>
          <Text style={styles.chartExplanationText}>
            Left side: Birth measurement ({birthValue} {getUnit()})
          </Text>
          <Text style={styles.chartExplanationText}>
            Right side: Current total ({birthValue} + {currentGain} ={" "}
            {currentTotal} {getUnit()})
          </Text>
        </View>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisSuffix={` ${getUnit()}`}
          fromZero={false}
        />
        <View style={styles.divider} />
      </View>
    );
  };

  const renderSummary = () => {
    if (growthRecords.length === 0 && !latestRecord) {
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Growth Summary</Text>
          <Text style={styles.noDataText}>No growth records available yet</Text>
          <Text style={styles.birthMeasurementsNote}>
            Birth measurements: Weight: {birthWeight || "N/A"}g, Height:{" "}
            {birthHeight || "N/A"}cm, Head: {birthHeadCirc || "N/A"}cm
          </Text>
          <View style={styles.divider} />
        </View>
      );
    }

    const records = [...growthRecords];

    if (latestRecord && !growthRecords.some((r) => r.id === latestRecord.id)) {
      records.push(latestRecord);
    }

    const sortedRecords = [...records].sort((a, b) => {
      return (
        new Date(b.recordDate || b.date || b.createdAt) -
        new Date(a.recordDate || a.date || a.createdAt)
      );
    });

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Growth Summary</Text>

        <Text style={styles.birthMeasurementsNote}>
          Birth measurements: Weight: {birthWeight || "N/A"}g, Height:{" "}
          {birthHeight || "N/A"}cm, Head: {birthHeadCirc || "N/A"}cm
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date</Text>
          <Text style={styles.tableHeaderCell}>Weight</Text>
          <Text style={styles.tableHeaderCell}>Height</Text>
          <Text style={styles.tableHeaderCell}>Head</Text>
        </View>

        <View style={styles.tableBody}>
          {sortedRecords.map((record, index) => (
            <View key={index}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {formatDate(
                    record.recordDate || record.date || record.createdAt
                  )}
                </Text>

                <View style={styles.tableCell}>
                  <View style={styles.cellWithIcon}>
                    <Ionicons
                      name="scale-outline"
                      size={14}
                      color={colors.weight}
                      style={styles.cellIcon}
                    />
                    <Text style={styles.cellValue}>
                      {record.weight || "N/A"} g
                    </Text>
                  </View>
                </View>

                <View style={styles.tableCell}>
                  <View style={styles.cellWithIcon}>
                    <Ionicons
                      name="resize-outline"
                      size={14}
                      color={colors.height}
                      style={styles.cellIcon}
                    />
                    <Text style={styles.cellValue}>
                      {record.height || "N/A"} cm
                    </Text>
                  </View>
                </View>

                <View style={styles.tableCell}>
                  <View style={styles.cellWithIcon}>
                    <Ionicons
                      name="ellipse-outline"
                      size={14}
                      color={colors.head}
                      style={styles.cellIcon}
                    />
                    <Text style={styles.cellValue}>
                      {record.headCircumference || record.headCirc || "N/A"} cm
                    </Text>
                  </View>
                </View>
              </View>
              {index < sortedRecords.length - 1 && (
                <View style={styles.rowDivider} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.divider} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary || "#5a87ff"} />
        <Text style={styles.loadingText}>Loading growth data...</Text>
      </View>
    );
  }

  if (!currentChild || !currentChild.id) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={40} color={theme.danger || "red"} />
        <Text style={styles.errorText}>No child selected in the context</Text>
        <Text style={styles.errorSubtext}>Please select a child first</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={40} color={theme.danger || "red"} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderTabs()}
      {renderChart()}
      {renderProgressBar()}
      {renderSummary()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  tabSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tabNavButton: {
    padding: 5,
  },
  tabSelectorText: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginTop: 20,
  },
  milestoneSectionDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginTop: 20,
    marginBottom: 20,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  measurementsCompare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measurementBox: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  measurementBoxLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  measurementBoxValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  measurementArrow: {
    flex: 1,
    alignItems: "center",
  },
  measurementGain: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  chartExplanation: {
    marginBottom: 16,
    alignItems: "center",
  },
  chartExplanationText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  chart: {
    borderRadius: 16,
  },
  dataPointLabel: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dataPointText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  noDataContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  progressStats: {
    marginBottom: 12,
    alignItems: "center",
  },
  progressStatsText: {
    fontSize: 14,
    textAlign: "center",
  },
  progressBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  progressBarBackground: {
    width: "100%",
    height: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  birthMeasurementsNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  tableBody: {
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  tableCell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  cellWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cellIcon: {
    marginRight: 4,
  },
  cellValue: {
    fontWeight: "500",
    fontSize: 14,
    color: "#333",
  },
  milestoneProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  milestoneMarker: {
    alignItems: "center",
    width: 70,
  },
  milestoneValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  milestoneLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  currentProgressIndicator: {
    position: "relative",
    height: 30,
    marginBottom: 20,
  },
  currentMarker: {
    position: "absolute",
    top: -15,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    transform: [{ translateY: 0 }],
  },
  currentMarkerText: {
    position: "absolute",
    top: 10,
    left: -20,
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    width: 50,
    textAlign: "center",
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  milestoneDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  milestoneDetailItem: {
    flex: 1,
    alignItems: "center",
  },
  milestoneDetailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  milestoneDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  milestoneDetailSubtext: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    textAlign: "center",
  },
  milestoneNote: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default GrowthChartComponent;
