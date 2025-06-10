import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";

const GrowthMeasurementsInput = memo(
  ({
    theme,
    isEditMode,
    hasExistingMeasurements,
    latestRecord,
    setIsEditMode,
    formatDate,
    handleWeightChange,
    currentWeight,
    handleMeasurementChange,
    currentHeight,
    setCurrentHeight,
    currentHeadCirc,
    setCurrentHeadCirc,
    notes,
    setNotes,
    loading,
    saveGrowthData,
  }) => {
    const formatValue = (value) => {
      if (!value) return 0;
      return Number.parseInt(value) || 0;
    };

    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
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
            ? "Enter current measurements"
            : hasExistingMeasurements
            ? `Last updated: ${
                latestRecord ? formatDate(latestRecord.recordDate) : "Never"
              }`
            : "Enter your child's first growth measurements"}
        </Text>

        {/* ONLY show Edit button if there are existing measurements for TODAY and not in edit mode */}
        {hasExistingMeasurements && !isEditMode && (
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

        {/* Show input fields and Save button if in edit mode OR no existing measurements for TODAY */}
        {isEditMode || !hasExistingMeasurements ? (
          <>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="fitness" size={18} color={theme.primary} />
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: theme.text, marginLeft: 5 },
                    ]}
                  >
                    Weight (g) <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.cardBackground,
                      color: theme.text,
                      borderColor:
                        !currentWeight && isEditMode
                          ? theme.danger
                          : theme.border,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={`${theme.text}50`}
                  keyboardType="numeric"
                  value={currentWeight}
                  onChangeText={(text) => {
                    const validatedText = text.replace(/[^0-9]/g, "");
                    if (validatedText.length <= 5) {
                      // Adjusted for grams
                      handleWeightChange("current", validatedText);
                    }
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="resize" size={18} color={theme.primary} />
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: theme.text, marginLeft: 5 },
                    ]}
                  >
                    Height (cm) <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.cardBackground,
                      color: theme.text,
                      borderColor:
                        !currentHeight && isEditMode
                          ? theme.danger
                          : theme.border,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={`${theme.text}50`}
                  keyboardType="numeric"
                  value={currentHeight}
                  onChangeText={(text) => {
                    const validatedText = text.replace(/[^0-9]/g, "");
                    if (validatedText.length <= 3) {
                      // Adjusted for cm
                      handleMeasurementChange(
                        "current",
                        validatedText,
                        setCurrentHeight
                      );
                    }
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons
                    name="ellipse-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: theme.text, marginLeft: 5 },
                    ]}
                  >
                    Head (cm) <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.cardBackground,
                      color: theme.text,
                      borderColor:
                        !currentHeadCirc && isEditMode
                          ? theme.danger
                          : theme.border,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={`${theme.text}50`}
                  keyboardType="numeric"
                  value={currentHeadCirc}
                  onChangeText={(text) => {
                    const validatedText = text.replace(/[^0-9]/g, "");
                    if (validatedText.length <= 3) {
                      // Adjusted for cm
                      handleMeasurementChange(
                        "current",
                        validatedText,
                        setCurrentHeadCirc
                      );
                    }
                  }}
                />
              </View>
            </View>

            <View style={styles.notesContainer}>
              <View style={styles.notesLabelContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.text, marginLeft: 5 },
                  ]}
                >
                  Notes
                </Text>
              </View>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: theme.cardBackground,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Add notes about this measurement..."
                placeholderTextColor={`${theme.text}50`}
                multiline={true}
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </>
        ) : (
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
                  {formatValue(currentWeight)} g
                </Text>
              </View>
              <View style={styles.summaryChangeContainer}>
                <Text
                  style={[
                    styles.summaryChangeValue,
                    { color: theme.textSecondary },
                  ]}
                >
                  Today
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
                  {formatValue(currentHeight)} cm
                </Text>
              </View>
              <View style={styles.summaryChangeContainer}>
                <Text
                  style={[
                    styles.summaryChangeValue,
                    { color: theme.textSecondary },
                  ]}
                >
                  Today
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
                  {formatValue(currentHeadCirc)} cm
                </Text>
              </View>
              <View style={styles.summaryChangeContainer}>
                <Text
                  style={[
                    styles.summaryChangeValue,
                    { color: theme.textSecondary },
                  ]}
                >
                  Today
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

        {/* Required fields note and Save button are shown under the same conditions as inputs */}
        {(isEditMode || !hasExistingMeasurements) && (
          <Text
            style={[styles.requiredFieldsNote, { color: theme.textSecondary }]}
          >
            <Text style={{ color: theme.danger }}>*</Text> Required fields
          </Text>
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
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
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
    marginBottom: 15,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  notesContainer: {
    marginBottom: 15,
  },
  notesLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
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
  lastMeasuredText: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 15,
  },
  previousMeasurementsContainer: {
    marginBottom: 15,
  },
  previousMeasurementsTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  previousMeasurementsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  previousMeasurementItem: {
    flex: 1,
    alignItems: "center",
  },
  previousMeasurementLabel: {
    fontSize: 12,
  },
  previousMeasurementValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  gainContainer: {
    marginBottom: 15,
  },
  gainTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  gainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gainItem: {
    flex: 1,
    alignItems: "center",
  },
  gainLabel: {
    fontSize: 12,
  },
  gainValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  positiveGain: {
    color: "#4CAF50",
  },
  negativeGain: {
    color: "#F44336",
  },
  inputLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  requiredFieldsNote: {
    fontSize: 12,
    marginBottom: 10,
    fontStyle: "italic",
  },
});

GrowthMeasurementsInput.displayName = "GrowthMeasurementsInput";

export default GrowthMeasurementsInput;
