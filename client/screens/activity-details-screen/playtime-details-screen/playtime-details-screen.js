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
import { BarChart, PieChart } from "react-native-chart-kit";

import { useTheme } from "../../../context/theme-context";
import { useChildActivity } from "../../../context/child-activity-context";

const screenWidth = Dimensions.get("window").width;

export default function PlaytimeDetailsScreen({ navigation }) {
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

  // Playtime inputs state
  const [physicalPlay, setPhysicalPlay] = useState("0");
  const [creativePlay, setCreativePlay] = useState("0");
  const [educationalPlay, setEducationalPlay] = useState("0");
  const [socialPlay, setSocialPlay] = useState("0");
  const [screenTime, setScreenTime] = useState("0");

  // Total playtime
  const [totalPlaytime, setTotalPlaytime] = useState(0);

  // Update total playtime when inputs change
  useEffect(() => {
    const physical = Number.parseInt(physicalPlay) || 0;
    const creative = Number.parseInt(creativePlay) || 0;
    const educational = Number.parseInt(educationalPlay) || 0;
    const social = Number.parseInt(socialPlay) || 0;
    const screen = Number.parseInt(screenTime) || 0;

    setTotalPlaytime(physical + creative + educational + social + screen);
  }, [physicalPlay, creativePlay, educationalPlay, socialPlay, screenTime]);

  // Playtime recommendations based on age
  const getPlaytimeRecommendations = (ageInMonths) => {
    if (ageInMonths < 12) {
      // 0-12 months
      return {
        ageGroup: "Infant (0-12 months)",
        totalPlaytimePerDay: "60-90 minutes",
        minPlaytime: 60,
        maxPlaytime: 90,
        screenTimeRecommendation: "Not recommended",
        maxScreenTime: 0,
        recommendedDistribution: {
          physical: 40,
          creative: 30,
          educational: 20,
          social: 10,
          screen: 0,
        },
        playActivities: {
          physical: "Tummy time, reaching for toys, rolling, crawling",
          creative:
            "Exploring textures, listening to music, looking at high-contrast images",
          educational:
            "Reading board books, naming objects, simple cause-effect toys",
          social: "Face-to-face interaction, peek-a-boo, mimicking expressions",
          screen: "Screen time not recommended under 18 months",
        },
      };
    } else if (ageInMonths >= 12 && ageInMonths < 36) {
      // 1-3 years
      return {
        ageGroup: "Toddler (1-3 years)",
        totalPlaytimePerDay: "90-180 minutes",
        minPlaytime: 90,
        maxPlaytime: 180,
        screenTimeRecommendation:
          "Maximum 1 hour of high-quality programming with adult supervision",
        maxScreenTime: 60,
        recommendedDistribution: {
          physical: 35,
          creative: 25,
          educational: 25,
          social: 15,
          screen: 0,
        },
        playActivities: {
          physical: "Walking, climbing, dancing, ball play, playground time",
          creative: "Finger painting, play dough, simple pretend play, music",
          educational:
            "Shape sorters, simple puzzles, stacking blocks, picture books",
          social:
            "Parallel play, simple games with adults, observing other children",
          screen:
            "Limit to high-quality educational content with adult interaction",
        },
      };
    } else if (ageInMonths >= 36 && ageInMonths < 72) {
      // 3-6 years
      return {
        ageGroup: "Preschooler (3-6 years)",
        totalPlaytimePerDay: "120-180 minutes",
        minPlaytime: 120,
        maxPlaytime: 180,
        screenTimeRecommendation: "Maximum 1 hour of high-quality programming",
        maxScreenTime: 60,
        recommendedDistribution: {
          physical: 30,
          creative: 25,
          educational: 25,
          social: 20,
          screen: 0,
        },
        playActivities: {
          physical: "Running, jumping, bike riding, ball games, swimming",
          creative: "Art projects, dress-up, role play, building, music",
          educational:
            "Puzzles, board games, counting games, science experiments",
          social:
            "Cooperative play, sharing, turn-taking games, group activities",
          screen: "Educational apps and shows, video chats with family",
        },
      };
    } else {
      // 6+ years
      return {
        ageGroup: "School-age (6+ years)",
        totalPlaytimePerDay: "60-120 minutes",
        minPlaytime: 60,
        maxPlaytime: 120,
        screenTimeRecommendation: "Maximum 2 hours of recreational screen time",
        maxScreenTime: 120,
        recommendedDistribution: {
          physical: 35,
          creative: 20,
          educational: 25,
          social: 20,
          screen: 0,
        },
        playActivities: {
          physical:
            "Sports, bike riding, playground games, dancing, martial arts",
          creative: "Crafts, drawing, building models, music, creative writing",
          educational:
            "Reading, strategy games, coding, science kits, math games",
          social: "Team sports, board games, clubs, cooperative projects",
          screen:
            "Balance with other activities, prioritize educational content",
        },
      };
    }
  };

  const recommendations = getPlaytimeRecommendations(childAgeInMonths);

  // Handle input change with validation
  const handleInputChange = (value, setter) => {
    // Validate input to only allow numbers with max 3 digits
    const validatedValue = value.replace(/[^0-9]/g, "");

    // Limit to max 3 digits
    if (validatedValue.length > 3) {
      return;
    }

    setter(validatedValue);
  };

  // Check if playtime meets recommendations
  const isPlaytimeSufficient = totalPlaytime >= recommendations.minPlaytime;
  const isScreenTimeExcessive =
    Number.parseInt(screenTime) > recommendations.maxScreenTime;

  // Calculate the percentage of recommended playtime
  const calculatePlaytimePercentage = () => {
    const percentage = Math.round(
      (totalPlaytime / recommendations.minPlaytime) * 100
    );
    return Math.min(percentage, 100);
  };

  const playtimePercentage = calculatePlaytimePercentage();

  // Calculate the percentage difference from recommended playtime
  const calculatePlaytimeDifferencePercentage = () => {
    const diff = totalPlaytime - recommendations.minPlaytime;
    const percentage = Math.round((diff / recommendations.minPlaytime) * 100);
    return percentage;
  };

  const playtimeDiffPercentage = calculatePlaytimeDifferencePercentage();
  const playtimeDiffPercentageText =
    playtimeDiffPercentage >= 0
      ? `+${playtimeDiffPercentage}%`
      : `${playtimeDiffPercentage}%`;

  // Prepare data for pie chart
  const getPieChartData = () => {
    const data = [
      {
        name: "Physical",
        population: Number.parseInt(physicalPlay) || 0,
        color: "#FF2D55",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      },
      {
        name: "Creative",
        population: Number.parseInt(creativePlay) || 0,
        color: "#FF9500",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      },
      {
        name: "Educational",
        population: Number.parseInt(educationalPlay) || 0,
        color: "#5A87FF",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      },
      {
        name: "Social",
        population: Number.parseInt(socialPlay) || 0,
        color: "#4CD964",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      },
    ];

    // Only add screen time to the chart if it's greater than 0
    if (Number.parseInt(screenTime) > 0) {
      data.push({
        name: "Screen Time",
        population: Number.parseInt(screenTime) || 0,
        color: "#5856D6",
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
      });
    }

    return data.filter((item) => item.population > 0);
  };

  // Prepare data for daily distribution bar chart
  const getBarChartData = () => {
    return {
      labels: ["Physical", "Creative", "Educational", "Social", "Screen"],
      datasets: [
        {
          data: [
            Number.parseInt(physicalPlay) || 0,
            Number.parseInt(creativePlay) || 0,
            Number.parseInt(educationalPlay) || 0,
            Number.parseInt(socialPlay) || 0,
            Number.parseInt(screenTime) || 0,
          ],
        },
      ],
    };
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
      title: `${currentChild.name.split(" ")[0]}'s Playtime Details`,
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

        {/* Playtime Distribution Chart */}
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
              Playtime Distribution
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
                  name="game-controller-outline"
                  size={48}
                  color={theme.textTertiary}
                />
                <Text
                  style={[
                    styles.emptyChartText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Enter playtime minutes to see distribution
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.totalPlaytimeContainer,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <Text
              style={[
                styles.totalPlaytimeLabel,
                { color: theme.textSecondary },
              ]}
            >
              Total Daily Playtime
            </Text>
            <Text
              style={[
                styles.totalPlaytimeValue,
                {
                  color: isPlaytimeSufficient ? theme.success : theme.danger,
                },
              ]}
            >
              {totalPlaytime} minutes
            </Text>
            <Text
              style={[
                styles.recommendedPlaytime,
                { color: theme.textSecondary },
              ]}
            >
              Recommended: {recommendations.totalPlaytimePerDay} minutes
            </Text>
          </View>
        </View>

        {/* Daily Distribution Bar Chart */}
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name="bar-chart"
              size={24}
              color={theme.text}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Daily Activity Breakdown
            </Text>
          </View>

          <View style={styles.chartWrapper}>
            {totalPlaytime > 0 ? (
              <BarChart
                data={getBarChartData()}
                width={screenWidth - 64}
                height={220}
                yAxisSuffix=" min"
                chartConfig={{
                  backgroundGradientFrom: theme.cardBackground,
                  backgroundGradientTo: theme.cardBackground,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            ) : (
              <View style={styles.emptyChartContainer}>
                <Ionicons
                  name="bar-chart-outline"
                  size={48}
                  color={theme.textTertiary}
                />
                <Text
                  style={[
                    styles.emptyChartText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Enter playtime minutes to see daily breakdown
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Playtime Inputs */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.inputTitle, { color: theme.text }]}>
            Record Today's Playtime
          </Text>
          <Text style={[styles.inputSubtitle, { color: theme.textSecondary }]}>
            Enter minutes spent on each type of play activity
          </Text>

          <View style={styles.playInputsContainer}>
            {/* Physical Play */}
            <View
              style={[
                styles.playInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.playLabelContainer}>
                <View
                  style={[styles.playIcon, { backgroundColor: "#FF2D5520" }]}
                >
                  <Ionicons name="body" size={16} color="#FF2D55" />
                </View>
                <Text style={[styles.playLabel, { color: theme.text }]}>
                  Physical Play
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
                  value={physicalPlay}
                  onChangeText={(value) =>
                    handleInputChange(value, setPhysicalPlay)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  min
                </Text>
              </View>
            </View>

            {/* Creative Play */}
            <View
              style={[
                styles.playInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.playLabelContainer}>
                <View
                  style={[styles.playIcon, { backgroundColor: "#FF950020" }]}
                >
                  <Ionicons name="color-palette" size={16} color="#FF9500" />
                </View>
                <Text style={[styles.playLabel, { color: theme.text }]}>
                  Creative Play
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
                  value={creativePlay}
                  onChangeText={(value) =>
                    handleInputChange(value, setCreativePlay)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  min
                </Text>
              </View>
            </View>

            {/* Educational Play */}
            <View
              style={[
                styles.playInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.playLabelContainer}>
                <View
                  style={[styles.playIcon, { backgroundColor: "#5A87FF20" }]}
                >
                  <Ionicons name="book" size={16} color="#5A87FF" />
                </View>
                <Text style={[styles.playLabel, { color: theme.text }]}>
                  Educational Play
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
                  value={educationalPlay}
                  onChangeText={(value) =>
                    handleInputChange(value, setEducationalPlay)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  min
                </Text>
              </View>
            </View>

            {/* Social Play */}
            <View
              style={[
                styles.playInputRow,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.playLabelContainer}>
                <View
                  style={[styles.playIcon, { backgroundColor: "#4CD96420" }]}
                >
                  <Ionicons name="people" size={16} color="#4CD964" />
                </View>
                <Text style={[styles.playLabel, { color: theme.text }]}>
                  Social Play
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
                  value={socialPlay}
                  onChangeText={(value) =>
                    handleInputChange(value, setSocialPlay)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  min
                </Text>
              </View>
            </View>

            {/* Screen Time */}
            <View style={styles.playInputRow}>
              <View style={styles.playLabelContainer}>
                <View
                  style={[styles.playIcon, { backgroundColor: "#5856D620" }]}
                >
                  <Ionicons name="tv" size={16} color="#5856D6" />
                </View>
                <Text style={[styles.playLabel, { color: theme.text }]}>
                  Screen Time
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: isScreenTimeExcessive
                      ? theme.danger
                      : theme.borderLight,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isScreenTimeExcessive ? theme.danger : theme.text,
                    },
                  ]}
                  value={screenTime}
                  onChangeText={(value) =>
                    handleInputChange(value, setScreenTime)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textTertiary}
                />
                <Text
                  style={[styles.inputUnit, { color: theme.textSecondary }]}
                >
                  min
                </Text>
              </View>
            </View>

            {isScreenTimeExcessive && (
              <View style={styles.screenTimeWarning}>
                <Ionicons
                  name="warning"
                  size={16}
                  color={theme.danger}
                  style={styles.warningIcon}
                />
                <Text style={[styles.warningText, { color: theme.danger }]}>
                  Screen time exceeds recommended maximum of{" "}
                  {recommendations.maxScreenTime} minutes
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={() =>
              console.log("Saved playtime data:", {
                physical: physicalPlay,
                creative: creativePlay,
                educational: educationalPlay,
                social: socialPlay,
                screen: screenTime,
                total: totalPlaytime,
              })
            }
          >
            <Ionicons
              name="save"
              size={16}
              color="#FFFFFF"
              style={styles.saveButtonIcon}
            />
            <Text style={styles.saveButtonText}>Save Playtime Data</Text>
          </TouchableOpacity>
        </View>

        {/* Playtime Summary */}
        <View
          style={[
            styles.totalSummaryContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: isPlaytimeSufficient ? "transparent" : theme.danger,
              borderWidth: isPlaytimeSufficient ? 0 : 2,
            },
          ]}
        >
          <Text
            style={[styles.totalSummaryLabel, { color: theme.textSecondary }]}
          >
            Total Daily Playtime
          </Text>
          <Text
            style={[
              styles.totalSummaryValue,
              {
                color: isPlaytimeSufficient ? theme.success : theme.danger,
              },
            ]}
          >
            {totalPlaytime} minutes
          </Text>
          <Text
            style={[
              styles.totalSummaryRecommended,
              { color: theme.textSecondary },
            ]}
          >
            Recommended: {recommendations.totalPlaytimePerDay}
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
                  {
                    color: isPlaytimeSufficient ? theme.success : theme.danger,
                  },
                ]}
              >
                {playtimePercentage}%
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
                    width: `${playtimePercentage}%`,
                    backgroundColor: isPlaytimeSufficient
                      ? theme.success
                      : theme.danger,
                  },
                ]}
              />
            </View>
          </View>

          {/* Total playtime percentage chart with positive/negative values */}
          <View style={styles.totalPercentageContainer}>
            <View style={styles.percentageRow}>
              <Text
                style={[
                  styles.totalPercentageLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Compared to minimum goal ({recommendations.minPlaytime} min):
              </Text>

              {/* Display percentage with + or - sign */}
              <Text
                style={[
                  styles.percentageText,
                  {
                    color:
                      playtimeDiffPercentage >= 0
                        ? theme.success
                        : theme.danger,
                    fontSize: 16,
                    fontWeight: "700",
                  },
                ]}
              >
                {playtimeDiffPercentageText}
              </Text>
            </View>

            {/* Progress bar for positive/negative values */}
            <View style={styles.totalProgressBarContainer}>
              {/* Center line (0%) */}
              <View style={styles.centerLine} />

              {/* Negative bar (if applicable) */}
              {playtimeDiffPercentage < 0 && (
                <View
                  style={[
                    styles.negativeProgressBar,
                    {
                      width: `${Math.min(
                        50,
                        Math.abs(playtimeDiffPercentage) / 2
                      )}%`,
                      backgroundColor: theme.danger,
                    },
                  ]}
                />
              )}

              {/* Positive bar (if applicable) */}
              {playtimeDiffPercentage > 0 && (
                <View
                  style={[
                    styles.positiveProgressBar,
                    {
                      width: `${Math.min(50, playtimeDiffPercentage / 2)}%`,
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

          {!isPlaytimeSufficient && (
            <View style={styles.warningContainer}>
              <Ionicons
                name="warning"
                size={18}
                color={theme.danger}
                style={styles.warningIcon}
              />
              <Text style={[styles.warningText, { color: theme.danger }]}>
                Playtime below recommended minimum of{" "}
                {recommendations.minPlaytime} minutes
              </Text>
            </View>
          )}
        </View>

        {/* Recommended Play Activities */}
        <View
          style={[
            styles.activitiesContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recommended Play Activities
          </Text>

          <View style={styles.activitiesContent}>
            <View
              style={[styles.activityCard, { backgroundColor: "#FF2D5510" }]}
            >
              <View
                style={[
                  styles.activityIconContainer,
                  { backgroundColor: "#FF2D5520" },
                ]}
              >
                <Ionicons name="body" size={24} color="#FF2D55" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>
                  Physical Play
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.playActivities.physical}
                </Text>
                <View style={styles.activityPercentageRow}>
                  <Text
                    style={[
                      styles.activityPercentageLabel,
                      { color: "#FF2D55" },
                    ]}
                  >
                    Target: {recommendations.recommendedDistribution.physical}%
                  </Text>
                  <Text
                    style={[
                      styles.activityPercentageValue,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {totalPlaytime > 0
                      ? `${Math.round(
                          (Number.parseInt(physicalPlay) / totalPlaytime) * 100
                        )}%`
                      : "0%"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.activityCard, { backgroundColor: "#FF950010" }]}
            >
              <View
                style={[
                  styles.activityIconContainer,
                  { backgroundColor: "#FF950020" },
                ]}
              >
                <Ionicons name="color-palette" size={24} color="#FF9500" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>
                  Creative Play
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.playActivities.creative}
                </Text>
                <View style={styles.activityPercentageRow}>
                  <Text
                    style={[
                      styles.activityPercentageLabel,
                      { color: "#FF9500" },
                    ]}
                  >
                    Target: {recommendations.recommendedDistribution.creative}%
                  </Text>
                  <Text
                    style={[
                      styles.activityPercentageValue,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {totalPlaytime > 0
                      ? `${Math.round(
                          (Number.parseInt(creativePlay) / totalPlaytime) * 100
                        )}%`
                      : "0%"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.activityCard, { backgroundColor: "#5A87FF10" }]}
            >
              <View
                style={[
                  styles.activityIconContainer,
                  { backgroundColor: "#5A87FF20" },
                ]}
              >
                <Ionicons name="book" size={24} color="#5A87FF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>
                  Educational Play
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.playActivities.educational}
                </Text>
                <View style={styles.activityPercentageRow}>
                  <Text
                    style={[
                      styles.activityPercentageLabel,
                      { color: "#5A87FF" },
                    ]}
                  >
                    Target:{" "}
                    {recommendations.recommendedDistribution.educational}%
                  </Text>
                  <Text
                    style={[
                      styles.activityPercentageValue,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {totalPlaytime > 0
                      ? `${Math.round(
                          (Number.parseInt(educationalPlay) / totalPlaytime) *
                            100
                        )}%`
                      : "0%"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.activityCard, { backgroundColor: "#4CD96410" }]}
            >
              <View
                style={[
                  styles.activityIconContainer,
                  { backgroundColor: "#4CD96420" },
                ]}
              >
                <Ionicons name="people" size={24} color="#4CD964" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>
                  Social Play
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.playActivities.social}
                </Text>
                <View style={styles.activityPercentageRow}>
                  <Text
                    style={[
                      styles.activityPercentageLabel,
                      { color: "#4CD964" },
                    ]}
                  >
                    Target: {recommendations.recommendedDistribution.social}%
                  </Text>
                  <Text
                    style={[
                      styles.activityPercentageValue,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {totalPlaytime > 0
                      ? `${Math.round(
                          (Number.parseInt(socialPlay) / totalPlaytime) * 100
                        )}%`
                      : "0%"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.activityCard, { backgroundColor: "#5856D610" }]}
            >
              <View
                style={[
                  styles.activityIconContainer,
                  { backgroundColor: "#5856D620" },
                ]}
              >
                <Ionicons name="tv" size={24} color="#5856D6" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>
                  Screen Time
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {recommendations.playActivities.screen}
                </Text>
                <View style={styles.activityPercentageRow}>
                  <Text
                    style={[
                      styles.activityPercentageLabel,
                      {
                        color: isScreenTimeExcessive ? theme.danger : "#5856D6",
                      },
                    ]}
                  >
                    Limit: {recommendations.maxScreenTime} minutes
                  </Text>
                  <Text
                    style={[
                      styles.activityPercentageValue,
                      {
                        color: isScreenTimeExcessive
                          ? theme.danger
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {screenTime} min
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Playtime Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Age-Appropriate Play Tips
          </Text>
          <View style={styles.tipsList}>
            {childAgeInMonths < 12 ? (
              // 0-12 months tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Provide colorful toys with different textures and sounds to
                    stimulate sensory development
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
                    Engage in face-to-face interaction with lots of smiling,
                    talking, and singing
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
                    Ensure daily tummy time to strengthen neck and shoulder
                    muscles
                  </Text>
                </View>
              </>
            ) : childAgeInMonths >= 12 && childAgeInMonths < 36 ? (
              // 1-3 years tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Offer toys that encourage problem-solving like shape sorters
                    and simple puzzles
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
                    Provide opportunities for active play like dancing,
                    climbing, and running
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
                    Read together daily and encourage pretend play with simple
                    props
                  </Text>
                </View>
              </>
            ) : childAgeInMonths >= 36 && childAgeInMonths < 72 ? (
              // 3-6 years tips
              <>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.tipIcon}
                  />
                  <Text style={[styles.tipText, { color: theme.text }]}>
                    Encourage imaginative play with dress-up clothes, puppets,
                    and building materials
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
                    Introduce simple board games to develop turn-taking and
                    following rules
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
                    Provide opportunities for social play with peers to develop
                    cooperation skills
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
                    Support interests in sports, arts, or other activities that
                    build skills and confidence
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
                    Encourage problem-solving with strategy games, puzzles, and
                    building projects
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
                    Balance structured activities with free play time to foster
                    creativity and independence
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
  totalPlaytimeContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalPlaytimeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalPlaytimeValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  recommendedPlaytime: {
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
  playInputsContainer: {
    marginBottom: 16,
  },
  playInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  playLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  playLabel: {
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
  screenTimeWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
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
  activitiesContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activitiesContent: {
    marginTop: 16,
  },
  activityCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  activityPercentageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityPercentageLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  activityPercentageValue: {
    fontSize: 13,
    fontWeight: "600",
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
