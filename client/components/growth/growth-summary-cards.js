import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GrowthSummaryCards = ({
  theme,
  isWeightGainSufficient,
  isHeightGainSufficient,
  isHeadCircGainSufficient,
  weightGain,
  heightGain,
  headCircGain,
  recommendations,
  weightGainPercentage,
  heightGainPercentage,
  headCircGainPercentage,
  weightDiffPercentage,
  heightDiffPercentage,
  headDiffPercentage,
  formatPercentageText,
}) => {
  return (
    <View
      style={[
        styles.summaryContainer,
        { backgroundColor: theme.cardBackground },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Growth Summary
      </Text>

      {/* Weight Gain Summary */}
      <View
        style={[
          styles.growthSummaryCard,
          {
            borderColor: isWeightGainSufficient ? theme.success : theme.danger,
          },
        ]}
      >
        <View style={styles.growthSummaryHeader}>
          <Ionicons
            name="fitness"
            size={20}
            color="#5A87FF"
            style={styles.growthSummaryIcon}
          />
          <Text style={[styles.growthSummaryTitle, { color: theme.text }]}>
            Weight Gain
          </Text>
          <Text
            style={[
              styles.growthSummaryValue,
              {
                color: isWeightGainSufficient ? theme.success : theme.danger,
              },
            ]}
          >
            {weightGain} g/week
          </Text>
        </View>

        <Text
          style={[
            styles.growthSummaryRecommended,
            { color: theme.textSecondary },
          ]}
        >
          WHO Recommended: {recommendations.weightGainPerWeek}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text
              style={[styles.progressLabel, { color: theme.textSecondary }]}
            >
              Progress toward WHO minimum:
            </Text>
            <Text
              style={[
                styles.progressPercentage,
                {
                  color: isWeightGainSufficient ? theme.success : theme.danger,
                },
              ]}
            >
              {weightGainPercentage}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBarContainer,
              { backgroundColor: `${theme.danger}30` },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${weightGainPercentage}%`,
                  backgroundColor: isWeightGainSufficient
                    ? theme.success
                    : theme.danger,
                },
              ]}
            />
          </View>
        </View>

        {/* Difference from recommended */}
        <View style={styles.diffContainer}>
          <Text style={[styles.diffLabel, { color: theme.textSecondary }]}>
            Compared to WHO minimum ({recommendations.minWeightGain} g):
          </Text>
          <Text
            style={[
              styles.diffValue,
              {
                color: weightDiffPercentage >= 0 ? theme.success : theme.danger,
              },
            ]}
          >
            {formatPercentageText(weightDiffPercentage)}
          </Text>
        </View>
      </View>

      {/* Height Gain Summary */}
      <View
        style={[
          styles.growthSummaryCard,
          {
            borderColor: isHeightGainSufficient ? theme.success : theme.danger,
          },
        ]}
      >
        <View style={styles.growthSummaryHeader}>
          <Ionicons
            name="resize"
            size={20}
            color="#FF9500"
            style={styles.growthSummaryIcon}
          />
          <Text style={[styles.growthSummaryTitle, { color: theme.text }]}>
            Height Gain
          </Text>
          <Text
            style={[
              styles.growthSummaryValue,
              {
                color: isHeightGainSufficient ? theme.success : theme.danger,
              },
            ]}
          >
            {heightGain} mm/week
          </Text>
        </View>

        <Text
          style={[
            styles.growthSummaryRecommended,
            { color: theme.textSecondary },
          ]}
        >
          WHO Recommended: {recommendations.minHeightGain}-
          {recommendations.maxHeightGain} mm/week
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text
              style={[styles.progressLabel, { color: theme.textSecondary }]}
            >
              Progress toward WHO minimum:
            </Text>
            <Text
              style={[
                styles.progressPercentage,
                {
                  color: isHeightGainSufficient ? theme.success : theme.danger,
                },
              ]}
            >
              {heightGainPercentage}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBarContainer,
              { backgroundColor: `${theme.danger}30` },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${heightGainPercentage}%`,
                  backgroundColor: isHeightGainSufficient
                    ? theme.success
                    : theme.danger,
                },
              ]}
            />
          </View>
        </View>

        {/* Difference from recommended */}
        <View style={styles.diffContainer}>
          <Text style={[styles.diffLabel, { color: theme.textSecondary }]}>
            Compared to WHO minimum ({recommendations.minHeightGain} mm):
          </Text>
          <Text
            style={[
              styles.diffValue,
              {
                color: heightDiffPercentage >= 0 ? theme.success : theme.danger,
              },
            ]}
          >
            {formatPercentageText(heightDiffPercentage)}
          </Text>
        </View>
      </View>

      {/* Head Circumference Gain Summary */}
      <View
        style={[
          styles.growthSummaryCard,
          {
            borderColor: isHeadCircGainSufficient
              ? theme.success
              : theme.danger,
          },
        ]}
      >
        <View style={styles.growthSummaryHeader}>
          <Ionicons
            name="ellipse-outline"
            size={20}
            color="#FF2D55"
            style={styles.growthSummaryIcon}
          />
          <Text style={[styles.growthSummaryTitle, { color: theme.text }]}>
            Head Circumference Gain
          </Text>
          <Text
            style={[
              styles.growthSummaryValue,
              {
                color: isHeadCircGainSufficient ? theme.success : theme.danger,
              },
            ]}
          >
            {headCircGain} mm/week
          </Text>
        </View>

        <Text
          style={[
            styles.growthSummaryRecommended,
            { color: theme.textSecondary },
          ]}
        >
          WHO Recommended: {recommendations.minHeadCircGain}-
          {recommendations.maxHeadCircGain} mm/week
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text
              style={[styles.progressLabel, { color: theme.textSecondary }]}
            >
              Progress toward WHO minimum:
            </Text>
            <Text
              style={[
                styles.progressPercentage,
                {
                  color: isHeadCircGainSufficient
                    ? theme.success
                    : theme.danger,
                },
              ]}
            >
              {headCircGainPercentage}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBarContainer,
              { backgroundColor: `${theme.danger}30` },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${headCircGainPercentage}%`,
                  backgroundColor: isHeadCircGainSufficient
                    ? theme.success
                    : theme.danger,
                },
              ]}
            />
          </View>
        </View>

        {/* Difference from recommended */}
        <View style={styles.diffContainer}>
          <Text style={[styles.diffLabel, { color: theme.textSecondary }]}>
            Compared to WHO minimum ({recommendations.minHeadCircGain} mm):
          </Text>
          <Text
            style={[
              styles.diffValue,
              {
                color: headDiffPercentage >= 0 ? theme.success : theme.danger,
              },
            ]}
          >
            {formatPercentageText(headDiffPercentage)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    borderRadius: 8,
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  growthSummaryCard: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  growthSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  growthSummaryIcon: {
    marginRight: 8,
  },
  growthSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  growthSummaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  growthSummaryRecommended: {
    fontSize: 12,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  diffContainer: {
    marginTop: 8,
  },
  diffLabel: {
    fontSize: 12,
  },
  diffValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default GrowthSummaryCards;
