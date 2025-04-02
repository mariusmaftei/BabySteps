import { View, Text, StyleSheet } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

const SummaryCards = ({
  title,
  data,
  theme,
  showSolidFood = false,
  customIcons = null,
  customLabels = null,
}) => {
  return (
    <View
      style={[
        styles.summaryContainer,
        { backgroundColor: theme.cardBackground },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>

      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCardSmall,
            { backgroundColor: `${theme.backgroundSecondary}` },
          ]}
        >
          <View
            style={[styles.iconCircleSmall, { backgroundColor: "#FF950020" }]}
          >
            {customIcons?.breast || (
              <FontAwesome6
                name="person-breastfeeding"
                size={20}
                color="#FF9500"
              />
            )}
          </View>
          <Text style={[styles.summaryValueSmall, { color: theme.text }]}>
            {data.breastCount}
          </Text>
          <Text
            style={[styles.summaryLabelSmall, { color: theme.textSecondary }]}
          >
            {customLabels?.breast || "Breastfeedings"}
          </Text>
          <Text style={[styles.summarySubvalueSmall, { color: theme.primary }]}>
            {data.breastMinutes} {customLabels?.breastUnit || "min"}
          </Text>
        </View>

        <View
          style={[
            styles.summaryCardSmall,
            { backgroundColor: `${theme.backgroundSecondary}` },
          ]}
        >
          <View
            style={[styles.iconCircleSmall, { backgroundColor: "#5A87FF20" }]}
          >
            {customIcons?.bottle || (
              <MaterialCommunityIcons
                name="baby-bottle-outline"
                size={20}
                color="#5A87FF"
              />
            )}
          </View>
          <Text style={[styles.summaryValueSmall, { color: theme.text }]}>
            {data.bottleCount}
          </Text>
          <Text
            style={[styles.summaryLabelSmall, { color: theme.textSecondary }]}
          >
            {customLabels?.bottle || "Bottle Feeds"}
          </Text>
          <Text style={[styles.summarySubvalueSmall, { color: theme.primary }]}>
            {data.bottleMl} {customLabels?.bottleUnit || "ml"}
          </Text>
        </View>

        {showSolidFood && (
          <View
            style={[
              styles.summaryCardSmall,
              { backgroundColor: `${theme.backgroundSecondary}` },
            ]}
          >
            <View
              style={[styles.iconCircleSmall, { backgroundColor: "#4CD96420" }]}
            >
              {customIcons?.solid || (
                <Ionicons name="nutrition" size={20} color="#4CD964" />
              )}
            </View>
            <Text style={[styles.summaryValueSmall, { color: theme.text }]}>
              {data.solidCount}
            </Text>
            <Text
              style={[styles.summaryLabelSmall, { color: theme.textSecondary }]}
            >
              {customLabels?.solid || "Solid Feeds"}
            </Text>
            <Text
              style={[styles.summarySubvalueSmall, { color: theme.primary }]}
            >
              {data.solidGrams} {customLabels?.solidUnit || "g"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryCardSmall: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  iconCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  summaryValueSmall: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 2,
  },
  summaryLabelSmall: {
    fontSize: 12,
    textAlign: "center",
  },
  summarySubvalueSmall: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
});

export default SummaryCards;
