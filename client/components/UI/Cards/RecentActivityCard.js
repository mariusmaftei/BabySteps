import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme-context";

const RecentActivityCard = ({
  title,
  activities = [],
  emptyStateMessage,
  emptyStateIcon,
  onViewAll,
  renderActivityItem,
  onDeleteItem,
  showDeleteButton = false,
  deleteConfirmTitle = "Delete Item",
  deleteConfirmMessage = "Are you sure you want to delete this item?",
  maxItems = 5,
}) => {
  const { theme } = useTheme();

  const handleDeletePress = (item) => {
    Alert.alert(deleteConfirmTitle, deleteConfirmMessage, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => onDeleteItem(item),
        style: "destructive",
      },
    ]);
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {onViewAll && activities.length > 0 && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={[styles.viewAllText, { color: theme.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          {typeof emptyStateIcon === "string" ? (
            <Ionicons
              name={emptyStateIcon}
              size={24}
              color={theme.textSecondary}
            />
          ) : (
            emptyStateIcon
          )}
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            {emptyStateMessage || "No items to display"}
          </Text>
        </View>
      ) : (
        <View style={styles.activitiesList}>
          {displayActivities.map((item, index) => (
            <View
              key={item.id || index}
              style={[
                styles.activityItemContainer,
                index < displayActivities.length - 1 && styles.itemBorder,
              ]}
            >
              <View style={styles.activityItemContent}>
                {renderActivityItem(item)}
              </View>

              {showDeleteButton && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePress(item)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.danger}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  activitiesList: {
    width: "100%",
  },
  activityItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    width: "100%",
  },
  activityItemContent: {
    flex: 1,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default RecentActivityCard;
