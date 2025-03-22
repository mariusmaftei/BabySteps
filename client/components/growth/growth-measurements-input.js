import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GrowthMeasurementsInput = ({
  theme,
  isEditMode,
  hasExistingMeasurements,
  latestRecord,
  setIsEditMode,
  formatDate,
  previousRecord,
  previousWeight,
  handleWeightChange,
  currentWeight,
  previousHeight,
  handleMeasurementChange,
  setPreviousHeight,
  currentHeight,
  setCurrentHeight,
  previousHeadCirc,
  setPreviousHeadCirc,
  currentHeadCirc,
  setCurrentHeadCirc,
  notes,
  setNotes,
  weightGain,
  heightGain,
  headCircGain,
  loading,
  saveGrowthData,
}) => {
  return (
    <View
      style={[styles.inputContainer, { backgroundColor: theme.cardBackground }]}
    >
      <View style={styles.inputHeaderRow}>
        <Text style={[styles.inputTitle, { color: theme.text }]}>
          {isEditMode
            ? "Record Growth Measurements"
            : hasExistingMeasurements
            ? "Current Growth Measurements"
            : "Enter First Measurement"}
        </Text>
      </View>

      <Text style={[styles.inputSubtitle, { color: theme.textSecondary }]}>
        {isEditMode
          ? "Enter current and previous week's measurements"
          : hasExistingMeasurements
          ? `Last updated: ${
              latestRecord ? formatDate(latestRecord.recordDate) : "Never"
            }`
          : "Enter your child's first growth measurements"}
      </Text>

      {latestRecord && !isEditMode && (
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: theme.primary, marginBottom: 16 },
          ]}
          onPress={() => setIsEditMode(true)}
        >
          <Ionicons
            name="create"
            size={16}
            color="#FFFFFF"
            style={styles.editButtonIcon}
          />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      )}

      {isEditMode || !hasExistingMeasurements ? (
        <>
          {/* Weight Inputs */}
          <View
            style={[
              styles.measurementSection,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <View style={styles.measurementHeader}>
              <Ionicons
                name="fitness"
                size={20}
                color="#5A87FF"
                style={styles.measurementIcon}
              />
              <Text style={[styles.measurementTitle, { color: theme.text }]}>
                Weight
              </Text>
            </View>

            <View style={styles.inputRow}>
              {previousRecord !== null && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Previous Week
                  </Text>
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
                      value={previousWeight}
                      onChangeText={(value) =>
                        handleWeightChange("previous", value)
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.textTertiary}
                      editable={false} // Previous values are not editable
                    />
                    <Text
                      style={[styles.inputUnit, { color: theme.textSecondary }]}
                    >
                      g
                    </Text>
                  </View>
                </View>
              )}

              <View
                style={
                  previousRecord !== null
                    ? styles.inputGroup
                    : { width: "100%" }
                }
              >
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  {hasExistingMeasurements ? "Current Week" : "New Measurement"}
                </Text>
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
                    value={currentWeight}
                    onChangeText={(value) =>
                      handleWeightChange("current", value)
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
            </View>
          </View>

          {/* Height Inputs */}
          <View
            style={[
              styles.measurementSection,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <View style={styles.measurementHeader}>
              <Ionicons
                name="resize"
                size={20}
                color="#FF9500"
                style={styles.measurementIcon}
              />
              <Text style={[styles.measurementTitle, { color: theme.text }]}>
                Height
              </Text>
            </View>

            <View style={styles.inputRow}>
              {previousRecord !== null && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Previous Week
                  </Text>
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
                      value={previousHeight}
                      onChangeText={(value) =>
                        handleMeasurementChange(
                          "previous",
                          value,
                          setPreviousHeight
                        )
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.textTertiary}
                      editable={false} // Previous values are not editable
                    />
                    <Text
                      style={[styles.inputUnit, { color: theme.textSecondary }]}
                    >
                      mm
                    </Text>
                  </View>
                </View>
              )}

              <View
                style={
                  previousRecord !== null
                    ? styles.inputGroup
                    : { width: "100%" }
                }
              >
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  {hasExistingMeasurements ? "Current Week" : "New Measurement"}
                </Text>
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
                    value={currentHeight}
                    onChangeText={(value) =>
                      handleMeasurementChange(
                        "current",
                        value,
                        setCurrentHeight
                      )
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    mm
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Head Circumference Inputs */}
          <View style={styles.measurementSection}>
            <View style={styles.measurementHeader}>
              <Ionicons
                name="ellipse-outline"
                size={20}
                color="#FF2D55"
                style={styles.measurementIcon}
              />
              <Text style={[styles.measurementTitle, { color: theme.text }]}>
                Head Circumference
              </Text>
            </View>

            <View style={styles.inputRow}>
              {previousRecord !== null && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Previous Week
                  </Text>
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
                      value={previousHeadCirc}
                      onChangeText={(value) =>
                        handleMeasurementChange(
                          "previous",
                          value,
                          setPreviousHeadCirc
                        )
                      }
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.textTertiary}
                      editable={false} // Previous values are not editable
                    />
                    <Text
                      style={[styles.inputUnit, { color: theme.textSecondary }]}
                    >
                      mm
                    </Text>
                  </View>
                </View>
              )}

              <View
                style={
                  previousRecord !== null
                    ? styles.inputGroup
                    : { width: "100%" }
                }
              >
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  {hasExistingMeasurements ? "Current Week" : "New Measurement"}
                </Text>
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
                    value={currentHeadCirc}
                    onChangeText={(value) =>
                      handleMeasurementChange(
                        "current",
                        value,
                        setCurrentHeadCirc
                      )
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.inputUnit, { color: theme.textSecondary }]}
                  >
                    mm
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes Input */}
          <View style={styles.notesSection}>
            <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>
              Notes (optional)
            </Text>
            <View
              style={[
                styles.notesWrapper,
                {
                  borderColor: theme.borderLight,
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
            >
              <TextInput
                style={[styles.notesInput, { color: theme.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this growth measurement..."
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </>
      ) : (
        // View mode - show summary of measurements
        <View style={styles.measurementSummary}>
          <View
            style={[
              styles.summaryRow,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <View style={styles.summaryIconContainer}>
              <Ionicons name="fitness" size={24} color="#5A87FF" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Weight
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {currentWeight} g
              </Text>
            </View>
            <View style={styles.summaryChangeContainer}>
              <Text
                style={[
                  styles.summaryChangeLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Change
              </Text>
              <Text
                style={[
                  styles.summaryChangeValue,
                  { color: weightGain >= 0 ? theme.success : theme.danger },
                ]}
              >
                {weightGain > 0 ? "+" : ""}
                {weightGain} g
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.summaryRow,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <View style={styles.summaryIconContainer}>
              <Ionicons name="resize" size={24} color="#FF9500" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Height
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {currentHeight} mm
              </Text>
            </View>
            <View style={styles.summaryChangeContainer}>
              <Text
                style={[
                  styles.summaryChangeLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Change
              </Text>
              <Text
                style={[
                  styles.summaryChangeValue,
                  { color: heightGain >= 0 ? theme.success : theme.danger },
                ]}
              >
                {heightGain > 0 ? "+" : ""}
                {heightGain} mm
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="ellipse-outline" size={24} color="#FF2D55" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                Head Circumference
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {currentHeadCirc} mm
              </Text>
            </View>
            <View style={styles.summaryChangeContainer}>
              <Text
                style={[
                  styles.summaryChangeLabel,
                  { color: theme.textSecondary },
                ]}
              >
                Change
              </Text>
              <Text
                style={[
                  styles.summaryChangeValue,
                  {
                    color: headCircGain >= 0 ? theme.success : theme.danger,
                  },
                ]}
              >
                {headCircGain > 0 ? "+" : ""}
                {headCircGain} mm
              </Text>
            </View>
          </View>

          {latestRecord && latestRecord.notes && (
            <View
              style={[
                styles.notesSummary,
                { backgroundColor: `${theme.primary}10` },
              ]}
            >
              <Ionicons
                name="document-text"
                size={18}
                color={theme.primary}
                style={styles.notesSummaryIcon}
              />
              <Text style={[styles.notesSummaryText, { color: theme.text }]}>
                {latestRecord.notes}
              </Text>
            </View>
          )}
        </View>
      )}

      {(isEditMode || !hasExistingMeasurements) && (
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={saveGrowthData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="save"
                size={16}
                color="#FFFFFF"
                style={styles.saveButtonIcon}
              />
              <Text style={styles.saveButtonText}>
                {hasExistingMeasurements
                  ? "Save Growth Data"
                  : "Save First Measurement"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    borderRadius: 8,
    marginBottom: 24,
    padding: 16,
  },
  inputHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonIcon: {
    marginRight: 4,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  inputSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  measurementSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  measurementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  measurementIcon: {
    marginRight: 8,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    width: "48%",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputUnit: {
    fontSize: 14,
    marginLeft: 8,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  notesWrapper: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notesInput: {
    fontSize: 16,
    textAlignVertical: "top",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  measurementSummary: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  summaryIconContainer: {
    marginRight: 12,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryChangeContainer: {
    marginLeft: 12,
    alignItems: "flex-end",
  },
  summaryChangeLabel: {
    fontSize: 12,
  },
  summaryChangeValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  notesSummary: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
  },
  notesSummaryIcon: {
    marginRight: 8,
  },
  notesSummaryText: {
    fontSize: 14,
  },
});

export default GrowthMeasurementsInput;
