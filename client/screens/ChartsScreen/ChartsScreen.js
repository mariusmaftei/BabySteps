import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/theme-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChildActivity } from "../../context/child-activity-context";

const screenWidth = Dimensions.get("window").width;

export default function ChartsScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentChild } = useChildActivity();
  const [activeTab, setActiveTab] = useState("Sleep");

  // Add a check for no children
  const noChildren = !currentChild || currentChild.id === "default";

  // If there are no children, show a message to add a child
  if (noChildren) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.noChildContainer}>
          <Ionicons
            name="bar-chart"
            size={60}
            color={theme.primary}
            style={styles.noChildIcon}
          />
          <Text style={[styles.noChildTitle, { color: theme.text }]}>
            No Data to Chart
          </Text>
          <Text
            style={[styles.noChildSubtitle, { color: theme.textSecondary }]}
          >
            Add a child in the settings to view charts and analytics
          </Text>
          <TouchableOpacity
            style={[styles.addChildButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color="#FFFFFF"
              style={styles.addChildButtonIcon}
            />
            <Text style={styles.addChildButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Chart configuration
  const getChartConfig = (color) => {
    return {
      backgroundGradientFrom: theme.cardBackground,
      backgroundGradientTo: theme.cardBackground,
      color: (opacity = 1) => `rgba(${hexToRgb(color)}, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      decimalPlaces: 0,
      labelColor: (opacity = 1) => `rgba(${hexToRgb(theme.text)}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: theme.cardBackground,
      },
    };
  };

  // Dummy data for each category
  const data = {
    Sleep: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          data: [8.5, 7.2, 9.1, 8.7, 8.3, 10.2, 9.5],
          color: (opacity = 1) => `rgba(90, 135, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Hours of sleep per day"],
      unit: "hours",
      type: "line",
    },
    Feeding: {
      labels: ["Breakfast", "Lunch", "Snack", "Dinner"],
      datasets: [
        {
          data: [180, 220, 120, 190],
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        },
      ],
      legend: ["Feeding amount (ml)"],
      unit: "ml",
      type: "bar",
    },
    Growth: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [4.2, 4.8, 5.3, 5.9, 6.4, 6.8],
          color: (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Weight (kg)"],
      unit: "kg",
      type: "line",
    },
    Playtime: {
      data: [
        {
          name: "Physical",
          population: 45,
          color: "#FF2D55",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        },
        {
          name: "Creative",
          population: 28,
          color: "#FF9500",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        },
        {
          name: "Educational",
          population: 17,
          color: "#5A87FF",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        },
        {
          name: "Social",
          population: 10,
          color: "#AF52DE",
          legendFontColor: theme.textSecondary,
          legendFontSize: 12,
        },
      ],
      legend: ["Play activity distribution (%)"],
      type: "pie",
    },
    Health: {
      labels: ["Weight", "Height", "Head", "BMI", "Teeth"],
      datasets: [
        {
          data: [85, 92, 88, 95, 70],
          color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
        },
      ],
      legend: ["Percentile (%)"],
      unit: "%",
      type: "bar",
    },
    Social: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          data: [3, 5, 4, 7],
          color: (opacity = 1) => `rgba(175, 82, 222, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Social interactions per day"],
      unit: "interactions",
      type: "line",
    },
  };

  // Custom colors for each category
  const categoryColors = {
    Sleep: "#5A87FF",
    Feeding: "#FF9500",
    Growth: "#4CD964",
    Playtime: "#FF2D55",
    Health: "#5856D6",
    Social: "#AF52DE",
  };

  // Render the appropriate chart based on data type
  const renderChart = (category) => {
    const chartData = data[category];
    const color = categoryColors[category];

    // Update chart config color based on category
    const categoryChartConfig = getChartConfig(color);

    if (chartData.type === "line") {
      return (
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: chartData.datasets,
            legend: chartData.legend,
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={categoryChartConfig}
          bezier
          style={styles.chart}
        />
      );
    } else if (chartData.type === "bar") {
      return (
        <BarChart
          data={{
            labels: chartData.labels,
            datasets: chartData.datasets,
            legend: chartData.legend,
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={categoryChartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      );
    } else if (chartData.type === "pie") {
      return (
        <PieChart
          data={chartData.data}
          width={screenWidth - 40}
          height={220}
          chartConfig={categoryChartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      );
    }
  };

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Render category tabs
  const renderTabs = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {Object.keys(data).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === category
                    ? categoryColors[category]
                    : theme.tabBackground,
              },
            ]}
            onPress={() => setActiveTab(category)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === category
                      ? theme.tabActiveText
                      : theme.tabInactiveText,
                },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Get icon for current category
  const getCategoryIcon = (category) => {
    const icons = {
      Sleep: "moon",
      Feeding: "restaurant",
      Growth: "trending-up",
      Playtime: "game-controller",
      Health: "medkit",
      Social: "people",
    };

    return icons[category] || "stats-chart";
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.text }]}>
            Charts & Analytics
          </Text>
          <Text style={[styles.subHeaderText, { color: theme.textSecondary }]}>
            Track progress and development
          </Text>
        </View>

        {renderTabs()}

        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.isDark ? "#000" : "#000",
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <Ionicons
              name={getCategoryIcon(activeTab)}
              size={24}
              color={categoryColors[activeTab]}
            />
            <Text
              style={[styles.chartTitle, { color: categoryColors[activeTab] }]}
            >
              {activeTab} Data
            </Text>
          </View>

          {renderChart(activeTab)}

          <View
            style={[
              styles.statsContainer,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Average
              </Text>
              <Text
                style={[styles.statValue, { color: categoryColors[activeTab] }]}
              >
                {activeTab === "Sleep"
                  ? "8.7 hrs"
                  : activeTab === "Feeding"
                  ? "178 ml"
                  : activeTab === "Growth"
                  ? "5.6 kg"
                  : activeTab === "Playtime"
                  ? "45 min"
                  : activeTab === "Health"
                  ? "86%"
                  : "4.8"}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Trend
              </Text>
              <Text
                style={[styles.statValue, { color: categoryColors[activeTab] }]}
              >
                {activeTab === "Sleep"
                  ? "+12%"
                  : activeTab === "Feeding"
                  ? "+5%"
                  : activeTab === "Growth"
                  ? "+12%"
                  : activeTab === "Feeding"
                  ? "+5%"
                  : activeTab === "Growth"
                  ? "+8%"
                  : activeTab === "Playtime"
                  ? "+15%"
                  : activeTab === "Health"
                  ? "Stable"
                  : "+20%"}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Goal
              </Text>
              <Text
                style={[styles.statValue, { color: categoryColors[activeTab] }]}
              >
                {activeTab === "Sleep"
                  ? "9 hrs"
                  : activeTab === "Feeding"
                  ? "200 ml"
                  : activeTab === "Growth"
                  ? "7 kg"
                  : activeTab === "Playtime"
                  ? "60 min"
                  : activeTab === "Health"
                  ? "90%"
                  : "7"}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.insightText,
              {
                color: theme.textSecondary,
                borderTopColor: theme.borderLight,
              },
            ]}
          >
            {activeTab === "Sleep"
              ? "Sleep patterns are improving. Consistent bedtime routine is working well."
              : activeTab === "Feeding"
              ? "Feeding amounts are increasing steadily. Consider introducing new foods."
              : activeTab === "Growth"
              ? "Growth is on track with expected development milestones."
              : activeTab === "Playtime"
              ? "Physical play dominates activity time. Consider more educational activities."
              : activeTab === "Health"
              ? "All health metrics are within normal ranges. Next checkup in 2 weeks."
              : "Social interactions are increasing. Group playdates are recommended."}
          </Text>
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
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 16,
    textAlign: "center",
  },
  tabsContainer: {
    paddingVertical: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  noChildContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noChildIcon: {
    marginBottom: 20,
  },
  noChildTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  noChildSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addChildButtonIcon: {
    marginRight: 8,
  },
  addChildButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
