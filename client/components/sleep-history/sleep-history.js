import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SleepHistory = ({ sleepRecords, theme, onItemPress }) => {
  // Sort records by date (newest first)
  const sortedRecords = [...sleepRecords].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  const renderItem = ({ item }) => {
    const isToday = item.getFormattedDate() === "Today";

    return (
      <TouchableOpacity
        style={[
          styles.historyItem,
          {
            backgroundColor: isToday
              ? `${theme.primary}10`
              : theme.backgroundSecondary,
            borderLeftColor: isToday ? theme.primary : theme.borderLight,
          },
        ]}
        onPress={() => onItemPress(item)}
      >
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {item.getFormattedDate()}
          </Text>
          {isToday && (
            <View
              style={[styles.todayBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          )}
        </View>

        <View style={styles.sleepDetails}>
          <View style={styles.sleepMetric}>
            <Ionicons
              name="sunny"
              size={16}
              color="#FF9500"
              style={styles.sleepIcon}
            />
            <Text style={[styles.sleepValue, { color: theme.text }]}>
              {item.napHours} hrs
            </Text>
          </View>

          <View style={styles.sleepMetric}>
            <Ionicons
              name="moon"
              size={16}
              color={theme.info}
              style={styles.sleepIcon}
            />
            <Text style={[styles.sleepValue, { color: theme.text }]}>
              {item.nightHours} hrs
            </Text>
          </View>

          <View style={styles.sleepMetric}>
            <Ionicons
              name="time"
              size={16}
              color={theme.success}
              style={styles.sleepIcon}
            />
            <Text style={[styles.sleepValue, { color: theme.text }]}>
              {item.totalHours} hrs
            </Text>
          </View>
        </View>

        {item.notes && (
          <Text
            style={[styles.notesText, { color: theme.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.notes}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.header}>
        <Ionicons
          name="calendar"
          size={20}
          color={theme.text}
          style={styles.headerIcon}
        />
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Sleep History
        </Text>
      </View>

      {sortedRecords.length > 0 ? (
        <FlatList
          data={sortedRecords}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item.date}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="bed"
            size={40}
            color={theme.textTertiary}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No sleep records found
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
            Start tracking your child's sleep patterns
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  listContent: {
    padding: 12,
  },
  historyItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  todayBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  sleepDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sleepMetric: {
    flexDirection: "row",
    alignItems: "center",
  },
  sleepIcon: {
    marginRight: 4,
  },
  sleepValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default SleepHistory;
