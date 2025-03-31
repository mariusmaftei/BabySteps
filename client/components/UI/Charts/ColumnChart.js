import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme-context";
import { useMemo } from "react";

const MAX_BAR_HEIGHT = 150;

export default function ColumnChart({
  data,
  targetValues,
  calculateBarHeight,
  getMaxValue,
  title,
  showLegend = true,
  showTargetLegend = false,
  targetLegendText = "Recommended Daily Target",
}) {
  const { theme } = useTheme();

  const isArrayFormat = Array.isArray(data);

  const calculations = useMemo(() => {
    const defaultGetMaxValue = () => {
      let values = [];
      if (isArrayFormat) {
        values = data?.map((item) => item.value) || [];
      } else if (data && Array.isArray(data.data)) {
        values = data.data;
      } else {
        return 10;
      }

      const targets = targetValues || [];
      return Math.max(...values, ...targets, 10);
    };

    const defaultCalculateBarHeight = (value, maxValue) => {
      const scaleFactor = MAX_BAR_HEIGHT / maxValue;
      return Math.min(value * scaleFactor, MAX_BAR_HEIGHT);
    };

    const getMaxValueFn = getMaxValue || defaultGetMaxValue;
    const calculateBarHeightFn =
      calculateBarHeight || defaultCalculateBarHeight;
    const maxValue = getMaxValueFn();

    return {
      maxValue,
      calculateBarHeightFn,
    };
  }, [data, isArrayFormat, targetValues, calculateBarHeight, getMaxValue]);

  const { maxValue, calculateBarHeightFn } = calculations;

  const renderBars = () => {
    if (!data) return null;

    if (isArrayFormat) {
      return (
        <View style={styles.barsWrapper}>
          {data.map((item, index) => {
            const barHeight = calculateBarHeightFn(item.value, maxValue);

            return (
              <View key={index} style={styles.barColumn}>
                <View
                  style={[
                    styles.barIcon,
                    { backgroundColor: `${item.color}30` },
                  ]}
                >
                  {typeof item.icon === "string" ? (
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  ) : (
                    item.icon || (
                      <Ionicons
                        name="stats-chart"
                        size={16}
                        color={item.color}
                      />
                    )
                  )}
                </View>

                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight > 0 ? barHeight : 2,
                      backgroundColor: item.color,
                      opacity: item.value > 0 ? 1 : 0.3,
                    },
                  ]}
                />
                <Text style={[styles.barValue, { color: item.color }]}>
                  {item.value} {item.unit || ""}
                </Text>
                <Text
                  style={[styles.barLabel, { color: theme.textSecondary }]}
                ></Text>
              </View>
            );
          })}
        </View>
      );
    } else if (data && Array.isArray(data.data)) {
      return (
        <View style={styles.barsWrapper}>
          {data.data.map((value, index) => {
            const barHeight = calculateBarHeightFn(value, maxValue);
            const color = data.colors[index];
            const icon = data.icons[index];

            return (
              <View key={index} style={styles.barColumn}>
                <View
                  style={[styles.barIcon, { backgroundColor: `${color}30` }]}
                >
                  {typeof icon === "string" ? (
                    <Text style={{ fontSize: 16 }}>{icon}</Text>
                  ) : (
                    icon || (
                      <Ionicons name="stats-chart" size={16} color={color} />
                    )
                  )}
                </View>

                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight > 0 ? barHeight : 2,
                      backgroundColor: color,
                      opacity: value > 0 ? 1 : 0.3,
                    },
                  ]}
                />
                <Text style={[styles.barValue, { color: color }]}>
                  {value} {data.unit || ""}
                </Text>
                <Text
                  style={[styles.barLabel, { color: theme.textSecondary }]}
                ></Text>
              </View>
            );
          })}
        </View>
      );
    }

    return null;
  };

  const renderTargetLines = () => {
    if (!targetValues || !showTargetLegend) return null;

    if (isArrayFormat) {
      return (
        <View style={styles.targetLinesContainer}>
          {data.map((item, index) => {
            if (!targetValues[index]) return null;

            const barWidth = 18;
            const leftPosition = 8 + index * 33;

            return (
              <View
                key={`target-${index}`}
                style={[
                  styles.targetLine,
                  {
                    bottom: calculateBarHeightFn(targetValues[index], maxValue),
                    left: `${leftPosition}%`,
                    width: `${barWidth}%`,
                    backgroundColor: `${item.color}80`,
                  },
                ]}
              />
            );
          })}
        </View>
      );
    } else if (data && Array.isArray(data.data)) {
      return (
        <View style={styles.targetLinesContainer}>
          {data.data.map((value, index) => {
            if (!targetValues[index]) return null;

            const barWidth = 18;
            const leftPosition = 8 + index * 33;

            return (
              <View
                key={`target-${index}`}
                style={[
                  styles.targetLine,
                  {
                    bottom: calculateBarHeightFn(targetValues[index], maxValue),
                    left: `${leftPosition}%`,
                    width: `${barWidth}%`,
                    backgroundColor: `${data.colors[index]}80`,
                  },
                ]}
              />
            );
          })}
        </View>
      );
    }

    return null;
  };

  const renderLegend = () => {
    if (!showLegend) return null;

    if (isArrayFormat) {
      return (
        <View style={[styles.legend, { borderTopColor: theme.borderLight }]}>
          {data.map((item, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: item.color }]}
              />
              <Text style={[styles.legendText, { color: theme.text }]}>
                {item.label || item.name || ""}
              </Text>
            </View>
          ))}
        </View>
      );
    } else if (data && Array.isArray(data.labels)) {
      return (
        <View style={[styles.legend, { borderTopColor: theme.borderLight }]}>
          {data.labels.map((label, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: data.colors[index] },
                ]}
              />
              <Text style={[styles.legendText, { color: theme.text }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      {title && (
        <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
          <Ionicons
            name="bar-chart"
            size={24}
            color={theme.text}
            style={styles.headerIcon}
          />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
      )}

      <View style={styles.chartContainer}>
        <View style={styles.barContainer}>{renderBars()}</View>
        {renderTargetLines()}
      </View>

      {renderLegend()}

      {showTargetLegend && targetValues && (
        <View style={styles.targetLegendContainer}>
          <View style={styles.targetLegendItem}>
            <View
              style={[
                styles.targetLegendLine,
                { backgroundColor: theme.success },
              ]}
            />
            <Text
              style={[styles.targetLegendText, { color: theme.textSecondary }]}
            >
              {targetLegendText}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    paddingTop: 24,
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
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 10,
    height: 250,
    marginTop: 10,
    position: "relative",
  },
  barContainer: {
    flex: 1,
    flexDirection: "row",
    height: MAX_BAR_HEIGHT,
    alignItems: "flex-end",
  },
  barsWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
  },
  barColumn: {
    alignItems: "center",
    width: 60,
  },
  barIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  bar: {
    width: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    maxHeight: 150,
  },
  barValue: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  barLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  targetLinesContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  targetLine: {
    position: "absolute",
    height: 2,
    borderRadius: 1,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  targetLegendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  targetLegendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  targetLegendLine: {
    width: 16,
    height: 2,
    marginRight: 6,
  },
  targetLegendText: {
    fontSize: 12,
  },
});
