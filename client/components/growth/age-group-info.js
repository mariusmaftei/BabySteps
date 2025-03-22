import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AgeGroupInfo = ({ theme, recommendations, childAgeInMonths }) => {
  return (
    <View style={styles.ageGroupContainer}>
      <Text style={[styles.ageGroupLabel, { color: theme.textSecondary }]}>
        Age Group:
      </Text>
      <View
        style={[styles.ageGroupInfo, { backgroundColor: `${theme.primary}20` }]}
      >
        <Ionicons
          name="information-circle"
          size={18}
          color={theme.primary}
          style={styles.ageGroupIcon}
        />
        <Text style={[styles.ageGroupText, { color: theme.text }]}>
          {recommendations.ageGroup} ({childAgeInMonths} months)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ageGroupContainer: {
    marginBottom: 16,
  },
  ageGroupLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  ageGroupInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  ageGroupIcon: {
    marginRight: 8,
  },
  ageGroupText: {
    fontSize: 14,
  },
});

export default AgeGroupInfo;
