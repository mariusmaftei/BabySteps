import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BirthDataCard = ({
  theme,
  childAgeInMonths,
  birthWeight,
  birthHeight,
  birthHeadCirc,
  childGender,
  recommendations,
  childName,
  birthDate,
}) => {
  // Add more detailed debugging at the top of the component
  console.log("BirthDataCard RENDER with props:", {
    birthWeight: birthWeight,
    birthHeight: birthHeight,
    birthHeadCirc: birthHeadCirc,
    childGender: childGender,
    childName: childName,
  });

  // Calculate percentage difference from WHO average
  const calculatePercentage = (actual, average) => {
    if (!actual || !average) return null;

    // Convert string values to numbers if needed
    const actualNum =
      typeof actual === "string" ? Number.parseFloat(actual) : actual;
    const averageNum =
      typeof average === "string"
        ? Number.parseFloat(average.replace(/,/g, ""))
        : average;

    if (isNaN(actualNum) || isNaN(averageNum) || averageNum === 0) return null;

    // Calculate percentage difference
    const percentDiff = ((actualNum - averageNum) / averageNum) * 100;
    return percentDiff.toFixed(1);
  };

  // WHO averages based on gender
  const whoAverages = {
    weight: childGender === "male" ? 3300 : 3200,
    height: childGender === "male" ? 49.9 : 49.1,
    headCirc: childGender === "male" ? 34.5 : 33.9,
  };

  // Calculate percentages
  const weightPercentage = calculatePercentage(birthWeight, whoAverages.weight);
  const heightPercentage = calculatePercentage(birthHeight, whoAverages.height);
  const headCircPercentage = calculatePercentage(
    birthHeadCirc,
    whoAverages.headCirc
  );

  // Helper function to get color based on percentage
  const getComparisonColor = (percentage) => {
    if (!percentage) return theme.textSecondary;
    const value = Number.parseFloat(percentage);
    if (value > 15) return "#FF3B30"; // Significantly above average
    if (value > 5) return "#FF9500"; // Above average
    if (value < -15) return "#FF3B30"; // Significantly below average
    if (value < -5) return "#FF9500"; // Below average
    return "#34C759"; // Within normal range
  };

  // Helper function to get comparison text
  const getComparisonText = (percentage) => {
    if (!percentage) return "";
    const value = Number.parseFloat(percentage);
    if (value > 0) return `${percentage}% above avg`;
    if (value < 0) return `${Math.abs(value)}% below avg`;
    return "At average";
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.headerRow}>
        <Ionicons
          name="information-circle"
          size={22}
          color={theme.primary}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Birth Measurements
        </Text>
      </View>

      <View style={styles.dataSection}>
        <View style={styles.measurementRow}>
          {/* Weight */}
          <View
            style={[styles.measurementItem, { borderColor: theme.borderLight }]}
          >
            <View style={styles.measurementHeader}>
              <View style={styles.iconLabelContainer}>
                <Ionicons
                  name="fitness"
                  size={18}
                  color="#5A87FF"
                  style={styles.dataIcon}
                />
                <Text style={[styles.measurementTitle, { color: theme.text }]}>
                  Weight
                </Text>
              </View>
              {weightPercentage && (
                <View
                  style={[
                    styles.percentageContainer,
                    {
                      backgroundColor: `${getComparisonColor(
                        weightPercentage
                      )}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.percentageText,
                      { color: getComparisonColor(weightPercentage) },
                    ]}
                  >
                    {getComparisonText(weightPercentage)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.measurementContent}>
              <View style={styles.actualMeasurement}>
                <Text
                  style={[styles.dataLabel, { color: theme.textSecondary }]}
                >
                  Your child:
                </Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>
                  {birthWeight ? `${birthWeight}g` : "Not recorded"}
                </Text>
              </View>

              <View style={styles.idealMeasurement}>
                <Text
                  style={[styles.idealLabel, { color: theme.textSecondary }]}
                >
                  WHO Standard:
                </Text>
                <Text style={[styles.idealValue, { color: theme.text }]}>
                  {childGender === "male" ? "3300g (avg)" : "3200g (avg)"}
                </Text>
                <Text
                  style={[styles.idealRange, { color: theme.textSecondary }]}
                >
                  {childGender === "male"
                    ? "Range: 2500 – 4600g"
                    : "Range: 2400 – 4200g"}
                </Text>
              </View>
            </View>
          </View>

          {/* Height */}
          <View
            style={[styles.measurementItem, { borderColor: theme.borderLight }]}
          >
            <View style={styles.measurementHeader}>
              <View style={styles.iconLabelContainer}>
                <Ionicons
                  name="resize"
                  size={18}
                  color="#FF9500"
                  style={styles.dataIcon}
                />
                <Text style={[styles.measurementTitle, { color: theme.text }]}>
                  Height
                </Text>
              </View>
              {heightPercentage && (
                <View
                  style={[
                    styles.percentageContainer,
                    {
                      backgroundColor: `${getComparisonColor(
                        heightPercentage
                      )}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.percentageText,
                      { color: getComparisonColor(heightPercentage) },
                    ]}
                  >
                    {getComparisonText(heightPercentage)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.measurementContent}>
              <View style={styles.actualMeasurement}>
                <Text
                  style={[styles.dataLabel, { color: theme.textSecondary }]}
                >
                  Your child:
                </Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>
                  {birthHeight ? `${birthHeight}cm` : "Not recorded"}
                </Text>
              </View>

              <View style={styles.idealMeasurement}>
                <Text
                  style={[styles.idealLabel, { color: theme.textSecondary }]}
                >
                  WHO Standard:
                </Text>
                <Text style={[styles.idealValue, { color: theme.text }]}>
                  {childGender === "male" ? "50cm (avg)" : "49cm (avg)"}
                </Text>
                <Text
                  style={[styles.idealRange, { color: theme.textSecondary }]}
                >
                  {childGender === "male"
                    ? "Range: 46 – 54cm"
                    : "Range: 45 – 53cm"}
                </Text>
              </View>
            </View>
          </View>

          {/* Head Circumference */}
          <View
            style={[
              styles.measurementItem,
              {
                borderColor: theme.borderLight,
                marginBottom: 0,
                borderBottomWidth: 0,
              },
            ]}
          >
            <View style={styles.measurementHeader}>
              <View style={styles.iconLabelContainer}>
                <Ionicons
                  name="ellipse-outline"
                  size={18}
                  color="#FF2D55"
                  style={styles.dataIcon}
                />
                <Text style={[styles.measurementTitle, { color: theme.text }]}>
                  Head Circumference
                </Text>
              </View>
              {headCircPercentage && (
                <View
                  style={[
                    styles.percentageContainer,
                    {
                      backgroundColor: `${getComparisonColor(
                        headCircPercentage
                      )}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.percentageText,
                      { color: getComparisonColor(headCircPercentage) },
                    ]}
                  >
                    {getComparisonText(headCircPercentage)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.measurementContent}>
              <View style={styles.actualMeasurement}>
                <Text
                  style={[styles.dataLabel, { color: theme.textSecondary }]}
                >
                  Your child:
                </Text>
                <Text style={[styles.dataValue, { color: theme.text }]}>
                  {birthHeadCirc ? `${birthHeadCirc}cm` : "Not recorded"}
                </Text>
              </View>

              <View style={styles.idealMeasurement}>
                <Text
                  style={[styles.idealLabel, { color: theme.textSecondary }]}
                >
                  WHO Standard:
                </Text>
                <Text style={[styles.idealValue, { color: theme.text }]}>
                  {childGender === "male" ? "35cm (avg)" : "34cm (avg)"}
                </Text>
                <Text
                  style={[styles.idealRange, { color: theme.textSecondary }]}
                >
                  {childGender === "male"
                    ? "Range: 32 – 37cm"
                    : "Range: 32 – 36cm"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.whoNote, { color: theme.textSecondary }]}>
        WHO growth standards help track if your child is growing at a healthy
        rate. These standards are based on data from healthy children from
        diverse ethnic backgrounds and cultural settings.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 12,
  },
  dataSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  measurementRow: {
    width: "100%",
  },
  measurementItem: {
    marginBottom: 12,
    width: "100%",
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  measurementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  measurementTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  percentageContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "600",
  },
  measurementContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actualMeasurement: {
    flex: 1,
  },
  idealMeasurement: {
    flex: 1,
    alignItems: "flex-end",
  },
  dataIcon: {
    marginRight: 6,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  idealLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  idealValue: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  idealRange: {
    fontSize: 11,
    fontStyle: "italic",
  },
  ageSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  birthDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  ageGroupContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  ageIcon: {
    marginRight: 10,
  },
  ageTextContainer: {
    flex: 1,
  },
  ageLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  ageValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  whoNote: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
  },
});

export default BirthDataCard;
