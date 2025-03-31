import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme-context";

const ChildInfoCard = ({ childData, customIcon, customTitle, style }) => {
  const { theme } = useTheme();

  const calculateAgeInMonths = (birthDate) => {
    if (!birthDate) return 0;

    const birthDateObj = new Date(birthDate);
    const today = new Date();

    let months = (today.getFullYear() - birthDateObj.getFullYear()) * 12;
    months -= birthDateObj.getMonth();
    months += today.getMonth();

    if (today.getDate() < birthDateObj.getDate()) {
      months--;
    }

    return months;
  };

  const formatBirthDate = (dateString) => {
    if (!dateString) return "Not available";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAgeGroup = (months) => {
    if (months < 0) return "Not born yet";
    if (months < 6) return "Infant (0-6 months)";
    if (months < 12) return "Infant (6-12 months)";
    if (months < 24) return "Toddler (1-2 years)";
    if (months < 36) return "Toddler (2-3 years)";
    if (months < 60) return "Preschooler (3-5 years)";
    return "Child (5+ years)";
  };

  const getIcon = () => {
    if (customIcon) return customIcon;
    return <Ionicons name="child-outline" size={24} color={theme.primary} />;
  };

  const getTitle = () => {
    if (customTitle) return customTitle;
    return "Child Information";
  };

  const ageInMonths = calculateAgeInMonths(childData?.birthDate);
  const ageGroup = getAgeGroup(ageInMonths);
  const birthDate = formatBirthDate(childData?.birthDate);
  const icon = getIcon();
  const title = getTitle();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground },
        style,
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${theme.primary}20` },
          ]}
        >
          {icon}
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Name:
          </Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {childData?.name || "Not available"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Birth Date:
          </Text>
          <Text style={[styles.value, { color: theme.text }]}>{birthDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Age Group:
          </Text>
          <View
            style={[
              styles.ageGroupBadge,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <Text style={[styles.ageGroupText, { color: theme.primary }]}>
              {ageGroup}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Gender:
          </Text>
          <View
            style={[
              styles.genderContainer,
              {
                backgroundColor:
                  childData?.gender === "male" ? "#E6F7FF" : "#FFF0F6",
              },
            ]}
          >
            <Ionicons
              name={
                childData?.gender === "male" ? "male-outline" : "female-outline"
              }
              size={16}
              color={childData?.gender === "male" ? "#1890FF" : "#EB2F96"}
              style={styles.genderIcon}
            />
            <Text
              style={[
                styles.genderText,
                {
                  color: childData?.gender === "male" ? "#1890FF" : "#EB2F96",
                },
              ]}
            >
              {childData?.gender
                ? childData.gender.charAt(0).toUpperCase() +
                  childData.gender.slice(1)
                : "Not specified"}
            </Text>
          </View>
        </View>
      </View>
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
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    width: 90,
  },
  value: {
    fontSize: 14,
    flex: 1,
  },
  ageGroupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ageGroupText: {
    fontSize: 14,
    fontWeight: "500",
  },
  genderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderIcon: {
    marginRight: 6,
  },
  genderText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ChildInfoCard;
