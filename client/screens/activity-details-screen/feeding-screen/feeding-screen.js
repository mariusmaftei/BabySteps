import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

const screenWidth = Dimensions.get("window").width;

export default function FeedingDetailsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Get child's age as a number for recommendations
  const childAgeText = currentChild.age;
  const childAgeNum = Number.parseInt(childAgeText.split(" ")[0]) || 0;
  const childAgeUnit = childAgeText.includes("month") ? "months" : "years";

  // Convert age to months if in years for more precise recommendations
  const childAgeInMonths =
    childAgeUnit === "months" ? childAgeNum : childAgeNum * 12;

  // Meal inputs state
  const [mealInputs, setMealInputs] = useState({
    breakfast: "0",
    morningSnack: "0",
    lunch: "0",
    afternoonSnack: "0",
    dinner: "0",
  });

  // Total food amount
  const [totalFood, setTotalFood] = useState(0);

  // Update total food amount when inputs change
  useEffect(() => {
    const total = Object.values(mealInputs).reduce(
      (sum, value) => sum + (Number.parseInt(value) || 0),
      0
    );
    setTotalFood(total);
  }, [mealInputs]);

  // Feeding recommendations based on age
  const getFeedingRecommendations = (ageInMonths) => {
    if (ageInMonths < 6) {
      // 0-6 months
      return {
        ageGroup: "Infant (0-6 months)",
        feedingType: "Breast milk or formula only",
        totalAmount: "550-900 ml/day",
        mealFrequency: "On demand, 8-12 feedings/day",
        mealSizes: "60-120 ml per feeding",
        minGrams: 550,
        maxGrams: 900,
        mealDistribution: {
          earlyMorning: "1-2 feedings",
          morning: "2-3 feedings",
          afternoon: "2-3 feedings",
          evening: "2-3 feedings",
          night: "1-2 feedings (as needed)",
        },
      };
    } else if (ageInMonths >= 6 && ageInMonths < 12) {
      // 6-12 months
      return {
        ageGroup: "Infant (6-12 months)",
        feedingType: "Breast milk/formula + complementary foods",
        totalAmount: "750-900 ml milk + 150-200g solid food/day",
        mealFrequency: "3 meals + 2 milk feedings/day",
        mealSizes: "2-3 tablespoons per meal, gradually increasing",
        minGrams: 900,
        maxGrams: 1100,
        mealDistribution: {
          breakfast: "Milk (150-180 ml) + cereal (30-50g)",
          morningSnack: "Fruit puree (30-50g)",
          lunch: "Vegetable/protein puree (50-70g) + milk (150-180 ml)",
          afternoonSnack: "Yogurt or fruit (30-50g)",
          dinner: "Grain/vegetable mix (50-70g) + milk (150-180 ml)",
        },
      };
    } else if (ageInMonths >= 12 && ageInMonths < 24) {
      // 12-24 months
      return {
        ageGroup: "Toddler (1-2 years)",
        feedingType: "Family foods + milk",
        totalAmount: "900-1000g food/day including milk",
        mealFrequency: "3 meals + 2 snacks/day",
        mealSizes: "¼ to ½ cup (60-120g) per meal",
        minGrams: 900,
        maxGrams: 1000,
        mealDistribution: {
          breakfast: "Grain + fruit + milk (150-200g total)",
          morningSnack: "Fruit or vegetable (50-75g)",
          lunch: "Protein + vegetable + grain (200-250g total)",
          afternoonSnack: "Dairy or protein + grain (50-75g)",
          dinner: "Protein + vegetable + grain (200-250g total)",
        },
      };
    } else if (ageInMonths >= 24 && ageInMonths < 60) {
      // 2-5 years
      return {
        ageGroup: "Preschooler (2-5 years)",
        feedingType: "Family foods",
        totalAmount: "1200-1400g food/day",
        mealFrequency: "3 meals + 2 snacks/day",
        mealSizes: "½ to ¾ cup (120-180g) per meal",
        minGrams: 1200,
        maxGrams: 1400,
        mealDistribution: {
          breakfast: "Grain + protein + fruit (250-300g total)",
          morningSnack: "Fruit or vegetable + protein (75-100g)",
          lunch: "Protein + vegetable + grain + fruit (300-350g total)",
          afternoonSnack: "Grain + protein or dairy (75-100g)",
          dinner: "Protein + vegetable + grain (300-350g total)",
        },
      };
    } else {
      // 6+ years
      return {
        ageGroup: "School-age (6+ years)",
        feedingType: "Family foods",
        totalAmount: "1400-1600g food/day",
        mealFrequency: "3 meals + 1-2 snacks/day",
        mealSizes: "¾ to 1 cup (180-240g) per meal",
        minGrams: 1400,
        maxGrams: 1600,
        mealDistribution: {
          breakfast: "Grain + protein + fruit (300-350g total)",
          morningSnack: "Fruit or vegetable + protein (100g)",
          lunch: "Protein + vegetable + grain + fruit (350-400g total)",
          afternoonSnack: "Grain + protein or dairy (100g)",
          dinner: "Protein + vegetable + grain (350-400g total)",
        },
      };
    }
  };

  const recommendations = getFeedingRecommendations(childAgeInMonths);

  // Handle input change with validation
  const handleInputChange = (meal, value) => {
    // Validate input to only allow numbers with max 3 digits
    const validatedValue = value.replace(/[^0-9]/g, "");

    // Limit to max 3 digits
    if (validatedValue.length > 3) {
      return;
    }

    setMealInputs({
      ...mealInputs,
      [meal]: validatedValue,
    });
  };

  // Check if food amount meets recommendations
  const isFoodSufficient = totalFood >= recommendations.minGrams;

  // Calculate the percentage of recommended food
  const calculateFoodPercentage = () => {
    const percentage = Math.round((totalFood / recommendations.minGrams) * 100);
    return Math.min(percentage, 100);
  };

  const foodPercentage = calculateFoodPercentage();

  // Calculate the percentage difference from recommended food
  const calculateFoodDifferencePercentage = () => {
    const diff = totalFood - recommendations.minGrams;
    const percentage = Math.round((diff / recommendations.minGrams) * 100);
    return percentage;
  };

  const foodDiffPercentage = calculateFoodDifferencePercentage();
  const foodDiffPercentageText =
    foodDiffPercentage >= 0
      ? `+${foodDiffPercentage}%`
      : `${foodDiffPercentage}%`;

  // Prepare data for pie chart
  const getPieChartData = () => {
    const colors = ["#FF9500", "#FF2D55", "#5A87FF", "#4CD964", "#5856D6"];
    const meals = [
      "breakfast",
      "morningSnack",
      "lunch",
      "afternoonSnack",
      "dinner",
    ];
    const mealNames = [
      "Breakfast",
      "Morning Snack",
      "Lunch",
      "Afternoon Snack",
      "Dinner",
    ];

    return meals
      .map((meal, index) => {
        const value = Number.parseInt(mealInputs[meal]) || 0;
        return {
          name: mealNames[index],
          population: value,
          color: colors[index],
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        };
      })
      .filter((item) => item.population > 0);
  };

  // Set up the notification button in the header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <Ionicons
            name={notificationsEnabled ? "notifications" : "notifications-off"}
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
      ),
      title: `${currentChild.name.split(" ")[0]}'s Feeding Details`,
    });
  }, [navigation, notificationsEnabled, theme, currentChild]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Age Group Info */}
        <View style={styles.ageGroupContainer}>
          <Text style={[styles.ageGroupLabel, { color: theme.textSecondary }]}>
            Age Group:
          </Text>
          <View
            style={[
              styles.ageGroupInfo,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={18}
              color={theme.primary}
              style={styles.ageGroupIcon}
            />
            <Text style={[styles.ageGroupText, { color: theme.text }]}>
              {recommendations.ageGroup}
            </Text>
          </View>
        </View>

        {/* Feeding Type Banner */}
        <View
          style={[
            styles.feedingTypeBanner,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text
            style={[styles.feedingTypeLabel, { color: theme.textSecondary }]}
          >
            Recommended Feeding Type:
          </Text>
          <Text style={[styles.feedingTypeText, { color: theme.primary }]}>
            {recommendations.feedingType}
          </Text>
        </View>

        {/* Meal Distribution Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="pie-chart"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Meal Distribution
            </Text>
          </View>

          <View style={styles.chartWrapper}>
            {getPieChartData().length > 0 ? (
              <PieChart
                data={getPieChartData()}
                width={screenWidth - 64}
                height={200}
                chartConfig={{
                  backgroundGradientFrom: theme.cardBackground,
                  backgroundGradientTo: theme.cardBackground,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <View style={styles.emptyChartContainer}>
                <Ionicons
                  name="restaurant-outline"
                  size={48}
                  color={theme.textTertiary}
                />
                <Text
                  style={[
                    styles.emptyChartText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Enter meal amounts to see distribution
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.totalFoodContainer,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <Text
              style={[styles.totalFoodLabel, { color: theme.textSecondary }]}
            >
              Total Food Amount
            </Text>
            <Text
              style={[
                styles.totalFoodValue,
                {
                  color: isFoodSufficient ? theme.success : theme.danger,
                },
              ]}
            >
              {totalFood} g
            </Text>
            <Text
              style={[styles.recommendedAmount, { color: theme.textSecondary }]}
            >
              Recommended: {recommendations.totalAmount}
            </Text>
          </View>
        </View>

        {/* Meal Inputs */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.inputTitle, { color: theme.text }]}>
            Record Today's Meals
          </Text>
          <Text style={[styles.inputSubtitle, { color: theme.textSecondary }]}>
            Enter the amount of food consumed at each meal (in grams)
          </Text>

          <View style={styles.mealInputsContainer}>
            {/* Breakfast */}
            <View
              style={[
                styles.mealInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.mealLabelContainer}>
                <View
                  style={[styles.mealIcon, { backgroundColor: "#FF950020" }]}
                >
                  <Ionicons name="sunny" size={16} color="#FF9500" />
                </View>
                <Text style={[styles.mealLabel, { color: theme.text }]}>
                  Breakfast
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={mealInputs.breakfast}
                  onChangeText={(value) =>
                    handleInputChange("breakfast", value)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  g
                </Text>
              </View>
            </View>

            {/* Morning Snack */}
            <View
              style={[
                styles.mealInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.mealLabelContainer}>
                <View
                  style={[styles.mealIcon, { backgroundColor: "#FF2D5520" }]}
                >
                  <Ionicons name="cafe" size={16} color="#FF2D55" />
                </View>
                <Text style={[styles.mealLabel, { color: theme.text }]}>
                  Morning Snack
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={mealInputs.morningSnack}
                  onChangeText={(value) =>
                    handleInputChange("morningSnack", value)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  g
                </Text>
              </View>
            </View>

            {/* Lunch */}
            <View
              style={[
                styles.mealInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.mealLabelContainer}>
                <View
                  style={[styles.mealIcon, { backgroundColor: "#5A87FF20" }]}
                >
                  <Ionicons name="restaurant" size={16} color="#5A87FF" />
                </View>
                <Text style={[styles.mealLabel, { color: theme.text }]}>
                  Lunch
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={mealInputs.lunch}
                  onChangeText={(value) => handleInputChange("lunch", value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  g
                </Text>
              </View>
            </View>

            {/* Afternoon Snack */}
            <View
              style={[
                styles.mealInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.mealLabelContainer}>
                <View
                  style={[styles.mealIcon, { backgroundColor: "#4CD96420" }]}
                >
                  <Ionicons name="nutrition" size={16} color="#4CD964" />
                </View>
                <Text style={[styles.mealLabel, { color: theme.text }]}>
                  Afternoon Snack
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={mealInputs.afternoonSnack}
                  onChangeText={(value) =>
                    handleInputChange("afternoonSnack", value)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  g
                </Text>
              </View>
            </View>

            {/* Dinner */}
            <View style={styles.mealInputRow}>
              <View style={styles.mealLabelContainer}>
                <View
                  style={[styles.mealIcon, { backgroundColor: "#5856D620" }]}
                >
                  <Ionicons name="moon" size={16} color="#5856D6" />
                </View>
                <Text style={[styles.mealLabel, { color: theme.text }]}>
                  Dinner
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={mealInputs.dinner}
                  onChangeText={(value) => handleInputChange("dinner", value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  g
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={() => console.log("Saved feeding data:", mealInputs)}
          >
            <Ionicons
              name="save"
              size={16}
              color="#FFFFFF"
              style={styles.saveButtonIcon}
            />
            <Text style={styles.saveButtonText}>Save Feeding Data</Text>
          </TouchableOpacity>
        </View>

        {/* Total Food Summary */}
        <View
          style={[
            styles.totalSummaryContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: isFoodSufficient ? "transparent" : theme.danger,
              borderWidth: isFoodSufficient ? 0 : 2,
            },
          ]}
        >
          <Text
            style={[styles.totalSummaryLabel, { color: theme.textSecondary }]}
          >
            Total Daily Food
          </Text>
          <Text
            style={[
              styles.totalSummaryValue,
              {
                color: isFoodSufficient ? theme.success : theme.danger,
              },
            ]}
          >
            {totalFood} grams
          </Text>
          <Text
            style={[
              styles.totalSummaryRecommended,
              { color: theme.textSecondary },
            ]}
          >
            Recommended: {recommendations.minGrams}-{recommendations.maxGrams}{" "}
            grams
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text
                style={[styles.progressLabel, { color: theme.textSecondary }]}
              >
                Progress toward minimum goal:
              </Text>
              <Text
                style={[
                  styles.progressPercentage,
                  { color: isFoodSufficient ? theme.success : theme.danger },
                ]}
              >
                {foodPercentage}%
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
                    width: `${foodPercentage}%`,
                    backgroundColor: isFoodSufficient
                      ? theme.success
                      : theme.danger,
                  },
                ]}
              />
            </View>
          </View>

          {/* Total food percentage chart with positive/negative values */}
          <View style={styles.totalPercentageContainer}>
            <View style={styles.percentageRow}>
              <Text
                style={[
                  styles.totalPercentageLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Compared to minimum goal ({recommendations.minGrams} g):
              </Text>

              {/* Display percentage with + or - sign */}
              <Text
                style={[
                  styles.percentageText,
                  {
                    color:
                      foodDiffPercentage >= 0 ? theme.success : theme.danger,
                    fontSize: 16,
                    fontWeight: "700",
                  },
                ]}
              >
                {foodDiffPercentageText}
              </Text>
            </View>

            {/* Progress bar for positive/negative values */}
            <View style={styles.totalProgressBarContainer}>
              {/* Center line (0%) */}
              <View style={styles.centerLine} />

              {/* Negative bar (if applicable) */}
              {foodDiffPercentage < 0 && (
                <View
                  style={[
                    styles.negativeProgressBar,
                    {
                      width: `${Math.min(
                        50,
                        Math.abs(foodDiffPercentage) / 2
                      )}%`,
                      backgroundColor: theme.danger,
                    },
                  ]}
                />
              )}

              {/* Positive bar (if applicable) */}
              {foodDiffPercentage > 0 && (
                <View
                  style={[
                    styles.positiveProgressBar,
                    {
                      width: `${Math.min(50, foodDiffPercentage / 2)}%`,
                      backgroundColor: theme.success,
                    },
                  ]}
                />
              )}
            </View>

            {/* Scale labels */}
            <View style={styles.scaleLabels}>
              <Text style={[styles.scaleLabel, { color: theme.textSecondary }]}>
                -100%
              </Text>
              <Text style={[styles.scaleLabel, { color: theme.textSecondary }]}>
                0%
              </Text>
              <Text style={[styles.scaleLabel, { color: theme.textSecondary }]}>
                +100%
              </Text>
            </View>
          </View>

          {!isFoodSufficient && (
            <View style={styles.warningContainer}>
              <Ionicons
                name="warning"
                size={18}
                color={theme.danger}
                style={styles.warningIcon}
              />
              <Text style={[styles.warningText, { color: theme.danger }]}>
                Food intake below recommended minimum of{" "}
                {recommendations.minGrams} grams
              </Text>
            </View>
          )}
        </View>

        {/* Recommended Meal Distribution */}
        <View
          style={[
            styles.mealDistributionContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recommended Meal Distribution
          </Text>

          <View style={styles.mealDistributionContent}>
            {Object.entries(recommendations.mealDistribution).map(
              ([meal, recommendation], index) => (
                <View
                  key={meal}
                  style={[
                    styles.mealRecommendationRow,
                    index <
                      Object.entries(recommendations.mealDistribution).length -
                        1 && {
                      borderBottomColor: theme.borderLight,
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.mealRecommendationLabel,
                      { color: theme.text },
                    ]}
                  >
                    {meal.charAt(0).toUpperCase() +
                      meal.slice(1).replace(/([A-Z])/g, " $1")}
                    :
                  </Text>
                  <Text
                    style={[
                      styles.mealRecommendationValue,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {recommendation}
                  </Text>
                </View>
              )
            )}
          </View>

          <View style={styles.mealFrequencyContainer}>
            <View style={styles.mealFrequencyRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color={theme.primary}
                style={styles.mealFrequencyIcon}
              />
              <Text
                style={[
                  styles.mealFrequencyLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Recommended Frequency:
              </Text>
            </View>
            <Text style={[styles.mealFrequencyValue, { color: theme.text }]}>
              {recommendations.mealFrequency}
            </Text>
          </View>

          <View style={styles.mealSizesContainer}>
            <View style={styles.mealSizesRow}>
              <Ionicons
                name="resize-outline"
                size={18}
                color={theme.primary}
                style={styles.mealSizesIcon}
              />
              <Text
                style={[styles.mealSizesLabel, { color: theme.textSecondary }]}
              >
                Recommended Portion Sizes:
              </Text>
            </View>
            <Text style={[styles.mealSizesValue, { color: theme.text }]}>
              {recommendations.mealSizes}
            </Text>
          </View>
        </View>

        {/* Feeding Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Age-Appropriate Feeding Tips
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
                    Feed on demand, watching for hunger cues like rooting,
                    sucking motions, or hand-to-mouth movements
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
                    Exclusively breastfeed or formula feed; no solid foods are
                    needed at this stage
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
                    Burp baby during and after feedings to reduce gas and
                    discomfort
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
                    Introduce single-ingredient purees one at a time, waiting
                    3-5 days between new foods to watch for allergies
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
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Progress from purees to mashed and soft finger foods as baby
                    develops
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
                    Transition to whole milk (if appropriate) and offer in a cup
                    rather than a bottle
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
                    Offer a variety of foods from all food groups in small,
                    manageable portions
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
                    Expect food jags and pickiness; continue to offer rejected
                    foods without pressure
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
                    Involve your child in meal preparation to increase interest
                    in trying new foods
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
                    Establish regular meal and snack times to develop healthy
                    eating patterns
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
                    Limit juice and sugary drinks; offer water between meals and
                    milk with meals
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
                    Teach about balanced nutrition and involve children in meal
                    planning
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
                    Limit processed foods and encourage whole foods from all
                    food groups
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
                    Be a good role model by eating healthy foods and having
                    family meals together
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerButton: {
    padding: 10,
  },
  ageGroupContainer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  ageGroupLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginRight: 8,
  },
  ageGroupInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ageGroupIcon: {
    marginRight: 6,
  },
  ageGroupText: {
    fontSize: 15,
    fontWeight: "600",
  },
  feedingTypeBanner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  feedingTypeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  feedingTypeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  totalFoodContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalFoodLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalFoodValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  recommendedAmount: {
    fontSize: 14,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  mealInputsContainer: {
    marginBottom: 16,
  },
  mealInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mealLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mealLabel: {
    fontSize: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    width: 100,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    textAlign: "right",
  },
  inputUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  totalSummaryContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalSummaryLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  totalSummaryValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  totalSummaryRecommended: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  totalPercentageContainer: {
    width: "100%",
    marginBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
  },
  percentageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  totalPercentageLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  totalProgressBarContainer: {
    height: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
    position: "relative",
  },
  centerLine: {
    position: "absolute",
    width: 2,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    left: "50%",
    marginLeft: -1,
  },
  negativeProgressBar: {
    position: "absolute",
    height: "100%",
    right: "50%",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  positiveProgressBar: {
    position: "absolute",
    height: "100%",
    left: "50%",
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  scaleLabel: {
    fontSize: 10,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: "100%",
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
  },
  mealDistributionContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealDistributionContent: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  mealRecommendationRow: {
    paddingVertical: 10,
  },
  mealRecommendationLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  mealRecommendationValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  mealFrequencyContainer: {
    marginBottom: 12,
  },
  mealFrequencyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  mealFrequencyIcon: {
    marginRight: 8,
  },
  mealFrequencyLabel: {
    fontSize: 14,
  },
  mealFrequencyValue: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 26,
  },
  mealSizesContainer: {
    marginBottom: 8,
  },
  mealSizesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  mealSizesIcon: {
    marginRight: 8,
  },
  mealSizesLabel: {
    fontSize: 14,
  },
  mealSizesValue: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 26,
  },
  tipsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsList: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
