import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GrowthTips = ({ theme, childAgeInMonths }) => {
  return (
    <View
      style={[styles.tipsContainer, { backgroundColor: theme.cardBackground }]}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Growth & Development Tips ({childAgeInMonths} months)
      </Text>
      <View style={styles.tipsList}>
        {childAgeInMonths < 6 ? (
          // 0-6 months tips
          <>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Ensure adequate feeding - breastfeed on demand or follow formula
                feeding guidelines
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Position baby on their tummy during awake time to strengthen
                neck and shoulder muscles
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Track wet diapers to ensure baby is getting enough milk (6+ per
                day)
              </Text>
            </View>
          </>
        ) : childAgeInMonths >= 6 && childAgeInMonths < 12 ? (
          // 6-12 months tips
          <>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Introduce iron-rich solid foods around 6 months to support
                growth and brain development
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Encourage movement and crawling to develop gross motor skills
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Continue breast milk or formula as the primary source of
                nutrition
              </Text>
            </View>
          </>
        ) : childAgeInMonths >= 12 && childAgeInMonths < 24 ? (
          // 12-24 months tips
          <>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Offer a variety of nutrient-dense foods from all food groups
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Encourage walking, climbing, and other physical activities to
                build strength
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Provide opportunities for fine motor skill development with
                finger foods and simple toys
              </Text>
            </View>
          </>
        ) : childAgeInMonths >= 24 && childAgeInMonths < 60 ? (
          // 2-5 years tips
          <>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Establish regular meal and snack times with balanced nutrition
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Ensure adequate sleep (10-13 hours) for optimal growth hormone
                release
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Encourage daily physical activity (at least 3 hours) through
                active play
              </Text>
            </View>
          </>
        ) : (
          // 6+ years tips
          <>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Provide a balanced diet with adequate protein, calcium, and
                other nutrients for bone growth
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Encourage at least 60 minutes of moderate to vigorous physical
                activity daily
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.success}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Limit screen time and ensure adequate sleep (9-12 hours) for
                optimal growth
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tipsContainer: {
    borderRadius: 8,
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  tipsList: {},
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
  },
});

export default GrowthTips;
