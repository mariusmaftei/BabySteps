"use client";

import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme-context";

const ChildRecommendationCard = ({
  childData,
  screenType = "feeding", // feeding, sleep, diaper, growth, etc.
  customIcon,
  customTitle,
  customRecommendation,
  customAvoidItems,
  style,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("recommended");

  // Get child's age as a number for recommendations
  const childAgeText = childData?.age || "0 months";
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 1;

  // Get age group based on months
  const getAgeGroup = (ageInMonths) => {
    if (ageInMonths < 6) return "Infant (0-6 months)";
    if (ageInMonths < 12) return "Infant (6-12 months)";
    if (ageInMonths < 24) return "Toddler (1-2 years)";
    if (ageInMonths < 36) return "Toddler (2-3 years)";
    if (ageInMonths < 60) return "Preschooler (3-5 years)";
    return "Child (5+ years)";
  };

  // Get screen-specific icon
  const getScreenIcon = () => {
    if (customIcon) return customIcon;

    switch (screenType) {
      case "feeding":
        return (
          <Ionicons name="nutrition-outline" size={24} color={theme.primary} />
        );
      case "sleep":
        return <Ionicons name="bed" size={24} color={theme.primary} />;
      case "diaper":
        return (
          <Ionicons name="water-outline" size={24} color={theme.primary} />
        );
      case "growth":
        return (
          <Ionicons
            name="trending-up-outline"
            size={24}
            color={theme.primary}
          />
        );
      case "health":
        return (
          <Ionicons name="medkit-outline" size={24} color={theme.primary} />
        );
      default:
        return (
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={theme.primary}
          />
        );
    }
  };

  // Get screen-specific title
  const getScreenTitle = () => {
    if (customTitle) return customTitle;

    switch (screenType) {
      case "feeding":
        return "Feeding Guidelines";
      case "sleep":
        return "Sleep Guidelines";
      case "diaper":
        return "Diaper Change Guidelines";
      case "growth":
        return "Growth Guidelines";
      case "health":
        return "Health Guidelines";
      default:
        return "Guidelines";
    }
  };

  // Get feeding recommendations based on age
  const getFeedingRecommendation = (ageInMonths) => {
    if (customRecommendation) return customRecommendation;

    if (ageInMonths < 6) {
      return "Exclusively breastfeed or formula feed 8-12 times per day (15-20 minutes per breast). No solid foods recommended before 6 months.";
    } else if (ageInMonths < 12) {
      return "Continue breast milk or formula as primary nutrition (4-6 feedings/day). Introduce single-ingredient purees, gradually increasing variety and texture.";
    } else if (ageInMonths < 24) {
      return "Transition to whole milk (if appropriate). Offer a variety of foods from all food groups with 3 meals + 2 snacks per day.";
    } else {
      return "Provide balanced meals with all food groups. Limit added sugars and highly processed foods. Encourage self-feeding and healthy eating habits.";
    }
  };

  // Get sleep recommendations based on age
  const getSleepRecommendation = (ageInMonths) => {
    if (customRecommendation) return customRecommendation;

    if (ageInMonths < 4) {
      return "14-17 hours of sleep per day, including naps. Newborns sleep in short periods (30-45 minutes to 3-4 hours) throughout the day and night.";
    } else if (ageInMonths < 12) {
      return "12-16 hours of sleep per day, including 2-3 naps. Most infants sleep through the night by 6 months.";
    } else if (ageInMonths < 36) {
      return "11-14 hours of sleep per day, including 1-2 naps. Establish consistent bedtime routines.";
    } else {
      return "10-13 hours of sleep per day. Most children drop naps by age 5.";
    }
  };

  // Get diaper recommendations based on age
  const getDiaperRecommendation = (ageInMonths) => {
    if (customRecommendation) return customRecommendation;

    if (ageInMonths < 1) {
      return "Expect 6-10 wet diapers and 3-4 bowel movements per day. Stools are typically yellow, soft, and seedy for breastfed babies.";
    } else if (ageInMonths < 6) {
      return "Expect 5-7 wet diapers and 1-4 bowel movements per day. Formula-fed babies may have fewer, firmer stools than breastfed babies.";
    } else if (ageInMonths < 12) {
      return "Expect 5-7 wet diapers per day. Bowel movements may decrease to 1-2 per day as solid foods are introduced.";
    } else {
      return "Diaper changes vary based on individual patterns. Consider potty training readiness between 18-30 months.";
    }
  };

  // Get growth recommendations based on age
  const getGrowthRecommendation = (ageInMonths) => {
    if (customRecommendation) return customRecommendation;

    if (ageInMonths < 6) {
      return "Expect weight gain of 140-200 grams per week. Length increases about 2.5 cm per month. Head circumference increases about 1.3 cm per month.";
    } else if (ageInMonths < 12) {
      return "Weight gain slows to 85-140 grams per week. Length increases about 1.3 cm per month. Birth weight typically doubles by 5-6 months and triples by 12 months.";
    } else if (ageInMonths < 24) {
      return "Weight gain of about 1.4-2.3 kg per year. Height increases about 7.5-12.5 cm per year. Birth weight typically quadruples by 2 years.";
    } else {
      return "Weight gain of about 1.8-2.7 kg per year. Height increases about 5-7.5 cm per year.";
    }
  };

  // Get health recommendations based on age
  const getHealthRecommendation = (ageInMonths) => {
    if (customRecommendation) return customRecommendation;

    if (ageInMonths < 12) {
      return "Regular well-baby check-ups at 1, 2, 4, 6, 9, and 12 months. Follow recommended vaccination schedule. Call doctor for fever over 100.4°F.";
    } else if (ageInMonths < 36) {
      return "Well-child check-ups at 15, 18, 24, and 30 months. Continue vaccinations. Dental visits should begin by age 1.";
    } else {
      return "Annual well-child check-ups. Dental check-ups every 6 months. Vision screening starting at age 3.";
    }
  };

  // Get recommendation based on screen type
  const getRecommendation = () => {
    switch (screenType) {
      case "feeding":
        return getFeedingRecommendation(childAgeInMonths);
      case "sleep":
        return getSleepRecommendation(childAgeInMonths);
      case "diaper":
        return getDiaperRecommendation(childAgeInMonths);
      case "growth":
        return getGrowthRecommendation(childAgeInMonths);
      case "health":
        return getHealthRecommendation(childAgeInMonths);
      default:
        return "No specific recommendations available for this category.";
    }
  };

  // Get WHO source text based on screen type
  const getSourceText = () => {
    switch (screenType) {
      case "feeding":
        return "Based on WHO and AAP feeding guidelines";
      case "sleep":
        return "Based on AAP sleep recommendations";
      case "diaper":
        return "Based on pediatric guidelines";
      case "growth":
        return "Based on WHO growth standards";
      case "health":
        return "Based on CDC and AAP guidelines";
      default:
        return "Based on pediatric guidelines";
    }
  };

  // Get items to avoid based on screen type and age
  const getFeedingAvoidItems = (ageInMonths) => {
    if (customAvoidItems) return customAvoidItems;

    const commonAvoidItems = [
      {
        name: "Honey",
        reason: "Risk of infant botulism",
        safeAge: 12,
      },
      {
        name: "Cow's milk (as main drink)",
        reason: "Hard to digest and lacks proper nutrients for infants",
        safeAge: 12,
      },
      {
        name: "Added salt or sugar",
        reason:
          "Harmful for developing kidneys and promotes poor eating habits",
        safeAge: 24,
      },
      {
        name: "Fruit juice",
        reason: "High in sugar and low in fiber",
        safeAge: 12,
      },
      {
        name: "Choking hazards (nuts, grapes, popcorn, etc.)",
        reason: "Risk of choking",
        safeAge: 48,
      },
      {
        name: "Unpasteurized foods",
        reason: "Risk of harmful bacteria",
        safeAge: 60,
      },
    ];

    // Filter based on age
    return commonAvoidItems.filter((item) => item.safeAge > ageInMonths);
  };

  const getSleepAvoidItems = (ageInMonths) => {
    if (customAvoidItems) return customAvoidItems;

    const avoidItems = [
      {
        name: "Loose bedding, pillows, and soft toys",
        reason: "Risk of suffocation and SIDS",
        safeAge: 12,
      },
      {
        name: "Overheating",
        reason: "Associated with increased risk of SIDS",
        safeAge: 12,
      },
      {
        name: "Co-sleeping on unsafe surfaces",
        reason: "Increased risk of suffocation and SIDS",
        safeAge: 12,
      },
      {
        name: "Prolonged screen time before bed",
        reason: "Blue light can disrupt sleep patterns",
        safeAge: 999, // Always avoid
      },
      {
        name: "Inconsistent sleep schedule",
        reason: "Can disrupt natural sleep rhythms",
        safeAge: 999, // Always avoid
      },
    ];

    return avoidItems.filter((item) => item.safeAge > ageInMonths);
  };

  const getDiaperAvoidItems = (ageInMonths) => {
    if (customAvoidItems) return customAvoidItems;

    return [
      {
        name: "Prolonged exposure to wet/soiled diapers",
        reason: "Can cause diaper rash and skin irritation",
        safeAge: 999, // Always avoid
      },
      {
        name: "Harsh wipes with alcohol or fragrance",
        reason: "Can irritate sensitive skin",
        safeAge: 999, // Always avoid
      },
      {
        name: "Tight-fitting diapers",
        reason: "Can cause chafing and restrict circulation",
        safeAge: 999, // Always avoid
      },
      {
        name: "Talcum powder",
        reason: "Inhalation risks and potential health concerns",
        safeAge: 999, // Always avoid
      },
    ];
  };

  const getGrowthAvoidItems = (ageInMonths) => {
    if (customAvoidItems) return customAvoidItems;

    return [
      {
        name: "Restrictive diets",
        reason: "Can limit essential nutrients needed for growth",
        safeAge: 999, // Always avoid
      },
      {
        name: "Excessive juice or sweetened beverages",
        reason: "Can displace nutrient-rich foods and affect growth",
        safeAge: 999, // Always avoid
      },
      {
        name: "Skipping regular check-ups",
        reason: "Important for monitoring growth patterns",
        safeAge: 999, // Always avoid
      },
      {
        name: "Comparing to other children",
        reason: "Each child grows at their own pace within normal ranges",
        safeAge: 999, // Always avoid
      },
    ];
  };

  const getHealthAvoidItems = (ageInMonths) => {
    if (customAvoidItems) return customAvoidItems;

    const avoidItems = [
      {
        name: "Exposure to cigarette smoke",
        reason: "Increases risk of respiratory issues and SIDS",
        safeAge: 999, // Always avoid
      },
      {
        name: "Unpasteurized products",
        reason: "Risk of harmful bacteria",
        safeAge: 999, // Always avoid
      },
      {
        name: "Delaying vaccinations",
        reason: "Increases risk of preventable diseases",
        safeAge: 999, // Always avoid
      },
      {
        name: "Over-the-counter medications without consultation",
        reason: "May not be safe for young children",
        safeAge: 999, // Always avoid
      },
    ];

    return avoidItems;
  };

  // Get avoid items based on screen type
  const getAvoidItems = () => {
    switch (screenType) {
      case "feeding":
        return getFeedingAvoidItems(childAgeInMonths);
      case "sleep":
        return getSleepAvoidItems(childAgeInMonths);
      case "diaper":
        return getDiaperAvoidItems(childAgeInMonths);
      case "growth":
        return getGrowthAvoidItems(childAgeInMonths);
      case "health":
        return getHealthAvoidItems(childAgeInMonths);
      default:
        return [];
    }
  };

  const avoidItems = getAvoidItems();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground },
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${theme.primary}20` },
          ]}
        >
          {getScreenIcon()}
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {getScreenTitle()}
        </Text>
      </View>

      {/* Age Group */}
      <View
        style={[
          styles.ageGroupContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Ionicons
          name="information-circle"
          size={18}
          color={theme.primary}
          style={styles.ageGroupIcon}
        />
        <Text style={[styles.ageGroupText, { color: theme.text }]}>
          <Text style={{ fontWeight: "600" }}>Age Group: </Text>
          {getAgeGroup(childAgeInMonths)}
        </Text>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "recommended" && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveTab("recommended")}
        >
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={activeTab === "recommended" ? "#fff" : theme.success}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "recommended" ? "#fff" : theme.textSecondary,
              },
            ]}
          >
            Recommended
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "avoid" && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveTab("avoid")}
        >
          <Ionicons
            name="close-circle"
            size={16}
            color={activeTab === "avoid" ? "#fff" : theme.danger}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "avoid" ? "#fff" : theme.textSecondary },
            ]}
          >
            Avoid
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === "recommended" ? (
        <View
          style={[
            styles.recommendationContainer,
            { backgroundColor: `${theme.primary}10` },
          ]}
        >
          <Text style={[styles.recommendationText, { color: theme.text }]}>
            {getRecommendation()}
          </Text>
        </View>
      ) : (
        <View style={styles.avoidContainer}>
          {avoidItems.length > 0 ? (
            avoidItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.avoidItem,
                  index < avoidItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.borderLight,
                    paddingBottom: 8,
                    marginBottom: 8,
                  },
                ]}
              >
                <View style={styles.avoidItemHeader}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={theme.danger}
                    style={styles.avoidItemIcon}
                  />
                  <Text style={[styles.avoidItemName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.avoidItemReason,
                    { color: theme.textSecondary },
                  ]}
                >
                  {item.reason}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyAvoidContainer}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={theme.success}
              />
              <Text
                style={[styles.emptyAvoidText, { color: theme.textSecondary }]}
              >
                No specific items to avoid at this age beyond general guidelines
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Source */}
      <View style={styles.sourceContainer}>
        <Ionicons
          name="medical"
          size={14}
          color={theme.textSecondary}
          style={styles.sourceIcon}
        />
        <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
          {getSourceText()}
        </Text>
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
  ageGroupContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  ageGroupIcon: {
    marginRight: 6,
  },
  ageGroupText: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  recommendationContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  avoidContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  avoidItem: {
    marginBottom: 4,
  },
  avoidItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  avoidItemIcon: {
    marginRight: 6,
  },
  avoidItemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  avoidItemReason: {
    fontSize: 13,
    marginLeft: 22,
  },
  emptyAvoidContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  emptyAvoidText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sourceIcon: {
    marginRight: 4,
  },
  sourceText: {
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default ChildRecommendationCard;
