import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoImagePicker from "expo-image-picker";
import defaultUserImage from "../../assets/images/default-user.png";
import defaultChildImage from "../../assets/images/default-child.png";

import { useAuth } from "../../context/auth-context";
import { useTheme } from "../../context/theme-context";
import { useChildActivity } from "../../context/child-activity-context";
import { useNotification } from "../../context/notification-context";
import AddChildModal from "../../components/UI/Modals/AddChildModal";

const handleSelectImage = async () => {
  try {
    console.log("Starting image selection process");

    // Request permission for media library
    const { status: mediaLibraryStatus } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Media library permission status:", mediaLibraryStatus);

    if (mediaLibraryStatus !== "granted") {
      console.log("Permission denied for media library");
      Alert.alert(
        "Permission Required",
        "You need to grant permission to access your photos",
        [{ text: "OK" }]
      );
      return null;
    }

    // Configure options based on platform
    const pickerOptions = {
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    console.log("Launching image picker with options:", pickerOptions);

    // Launch image picker
    const result = await ExpoImagePicker.launchImageLibraryAsync(pickerOptions);

    console.log("Image picker result:", JSON.stringify(result));

    // Check if the user canceled the operation
    if (!result || result.canceled === true) {
      console.log("User canceled image selection");
      return null;
    }

    // Return the URI of the selected image
    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      const imageUri = result.assets[0].uri;
      console.log("Selected image URI:", imageUri);
      return imageUri;
    } else {
      console.log("No valid image URI found in result");
      Alert.alert("Error", "Failed to get image. Please try again.");
      return null;
    }
  } catch (error) {
    console.error("Error selecting image:", error);
    Alert.alert(
      "Error",
      `Failed to select image: ${error.message}. Please try again.`,
      [{ text: "OK" }]
    );
    return null;
  }
};

