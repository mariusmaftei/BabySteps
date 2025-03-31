"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import defaultChildImage from "../../../assets/images/default-child.png";

const AddChildModal = ({
  isVisible,
  onClose,
  onSave,
  initialData,
  theme,
  isEditing = false,
  handleSelectImage,
}) => {
  // State for child data
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childGender, setChildGender] = useState("male");
  const [childImage, setChildImage] = useState(null);
  const [childWeight, setChildWeight] = useState("");
  const [childHeight, setChildHeight] = useState("");
  const [childHeadCircumference, setChildHeadCircumference] = useState("");
  const [isSelectingImage, setIsSelectingImage] = useState(false);
  const [isUsingDefaultChildImage, setIsUsingDefaultChildImage] =
    useState(false);

  // Set initial data when editing
  useEffect(() => {
    if (initialData && isVisible) {
      setChildName(initialData.name || "");
      setChildAge(initialData.birthDate || "");
      setChildGender(initialData.gender || "male");
      setChildWeight(initialData.weight ? initialData.weight.toString() : "");
      setChildHeight(initialData.height ? initialData.height.toString() : "");
      setChildHeadCircumference(
        initialData.headCircumference
          ? initialData.headCircumference.toString()
          : ""
      );

      // Check if the child has a custom image or is using the default
      if (!initialData.imageSrc || initialData.imageSrc === "default") {
        setChildImage(null);
        setIsUsingDefaultChildImage(true);
      } else {
        setChildImage(initialData.imageSrc);
        setIsUsingDefaultChildImage(false);
      }
    } else {
      // Reset form when adding a new child
      resetForm();
    }
  }, [initialData, isVisible]);

  // Reset form fields
  const resetForm = () => {
    setChildName("");
    setChildAge("");
    setChildGender("male");
    setChildImage(null);
    setChildWeight("");
    setChildHeight("");
    setChildHeadCircumference("");
    setIsUsingDefaultChildImage(false);
  };

  const onSelectImage = async () => {
    if (isSelectingImage) return;

    try {
      setIsSelectingImage(true);
      const imageUri = await handleSelectImage();
      if (imageUri) {
        console.log("Setting child image to:", imageUri);
        setChildImage(imageUri);
        setIsUsingDefaultChildImage(false);
      }
    } catch (error) {
      console.error("Error in onSelectImage:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsSelectingImage(false);
    }
  };

  // Handle save
  const handleSave = () => {
    // Validation for adding a new child
    if (!isEditing) {
      if (childName.trim() === "" || childAge.trim() === "") {
        Alert.alert("Required Fields", "Please enter both name and birth date");
        return;
      }

      // Validate date format (DD/MM/YYYY)
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!dateRegex.test(childAge)) {
        Alert.alert(
          "Invalid Date",
          "Please enter the birth date in DD/MM/YYYY format"
        );
        return;
      }

      // Parse the date parts
      const [day, month, year] = childAge
        .split("/")
        .map((part) => Number.parseInt(part, 10));

      // Validate date values
      if (
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12 ||
        year < 1900 ||
        year > new Date().getFullYear()
      ) {
        Alert.alert("Invalid Date", "Please enter a valid birth date");
        return;
      }

      // Create date objects for validation
      const birthDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      // Check if birth date is in the future
      if (birthDate > today) {
        Alert.alert("Invalid Date", "Birth date cannot be in the future");
        return;
      }

      // Check if birth date is more than one year ago
      if (birthDate < oneYearAgo) {
        Alert.alert(
          "Invalid Date",
          "This app is only for infants under one year of age"
        );
        return;
      }

      // Validate weight, height, and head circumference
      if (childWeight.trim() === "") {
        Alert.alert(
          "Required Field",
          "Please enter the child's weight in grams"
        );
        return;
      }

      if (childHeight.trim() === "") {
        Alert.alert("Required Field", "Please enter the child's height in cm");
        return;
      }

      if (childHeadCircumference.trim() === "") {
        Alert.alert(
          "Required Field",
          "Please enter the child's head circumference in cm"
        );
        return;
      }

      // Validate that weight, height, and head circumference are numbers
      const weight = Number.parseInt(childWeight, 10);
      const height = Number.parseInt(childHeight, 10);
      const headCircumference = Number.parseInt(childHeadCircumference, 10);

      if (isNaN(weight) || weight <= 0) {
        Alert.alert("Invalid Weight", "Please enter a valid weight in grams");
        return;
      }

      if (isNaN(height) || height <= 0) {
        Alert.alert("Invalid Height", "Please enter a valid height in cm");
        return;
      }

      if (isNaN(headCircumference) || headCircumference <= 0) {
        Alert.alert(
          "Invalid Head Circumference",
          "Please enter a valid head circumference in cm"
        );
        return;
      }

      // Calculate age
      const birthDateForAge = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      const current = new Date();
      let ageYears = current.getFullYear() - birthDateForAge.getFullYear();
      let ageMonths = current.getMonth() - birthDateForAge.getMonth();

      if (
        ageMonths < 0 ||
        (ageMonths === 0 && current.getDate() < birthDateForAge.getDate())
      ) {
        ageYears--;
        ageMonths += 12;
      }

      // Format age string
      let ageString = "";
      if (ageYears > 0) {
        ageString += `${ageYears} year${ageYears !== 1 ? "s" : ""}`;
      }
      if (ageMonths > 0) {
        if (ageString.length > 0) ageString += ", ";
        ageString += `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;
      }
      if (ageString === "") {
        ageString = "Less than 1 month";
      }

      const childData = {
        name: childName,
        age: ageString,
        birthDate: childAge,
        gender: childGender,
        imageSrc: childImage || "default",
        weight: weight,
        height: height,
        headCircumference: headCircumference,
      };

      onSave(childData);
    } else {
      // Validation for editing a child
      if (childName.trim() === "") {
        Alert.alert("Required Field", "Please enter the child's name");
        return;
      }

      const updatedChildData = {
        name: childName,
      };

      // Handle image - if using default, set to "default", otherwise use the selected image
      if (isUsingDefaultChildImage) {
        updatedChildData.imageSrc = "default";
      } else if (childImage) {
        updatedChildData.imageSrc = childImage;
      }

      onSave(updatedChildData);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.modalBackground,
                shadowColor: theme.isDark ? "#000" : "#000",
                width: "90%",
                maxHeight: "90%",
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? "Edit Child" : "Add New Child"}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Child Image */}
              <TouchableOpacity
                style={styles.childImageContainer}
                onPress={onSelectImage}
                disabled={isSelectingImage}
              >
                {childImage ? (
                  <Image
                    source={{ uri: childImage }}
                    style={styles.addChildImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.childImagePlaceholder,
                      { backgroundColor: `${theme.primary}30` },
                    ]}
                  >
                    {isSelectingImage ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Image
                        source={defaultChildImage}
                        style={styles.addChildImage}
                      />
                    )}
                  </View>
                )}
                <View
                  style={[
                    styles.editImageBadge,
                    { backgroundColor: theme.primary + "80" },
                  ]}
                >
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Child Name */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Child's Name *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  value={childName}
                  onChangeText={(text) => {
                    // Limit to 30 characters
                    if (text.length <= 30) {
                      setChildName(text);
                    }
                  }}
                  placeholder="Enter name"
                  placeholderTextColor={theme.textTertiary}
                  maxLength={30}
                />
              </View>

              {/* Child Birth Date */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Child's Birth Date {!isEditing && "*"}
                </Text>
                <View
                  style={[
                    styles.datePickerContainer,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundSecondary,
                      opacity: isEditing ? 0.7 : 1,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.dateInput,
                      { color: isEditing ? theme.textTertiary : theme.text },
                    ]}
                    value={childAge}
                    onChangeText={(text) => {
                      if (isEditing) return; // Disable editing if in edit mode

                      // Remove any non-numeric characters
                      const cleaned = text.replace(/[^0-9]/g, "");

                      // Format as DD/MM/YYYY automatically as user types
                      let formatted = "";
                      if (cleaned.length > 0) {
                        // Add first digit of day
                        formatted = cleaned.substring(
                          0,
                          Math.min(1, cleaned.length)
                        );

                        // Add second digit of day
                        if (cleaned.length > 1) {
                          formatted = cleaned.substring(0, 2);
                        }

                        // Add first slash and first digit of month
                        if (cleaned.length > 2) {
                          formatted = `${cleaned.substring(
                            0,
                            2
                          )}/${cleaned.substring(2, 3)}`;
                        }

                        // Add second digit of month
                        if (cleaned.length > 3) {
                          formatted = `${cleaned.substring(
                            0,
                            2
                          )}/${cleaned.substring(2, 4)}`;
                        }

                        // Add second slash and start of year
                        if (cleaned.length > 4) {
                          formatted = `${cleaned.substring(
                            0,
                            2
                          )}/${cleaned.substring(2, 4)}/${cleaned.substring(
                            4,
                            Math.min(8, cleaned.length)
                          )}`;
                        }
                      }

                      setChildAge(formatted);
                    }}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!isEditing}
                  />
                </View>
                <Text style={[styles.dateHint, { color: theme.textTertiary }]}>
                  {isEditing
                    ? "Birth date cannot be changed after creation"
                    : "Format: DD/MM/YYYY (e.g., 15/06/2022)"}
                </Text>
              </View>

              {/* Child Gender */}
              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Gender {!isEditing && "*"}
                </Text>
                <View
                  style={[
                    styles.genderOptions,
                    { opacity: isEditing ? 0.7 : 1 },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      childGender === "male" && {
                        backgroundColor: `${theme.primary}20`,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => !isEditing && setChildGender("male")}
                    disabled={isEditing}
                  >
                    <Ionicons
                      name="male"
                      size={20}
                      color={
                        childGender === "male"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            childGender === "male"
                              ? theme.primary
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      childGender === "female" && {
                        backgroundColor: `${theme.primary}20`,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => !isEditing && setChildGender("female")}
                    disabled={isEditing}
                  >
                    <Ionicons
                      name="female"
                      size={20}
                      color={
                        childGender === "female"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            childGender === "female"
                              ? theme.primary
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
                {isEditing && (
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Gender cannot be changed after creation
                  </Text>
                )}
              </View>

              {/* Only show these fields when adding a new child */}
              {!isEditing && (
                <>
                  {/* Child Weight */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Weight (grams) *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.border,
                          color: theme.text,
                          backgroundColor: theme.backgroundSecondary,
                        },
                      ]}
                      value={childWeight}
                      onChangeText={(text) => {
                        // Remove non-numeric characters and limit to 4 digits
                        const numericText = text.replace(/[^0-9]/g, "");
                        if (numericText.length <= 4) {
                          setChildWeight(numericText);
                        }
                      }}
                      placeholder="Enter weight in grams"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <Text
                      style={[styles.dateHint, { color: theme.textTertiary }]}
                    >
                      Example: 3500 (for 3.5kg)
                    </Text>
                  </View>

                  {/* Child Height */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Height (cm) *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.border,
                          color: theme.text,
                          backgroundColor: theme.backgroundSecondary,
                        },
                      ]}
                      value={childHeight}
                      onChangeText={(text) => {
                        // Remove non-numeric characters and limit to 3 digits
                        const numericText = text.replace(/[^0-9]/g, "");
                        if (numericText.length <= 3) {
                          setChildHeight(numericText);
                        }
                      }}
                      placeholder="Enter height in cm"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text
                      style={[styles.dateHint, { color: theme.textTertiary }]}
                    >
                      Example: 50 (for 50cm)
                    </Text>
                  </View>

                  {/* Child Head Circumference */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Head Circumference (cm) *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.border,
                          color: theme.text,
                          backgroundColor: theme.backgroundSecondary,
                        },
                      ]}
                      value={childHeadCircumference}
                      onChangeText={(text) => {
                        // Remove non-numeric characters and limit to 3 digits
                        const numericText = text.replace(/[^0-9]/g, "");
                        if (numericText.length <= 3) {
                          setChildHeadCircumference(numericText);
                        }
                      }}
                      placeholder="Enter head circumference in cm"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text
                      style={[styles.dateHint, { color: theme.textTertiary }]}
                    >
                      Example: 35 (for 35cm)
                    </Text>
                  </View>
                </>
              )}
              {isEditing && (
                <>
                  {/* Child Weight - Disabled */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Weight (grams)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.border,
                          color: theme.textTertiary,
                          backgroundColor: theme.backgroundSecondary,
                          opacity: 0.7,
                        },
                      ]}
                      value={childWeight}
                      editable={false}
                      placeholder="Weight in grams"
                      placeholderTextColor={theme.textTertiary}
                    />
                    <Text
                      style={[styles.dateHint, { color: theme.textTertiary }]}
                    >
                      Weight cannot be changed after creation
                    </Text>
                  </View>

                  {/* Child Height - Disabled */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Height (cm)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.border,
                          color: theme.textTertiary,
                          backgroundColor: theme.backgroundSecondary,
                          opacity: 0.7,
                        },
                      ]}
                      value={childHeight}
                      editable={false}
                      placeholder="Height in cm"
                      placeholderTextColor={theme.textTertiary}
                    />
                    <Text
                      style={[styles.dateHint, { color: theme.textTertiary }]}
                    >
                      Height cannot be changed after creation
                    </Text>
                  </View>

                  {/* Child Head Circumference - Disabled */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Head Circumference (cm)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.border,
                          color: theme.textTertiary,
                          backgroundColor: theme.backgroundSecondary,
                          opacity: 0.7,
                        },
                      ]}
                      value={childHeadCircumference}
                      editable={false}
                      placeholder="Head circumference in cm"
                      placeholderTextColor={theme.textTertiary}
                    />
                    <Text
                      style={[styles.dateHint, { color: theme.textTertiary }]}
                    >
                      Head circumference cannot be changed after creation
                    </Text>
                  </View>
                </>
              )}

              <Text
                style={[
                  styles.requiredFieldsNote,
                  { color: theme.textSecondary },
                ]}
              >
                * Required fields
              </Text>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.addButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleSave}
              >
                <Text style={styles.addButtonText}>
                  {isEditing ? "Save Changes" : "Add Child"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: "70%",
  },
  childImageContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  addChildImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  childImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  dateHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  genderOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  genderText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  requiredFieldsNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {},
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AddChildModal;
