import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const WHOStandardsDisplay = ({
  theme,
  recommendations,
  childGender,
  weightPercentOfWHO,
  heightPercentOfWHO,
  headCircPercentOfWHO,
}) => {
  return (
    <View
      style={[
        styles.whoStandardsContainer,
        { backgroundColor: theme.cardBackground },
      ]}
    >
      <View style={styles.whoStandardsHeader}>
        <Ionicons
          name="medkit"
          size={20}
          color={theme.primary}
          style={styles.whoStandardsIcon}
        />
        <Text style={[styles.whoStandardsTitle, { color: theme.text }]}>
          WHO Growth Standards ({childGender === "female" ? "Girls" : "Boys"})
        </Text>
      </View>
      <View style={styles.whoStandardsContent}>
        <View style={styles.whoStandardsRow}>
          <Text
            style={[styles.whoStandardsLabel, { color: theme.textSecondary }]}
          >
            Weight:
          </Text>
          <Text style={[styles.whoStandardsValue, { color: theme.text }]}>
            {Math.round(recommendations.whoStandard.weight * 1000)} g
          </Text>
          <View
            style={[
              styles.whoPercentageContainer,
              {
                backgroundColor:
                  weightPercentOfWHO >= 90 && weightPercentOfWHO <= 110
                    ? `${theme.success}20`
                    : `${theme.warning}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.whoPercentageText,
                {
                  color:
                    weightPercentOfWHO >= 90 && weightPercentOfWHO <= 110
                      ? theme.success
                      : theme.warning,
                },
              ]}
            >
              {weightPercentOfWHO}%
            </Text>
          </View>
        </View>
        <View style={styles.whoStandardsRow}>
          <Text
            style={[styles.whoStandardsLabel, { color: theme.textSecondary }]}
          >
            Height:
          </Text>
          <Text style={[styles.whoStandardsValue, { color: theme.text }]}>
            {Math.round(recommendations.whoStandard.height * 10)} mm
          </Text>
          <View
            style={[
              styles.whoPercentageContainer,
              {
                backgroundColor:
                  heightPercentOfWHO >= 90 && heightPercentOfWHO <= 110
                    ? `${theme.success}20`
                    : `${theme.warning}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.whoPercentageText,
                {
                  color:
                    heightPercentOfWHO >= 90 && heightPercentOfWHO <= 110
                      ? theme.success
                      : theme.warning,
                },
              ]}
            >
              {heightPercentOfWHO}%
            </Text>
          </View>
        </View>
        <View style={styles.whoStandardsRow}>
          <Text
            style={[styles.whoStandardsLabel, { color: theme.textSecondary }]}
          >
            Head Circ:
          </Text>
          <Text style={[styles.whoStandardsValue, { color: theme.text }]}>
            {Math.round(recommendations.whoStandard.headCirc * 10)} mm
          </Text>
          <View
            style={[
              styles.whoPercentageContainer,
              {
                backgroundColor:
                  headCircPercentOfWHO >= 90 && headCircPercentOfWHO <= 110
                    ? `${theme.success}20`
                    : `${theme.warning}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.whoPercentageText,
                {
                  color:
                    headCircPercentOfWHO >= 90 && headCircPercentOfWHO <= 110
                      ? theme.success
                      : theme.warning,
                },
              ]}
            >
              {headCircPercentOfWHO}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  whoStandardsContainer: {
    borderRadius: 8,
    marginBottom: 24,
    padding: 16,
  },
  whoStandardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  whoStandardsIcon: {
    marginRight: 8,
  },
  whoStandardsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  whoStandardsContent: {
    marginTop: 8,
  },
  whoStandardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  whoStandardsLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  whoStandardsValue: {
    fontSize: 14,
  },
  whoPercentageContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  whoPercentageText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default WHOStandardsDisplay;