export default function SettingsScreen({ navigation }) {
  const { theme, isGirlTheme, toggleTheme } = useTheme();
  const {
    children,
    currentChild,
    currentChildId,
    switchChild,
    addChild,
    removeChild,
    updateChildData,
  } = useChildActivity();
  const { user, token, logout, updateUserProfile, getCurrentUser } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSelectingImage, setIsSelectingImage] = useState(false);

  // Add these new state variables after the other state declarations
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [editChildId, setEditChildId] = useState(null);

  // Add this inside your SettingsScreen component, right after the other useState declarations
  const { settings, toggleNotifications, toggleHealthReminders } =
    useNotification();
  // Find the line where we're using the useNotification hook
  // Make sure this hook is called at the top level of the component, not inside a condition or loop
  // Also ensure that all hooks are called in the same order on every render

  // Check if there's any conditional rendering of hooks in the component
  // For example, make sure we're not doing something like:
  // if (condition) {
  //   useState(...) // This would cause the error
  // }

  // The most likely issue is that the useNotification hook might not be properly imported or defined
  // Make sure the import is correct:
  // import { useNotification } from "../contexts/notification-context"

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    if (!token) {
      console.log("No token available, using local user data");
      // If no token, use the local user data from auth context
      if (user) {
        console.log("Using local user data:", user);
        setUserProfile(user);
        setProfileImage(user.imageSrc);
      } else {
        setLoadError("No user data available");
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      console.log("Fetching user profile with token");
      // Use the getCurrentUser from auth context
      const userData = await getCurrentUser(token);
      console.log("User data received:", userData);

      setUserProfile(userData);

      // Set default profile image if none exists
      setProfileImage(userData.imageSrc);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setLoadError("Failed to load profile data");

      // Fallback to local user data if API fails
      if (user) {
        console.log("Falling back to local user data:", user);
        setUserProfile(user);
        setProfileImage(user.imageSrc);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Updated image selection handler with debounce
  const onSelectImage = async () => {
    if (isSelectingImage) return;

    try {
      setIsSelectingImage(true);
      const imageUri = await handleSelectImage();
      if (imageUri) {
        console.log("Setting profile image to:", imageUri);
        setProfileImage(imageUri);
      }
    } catch (error) {
      console.error("Error in onSelectImage:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsSelectingImage(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!userProfile) return;

    // Validate inputs
    if (editPassword && editPassword.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters long"
      );
      return;
    }

    if (editPassword && editPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    setIsUpdating(true);

    try {
      const updateData = {};

      // Check if username has changed - handle both name and username fields
      const currentName = userProfile.name || userProfile.username || "";
      if (editUsername && editUsername !== currentName) {
        updateData.name = editUsername;
      }

      if (editPassword) {
        updateData.password = editPassword;
      }

      if (profileImage && profileImage !== userProfile.imageSrc) {
        updateData.imageSrc = profileImage; // Changed from profileImage to imageSrc to match the expected field
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        setShowEditProfileModal(false);
        setIsUpdating(false);
        return;
      }

      console.log("Updating profile with data:", updateData);

      // Use the updateUserProfile function from the auth context
      const updatedUser = await updateUserProfile(updateData);
      console.log("Profile updated successfully:", updatedUser);

      // Update local state
      setUserProfile({
        ...userProfile,
        ...updatedUser,
      });

      Alert.alert("Success", "Profile updated successfully");
      setShowEditProfileModal(false);

      // Reset form fields
      setEditPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Open edit profile modal - Fixed function
  const openEditProfileModal = () => {
    console.log("Opening edit profile modal");
    console.log("User profile:", userProfile);

    if (userProfile) {
      // Set the initial values
      setEditUsername(userProfile.name || userProfile.username || "");
      setEditPassword("");
      setConfirmPassword("");

      // Show the modal
      setShowEditProfileModal(true);
      console.log("Modal should be visible now:", showEditProfileModal);
    } else {
      console.log("Cannot open modal: userProfile is null");
      Alert.alert("Error", "Unable to edit profile. User data not available.");
    }
  };

  // Add new child - simplified to just call the context function
  const handleAddChild = async (childData) => {
    try {
      const childId = await addChild(childData);
      if (childId) {
        Alert.alert("Success", "Child added successfully");
        setShowAddChildModal(false);
      } else {
        Alert.alert("Error", "Failed to add child");
      }
    } catch (error) {
      console.error("Error adding child:", error);
      Alert.alert("Error", error.message || "Failed to add child");
    }
  };

  // Function to handle editing a child - simplified
  const handleEditChild = (child) => {
    console.log("Editing child:", child);
    setEditChildId(child.id);
    setShowEditChildModal(true);
  };

  // Function to save edited child data - simplified
  const saveEditedChild = async (updatedChildData) => {
    try {
      const success = await updateChildData(editChildId, updatedChildData);
      if (success) {
        Alert.alert("Success", "Child updated successfully");
        setShowEditChildModal(false);
      } else {
        Alert.alert("Error", "Failed to update child");
      }
    } catch (error) {
      console.error("Error updating child:", error);
      Alert.alert("Error", error.message || "Failed to update child");
    }
  };

  // Add this function to handle child deletion with confirmation
  const handleDeleteChild = (childId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this child? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeChild(childId),
        },
      ]
    );
  };

  // Handle child selection
  const handleSelectChild = (childId) => {
    switchChild(childId);
  };

  // Handle logout with proper navigation reset
  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await logout();
      console.log("Logout successful");

      // We don't need to navigate manually - the NavigationContainer will handle this
      // when isAuthenticated changes to false in the auth context
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // Render settings section
  const renderSection = (title, children) => {
    return (
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            shadowColor: theme.isDark ? "#000" : "#000",
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {title}
        </Text>
        {children}
      </View>
    );
  };

  // Render setting item with toggle
  const renderToggleSetting = (icon, title, value, onValueChange) => {
    return (
      <View
        style={[styles.settingItem, { borderBottomColor: theme.borderLight }]}
      >
        <View style={styles.settingItemLeft}>
          <Ionicons
            name={icon}
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <Text style={[styles.settingText, { color: theme.text }]}>
            {title}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={theme.switchTrackColor}
          thumbColor={theme.switchThumbColor}
        />
      </View>
    );
  };

  // Render setting item with chevron
  const renderChevronSetting = (icon, title, onPress) => {
    return (
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: theme.borderLight }]}
        onPress={onPress}
      >
        <View style={styles.settingItemLeft}>
          <Ionicons
            name={icon}
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <Text style={[styles.settingText, { color: theme.text }]}>
            {title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </TouchableOpacity>
    );
  };

  // Replace the renderChildItem function with this improved version
  const renderChildItem = (child) => {
    if (!child) return null;

    const isCurrentChild = child.id === currentChildId;

    return (
      <View
        key={child.id}
        style={[
          styles.childItem,
          {
            backgroundColor: isCurrentChild
              ? `${theme.primary}15`
              : theme.cardBackground,
            marginBottom: 12,
            borderRadius: 12,
            padding: 1,
            borderWidth: isCurrentChild ? 1 : 0,
            borderColor: isCurrentChild ? theme.primary : "transparent",
          },
        ]}
      >
        {/* Add a highlight effect that works well on Android */}

        <View style={styles.childHeader}>
          {isCurrentChild && (
            <View
              style={[
                styles.currentChildBadge,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={styles.currentChildBadgeText}>Current</Text>
            </View>
          )}
        </View>

        <View style={styles.childMainContent}>
          <View style={styles.childImageWrapper}>
            <Image
              source={
                child.imageSrc && child.imageSrc !== "default"
                  ? { uri: child.imageSrc }
                  : defaultChildImage
              }
              style={[
                styles.childImage,
                isCurrentChild && {
                  borderWidth: 2,
                  borderColor: theme.primary,
                },
              ]}
              onError={() =>
                console.log(
                  "Error loading child image, falling back to default"
                )
              }
            />
          </View>
          <View style={styles.childInfo}>
            <Text style={[styles.childName, { color: theme.text }]}>
              {child.name}
            </Text>
            <Text style={[styles.childAge, { color: theme.textSecondary }]}>
              {child.age}
            </Text>

            <View style={styles.childDetailsRow}>
              <View style={styles.childDetailItem}>
                <Ionicons
                  name={child.gender === "male" ? "male" : "female"}
                  size={14}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.childDetailText,
                    { color: theme.textTertiary },
                  ]}
                >
                  {child.gender === "male"
                    ? "Male"
                    : child.gender === "female"
                    ? "Female"
                    : "Other"}
                </Text>
              </View>

              {child.weight && (
                <View style={styles.childDetailItem}>
                  <Ionicons
                    name="scale-outline"
                    size={14}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.childDetailText,
                      { color: theme.textTertiary },
                    ]}
                  >
                    {child.weight}g
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.childDetailsRow}>
              {child.height && (
                <View style={styles.childDetailItem}>
                  <Ionicons
                    name="resize-outline"
                    size={14}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.childDetailText,
                      { color: theme.textTertiary },
                    ]}
                  >
                    {child.height}cm
                  </Text>
                </View>
              )}

              {child.headCircumference && (
                <View style={styles.childDetailItem}>
                  <Ionicons
                    name="ellipse-outline"
                    size={14}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.childDetailText,
                      { color: theme.textTertiary },
                    ]}
                  >
                    Head: {child.headCircumference}cm
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View
          style={[styles.childActions, { borderTopColor: theme.borderLight }]}
        >
          <TouchableOpacity
            style={[
              styles.childActionButton,
              {
                backgroundColor: isCurrentChild
                  ? `${theme.primary}20`
                  : theme.backgroundSecondary,
                borderRadius: 6,
              },
            ]}
            onPress={() => handleSelectChild(child.id)}
            activeOpacity={0.7}
            android_ripple={null}
          >
            <Ionicons
              name={
                isCurrentChild ? "checkmark-circle" : "checkmark-circle-outline"
              }
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.childActionText, { color: theme.primary }]}>
              {isCurrentChild ? "Selected" : "Select"}
            </Text>
          </TouchableOpacity>

          <View style={styles.childActionDivider} />

          <TouchableOpacity
            style={[
              styles.childActionButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => handleEditChild(child)}
            activeOpacity={0.7}
            android_ripple={null}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.childActionText, { color: theme.textSecondary }]}
            >
              Edit
            </Text>
          </TouchableOpacity>

          <View style={styles.childActionDivider} />

          <TouchableOpacity
            style={[
              styles.childActionButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => handleDeleteChild(child.id)}
            activeOpacity={0.7}
            android_ripple={null}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.childActionText, { color: theme.danger }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Remove the renderAddChildModal and renderEditChildModal functions
  // Replace the modal rendering in the return statement with the AddChildModal component

  // Edit Profile Modal
  const renderEditProfileModal = () => {
    return (
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
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
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Edit Profile
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={onSelectImage}
                disabled={isSelectingImage}
              >
                <Image
                  source={
                    profileImage ? { uri: profileImage } : defaultUserImage
                  }
                  style={styles.editProfileImage}
                />
                <View
                  style={[
                    styles.editImageOverlay,
                    { backgroundColor: theme.primary + "80" },
                  ]}
                >
                  {isSelectingImage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={24} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Username
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
                  value={editUsername}
                  onChangeText={(text) => {
                    // Limit to 30 characters
                    if (text.length <= 30) {
                      setEditUsername(text);
                    }
                  }}
                  placeholder="Enter username"
                  placeholderTextColor={theme.textTertiary}
                  maxLength={30}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  New Password
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
                  value={editPassword}
                  onChangeText={setEditPassword}
                  placeholder="Enter new password (optional)"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Confirm Password
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setShowEditProfileModal(false)}
                disabled={isUpdating}
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
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError && !userProfile) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={50} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.danger }]}>
            {loadError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchUserProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View
          style={[
            styles.profileSection,
            {
              backgroundColor: theme.cardBackground,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.1)",
              borderRadius: 12,
            },
          ]}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>Parent</Text>
            </View>
          </View>

          <View style={styles.profileMainContent}>
            <View style={styles.profileImageContainer}>
              <Image
                source={profileImage ? { uri: profileImage } : defaultUserImage}
                style={styles.profileImage}
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {userProfile?.name ||
                  userProfile?.username ||
                  user?.name ||
                  user?.username ||
                  "User"}
              </Text>
              <Text
                style={[styles.profileEmail, { color: theme.textSecondary }]}
              >
                {userProfile?.email || user?.email || "user@example.com"}
              </Text>

              <View style={styles.profileDetailsRow}>
                <View style={styles.profileDetailItem}>
                  <Ionicons name="person" size={14} color={theme.primary} />
                  <Text
                    style={[
                      styles.profileDetailText,
                      { color: theme.textTertiary },
                    ]}
                  >
                    Parent
                  </Text>
                </View>

                <View style={styles.profileDetailItem}>
                  <Ionicons name="people" size={14} color={theme.primary} />
                  <Text
                    style={[
                      styles.profileDetailText,
                      { color: theme.textTertiary },
                    ]}
                  >
                    {children.length}{" "}
                    {children.length === 1 ? "Child" : "Children"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.profileActions,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.childActionButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={openEditProfileModal}
              activeOpacity={0.7}
              android_ripple={null}
            >
              <Ionicons name="create-outline" size={18} color={theme.primary} />
              <Text style={[styles.childActionText, { color: theme.primary }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Children Section */}
        {renderSection(
          "Children",
          <View>
            {children.length === 0 ? (
              <View style={styles.noChildrenContainer}>
                <Ionicons
                  name="people"
                  size={50}
                  color={`${theme.primary}50`}
                />
                <Text
                  style={[
                    styles.noChildrenText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No children added yet
                </Text>
                <Text
                  style={[
                    styles.noChildrenSubtext,
                    { color: theme.textTertiary },
                  ]}
                >
                  Add your first child to start tracking their activities
                </Text>
              </View>
            ) : (
              <View style={styles.childrenList}>
                {children.map((child) => renderChildItem(child))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.addChildButton,
                {
                  backgroundColor: theme.primary,
                  marginTop: 16,
                  marginHorizontal: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 3,
                },
              ]}
              onPress={() => setShowAddChildModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addChildText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Settings Section */}
        {renderSection(
          "App Settings",
          <View>
            {renderToggleSetting(
              "notifications",
              "Notifications",
              notificationsEnabled,
              setNotificationsEnabled
            )}
            {renderToggleSetting(
              "notifications",
              "Vaccination Reminders",
              settings.healthReminders,
              toggleHealthReminders
            )}
            <View
              style={[
                styles.settingItem,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons
                  name="color-palette"
                  size={24}
                  color={theme.primary}
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Theme
                </Text>
              </View>
              <View style={styles.themeIndicator}>
                <Ionicons
                  name={isGirlTheme ? "female" : "male"}
                  size={22}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.themeIndicatorText,
                    { color: theme.textSecondary, marginLeft: 6 },
                  ]}
                >
                  {isGirlTheme ? "Girl" : "Boy"}
                </Text>
              </View>
            </View>
            {renderChevronSetting("language", "Language", () =>
              console.log("Language pressed")
            )}
            {renderChevronSetting("cloud-upload", "Data Backup", () =>
              console.log("Data Backup pressed")
            )}
          </View>
        )}

        {/* Account Section */}
        {renderSection(
          "Account",
          <View>
            {renderChevronSetting("shield-checkmark", "Privacy", () =>
              console.log("Privacy pressed")
            )}
            {renderChevronSetting("help-circle", "Help & Support", () =>
              console.log("Help pressed")
            )}
            {renderChevronSetting("log-out", "Sign Out", handleLogout)}
          </View>
        )}

        <Text style={[styles.versionText, { color: theme.textTertiary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>

      <AddChildModal
        isVisible={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSave={handleAddChild}
        theme={theme}
        isEditing={false}
        handleSelectImage={handleSelectImage}
      />

      <AddChildModal
        isVisible={showEditChildModal}
        onClose={() => setShowEditChildModal(false)}
        onSave={saveEditedChild}
        initialData={children.find((child) => child.id === editChildId)}
        theme={theme}
        isEditing={true}
        handleSelectImage={handleSelectImage}
      />
      {renderEditProfileModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: "400",
  },
  versionText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  profileSection: {
    flexDirection: "column",
    marginBottom: 20,
    overflow: "hidden",
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  profileBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    backgroundColor: "#4CAF50",
  },
  profileBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  profileMainContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  profileImageContainer: {
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    paddingLeft: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: "500",
  },
  profileDetailsRow: {
    flexDirection: "row",
    marginTop: 4,
    flexWrap: "wrap",
  },
  profileDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 2,
  },
  profileDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  profileActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
  },
  childHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  currentChildBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  currentChildBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  childDetailsRow: {
    flexDirection: "row",
    marginTop: 4,
    flexWrap: "wrap",
  },
  childDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 2,
  },
  childDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  childActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    flex: 1,
  },
  childActionText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  childActionDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 4,
  },
  noChildrenContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  noChildrenText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  noChildrenSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  childrenList: {
    marginTop: 8,
  },
  childItem: {
    flexDirection: "column",
    overflow: "hidden",
  },
  childMainContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  childActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  childImageWrapper: {
    marginRight: 16,
  },
  childImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
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
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
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
  profileImageContainer: {
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  editProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editImageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: "70%",
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
  calendarButton: {
    padding: 8,
  },
  dateHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  themeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  themeIndicatorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  childImageWrapper: {
    marginRight: 16,
  },
  childImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  addChildText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
});
