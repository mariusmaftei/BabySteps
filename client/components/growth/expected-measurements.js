import { View, Text, StyleSheet } from "react-native";

const ExpectedMeasurements = ({
  theme,
  recommendations,
  childGender,
  currentWeight,
  currentHeight,
  currentHeadCirc,
}) => {
  return (
    <View
      style={[
        styles.expectedContainer,
        { backgroundColor: theme.cardBackground },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        WHO Expected Measurements
      </Text>
      <Text style={[styles.expectedSubtitle, { color: theme.textSecondary }]}>
        WHO standards for {recommendations.ageGroup} (
        {childGender === "female" ? "Girls" : "Boys"})
      </Text>

      <View style={styles.expectedTable}>
        <View
          style={[
            styles.expectedTableHeader,
            { borderBottomColor: theme.borderLight },
          ]}
        >
          <Text
            style={[
              styles.expectedTableHeaderCell,
              { color: theme.textSecondary },
            ]}
          >
            Measurement
          </Text>
          <Text
            style={[
              styles.expectedTableHeaderCell,
              { color: theme.textSecondary },
            ]}
          >
            WHO Standard
          </Text>
          <Text
            style={[
              styles.expectedTableHeaderCell,
              { color: theme.textSecondary },
            ]}
          >
            Current
          </Text>
        </View>

        <View
          style={[
            styles.expectedTableRow,
            { borderBottomColor: theme.borderLight },
          ]}
        >
          <Text style={[styles.expectedTableCell, { color: theme.text }]}>
            Weight
          </Text>
          <Text
            style={[styles.expectedTableCell, { color: theme.textSecondary }]}
          >
            {Math.round(recommendations.expectedWeight.min * 1000)}-
            {Math.round(recommendations.expectedWeight.max * 1000)} g
          </Text>
          <Text style={[styles.expectedTableCell, { color: theme.primary }]}>
            {currentWeight || "0"} g
          </Text>
        </View>

        <View
          style={[
            styles.expectedTableRow,
            { borderBottomColor: theme.borderLight },
          ]}
        >
          <Text style={[styles.expectedTableCell, { color: theme.text }]}>
            Height
          </Text>
          <Text
            style={[styles.expectedTableCell, { color: theme.textSecondary }]}
          >
            {Math.round(recommendations.expectedHeight.min * 10)}-
            {Math.round(recommendations.expectedHeight.max * 10)} mm
          </Text>
          <Text style={[styles.expectedTableCell, { color: theme.primary }]}>
            {currentHeight || "0"} mm
          </Text>
        </View>

        <View style={styles.expectedTableRow}>
          <Text style={[styles.expectedTableCell, { color: theme.text }]}>
            Head Circ.
          </Text>
          <Text
            style={[styles.expectedTableCell, { color: theme.textSecondary }]}
          >
            {Math.round(recommendations.expectedHeadCirc.min * 10)}-
            {Math.round(recommendations.expectedHeadCirc.max * 10)} mm
          </Text>
          <Text style={[styles.expectedTableCell, { color: theme.primary }]}>
            {currentHeadCirc || "0"} mm
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  expectedContainer: {
    borderRadius: 8,
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  expectedSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  expectedTable: {},
  expectedTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    marginBottom: 8,
  },
  expectedTableHeaderCell: {
    fontSize: 14,
    fontWeight: "500",
    width: "33%",
    textAlign: "left",
  },
  expectedTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  expectedTableCell: {
    fontSize: 14,
    width: "33%",
    textAlign: "left",
  },
});

export default ExpectedMeasurements;
