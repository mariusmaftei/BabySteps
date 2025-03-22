import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import defaultChildImage from "../../assets/images/default-child.png";
import happyChildImage from "../../assets/images/happy-child.png";
import sadChildImage from "../../assets/images/sad-child.png";
// contexts
// contexts

import { useTheme } from "../../context/theme-context";
import { useChildActivity } from "../../context/child-activity-context";
import { useNotification } from "../../context/notification-context";

function Activity({ navigation }) {
  // All hooks must be called at the top level, before any conditional logic
  const { theme } = useTheme();
  const { currentChild, currentChildId, children, switchChild } =
    useChildActivity();
  const { updateCurrentScreen } = useNotification();

  // State hooks
  const [showChildSwitcherModal, setShowChildSwitcherModal] = useState(false);
  const [localChildren, setLocalChildren] = useState([]);
  const [showAddChildPrompt, setShowAddChildPrompt] = useState(false);

  // Derived state
  const noChildren = !currentChild || currentChild.id === "default";

  // Helper function to get the correct image source
  const getChildImageSource = useCallback((child) => {
    // Check for imageSrc first (this is what's used in your database)
    if (child?.imageSrc && child.imageSrc !== "default") {
      return { uri: child.imageSrc };
    }
    // Then check for image (alternative property name)
    else if (child?.image && child.image !== "default") {
      return { uri: child.image };
    }
    // Use default image if no valid image URL is found
    return defaultChildImage;
  }, []);

  // Activity card data with trend information
  const activityCards = useMemo(
    () => [
      {
        title: "Sleep",
        subtitle: "Track sleep patterns",
        icon: "moon",
        color: "#5A87FF",
        gradient: ["#5A87FF", "#709DFF"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleeping-child.jpg-kFbvedsqniZ96VLUXSOV0eJkAur7TZ.jpeg",
        trend: currentChild?.activities?.sleep?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.sleep?.trend || "0%",
        screen: "SleepDetails",
      },
      {
        title: "Feeding",
        subtitle: "Meal tracking",
        icon: "restaurant",
        color: "#FF9500",
        gradient: ["#FF9500", "#FFAC30"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Feeding-child.jpg-zD7Y5eQyPiLnGi7o7ph6xNgLw9bdVW.jpeg",
        trend: currentChild?.activities?.feeding?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.feeding?.trend || "0%",
        screen: "FeedingDetails",
      },
      {
        title: "Growth",
        subtitle: "Track development",
        icon: "trending-up",
        color: "#4CD964",
        gradient: ["#4CD964", "#7AE28C"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/child-growth.jpg-UWt4Kw8CtpknvXrh0f4NDTDbNovWuy.jpeg",
        trend: currentChild?.activities?.growth?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.growth?.trend || "0%",
        screen: "GrowthDetails",
      },
      {
        title: "Diaper",
        subtitle: "Track changes & hygiene",
        icon: "water",
        color: "#00B4D8",
        gradient: ["#00B4D8", "#48CAE4"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
        trend: currentChild?.activities?.diaper?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.diaper?.trend || "0%",
        screen: "DiaperDetails",
      },
      {
        title: "Health",
        subtitle: "Medical checkups",
        icon: "medkit",
        color: "#007AFF", // Changed to blue
        gradient: ["#007AFF", "#4DA3FF"], // Changed to blue gradient
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/heatly-child.jpg-kyeSB4d3cISzh9dPjtHnSvLRzZG6D1.jpeg",
        trend: currentChild?.activities?.health?.trend?.startsWith("+")
          ? "up"
          : "down",
        trendValue: currentChild?.activities?.health?.trend || "0%",
        screen: "HealthDetails",
      },
      {
        title: "Relaxing",
        subtitle: "Soothing music & sounds",
        icon: "musical-notes",
        color: "#F472B6",
        gradient: ["#F472B6", "#F9A8D4"],
        image:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/relaxing.jpg-njSGsa3qQi5ELgv3r4dECK349CakfZ.jpeg",
        // Removed trend and trendValue properties
        screen: "RelaxingMusic",
      },
    ],
    [currentChild]
  );

  // Calculate overall mood based on trends
  const isHappyMood = useMemo(() => {
    const positiveCount = activityCards.filter(
      (card) => card.trend === "up"
    ).length;
    const negativeCount = activityCards.filter(
      (card) => card.trend === "down"
    ).length;
    return positiveCount > negativeCount;
  }, [activityCards]);

  // Get mood image source based on mood - now using local images
  const getMoodImage = useMemo(() => {
    return isHappyMood ? happyChildImage : sadChildImage;
  }, [isHappyMood]);

  // Handle card press
  const handleCardPress = useCallback(
    (item) => {
      if (item.screen) {
        navigation.navigate(item.screen);
      } else {
        console.log(`${item.title} pressed`);
      }
    },
    [navigation]
  );

  // Add this function to handle child selection with improved logging
  const handleSelectChild = useCallback(
    (childId) => {
      console.log(`Attempting to switch to child with ID: ${childId}`);

      // Check if the child exists in our local children array
      const childExists = localChildren.some(
        (child) => String(child.id) === String(childId)
      );

      if (!childExists) {
        console.warn(
          `Child with ID ${childId} not found in local children list`
        );
        return;
      }

      // Call the switchChild function from context
      const success = switchChild(childId);
      console.log(`Switch child result: ${success ? "success" : "failed"}`);

      // Close the modal
      setShowChildSwitcherModal(false);
    },
    [switchChild, localChildren]
  );

  // Update local children whenever the children prop changes
  useEffect(() => {
    if (children && Array.isArray(children)) {
      console.log(
        "Children updated in Activity screen:",
        children.length,
        "children"
      );
      setLocalChildren(children);
    }
  }, [children]);

  // Show the add child prompt when there are no children
  useEffect(() => {
    setShowAddChildPrompt(noChildren);
  }, [noChildren]);

  // Add this useEffect to refresh the modal data when it's opened
  useEffect(() => {
    if (showChildSwitcherModal) {
      console.log("Child switcher modal opened, refreshing children data");
      // This ensures we have the latest children data when the modal opens
      setLocalChildren([...children]);
    }
  }, [showChildSwitcherModal, children]);

  // Add this useLayoutEffect to set up the header right button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowChildSwitcherModal(true)}
          disabled={noChildren}
        >
          <Ionicons
            name="people"
            size={24}
            color={noChildren ? theme.textTertiary : theme.primary}
          />
        </TouchableOpacity>
      ),
      title: noChildren
        ? "Add a Child"
        : `${currentChild.name.split(" ")[0]}'s Activity`,
      headerTitle: () => (
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {noChildren
            ? "Add a Child"
            : `${currentChild.name.split(" ")[0]}'s Activity`}
        </Text>
      ),
    });

    // Update current screen to Activity
    updateCurrentScreen("Activity");
  }, [navigation, theme, currentChild, noChildren, updateCurrentScreen]);

  // Add a focus listener to refresh data when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("Activity screen focused, refreshing data");
      // This will ensure we have the latest children data when returning to this screen
      setLocalChildren([...children]);
    });

    return unsubscribe;
  }, [navigation, children]);

  // Render activity card - defined as a memoized function to avoid recreating on every render
  const renderActivityCard = useCallback(
    (item, index) => {
      if (item.image) {
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              {
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
            activeOpacity={0.9}
            onPress={() => handleCardPress(item)}
          >
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              {/* Trend Icon - Only show if trend property exists */}
              {item.trend && (
                <View style={styles.trendIconContainer}>
                  <View
                    style={[
                      styles.trendIconBackground,
                      {
                        backgroundColor:
                          item.title === "Health"
                            ? "#007AFF" // Blue for Health card regardless of trend
                            : item.trend === "up"
                            ? "#4CD964" // Green for up trend (other cards)
                            : "#FF3B30", // Red for down trend (other cards)
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        item.trend === "up" ? "trending-up" : "trending-down"
                      }
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.trendText}>{item.trendValue}</Text>
                  </View>
                </View>
              )}

              <View style={styles.imageTextContainer}>
                <Text style={styles.imageCardTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.imageCardSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        );
      }

      // Also update the second part (for cards without images):
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: item.color,
              shadowColor: theme.isDark ? "#000" : "#000",
            },
          ]}
          activeOpacity={0.9}
          onPress={() => handleCardPress(item)}
        >
          {/* Trend Icon - Only show if trend property exists */}
          {item.trend && (
            <View style={styles.trendIconContainer}>
              <View
                style={[
                  styles.trendIconBackground,
                  {
                    backgroundColor:
                      item.title === "Health"
                        ? "#007AFF" // Blue for Health card regardless of trend
                        : item.trend === "up"
                        ? "#4CD964" // Green for up trend (other cards)
                        : "#FF3B30", // Red for down trend (other cards)
                  },
                ]}
              >
                <Ionicons
                  name={item.trend === "up" ? "trending-up" : "trending-down"}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.trendText}>{item.trendValue}</Text>
              </View>
            </View>
          )}

          <View style={styles.cardContent}>
            <Ionicons name={item.icon} size={36} color="#FFFFFF" />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [theme, handleCardPress]
  );

  // Child switcher modal component - memoized to avoid recreating on every render
  const childSwitcherModal = useMemo(
    () => (
      <Modal
        visible={showChildSwitcherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChildSwitcherModal(false)}
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
                Switch Child
              </Text>
              <TouchableOpacity
                onPress={() => setShowChildSwitcherModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.childList}>
              {localChildren.length === 0 ? (
                <Text
                  style={[
                    styles.noChildrenText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No children found. Add a child in settings.
                </Text>
              ) : (
                localChildren.map((child) => {
                  // For debugging - log the child data to see what properties are available
                  console.log(
                    `Rendering child in switcher: ${child.id}, name: ${child.name}`
                  );

                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childSwitcherItem,
                        String(child.id) === String(currentChildId) && {
                          backgroundColor: `${theme.primary}15`,
                        },
                        { borderBottomColor: theme.borderLight },
                      ]}
                      onPress={() => handleSelectChild(child.id)}
                    >
                      <Image
                        source={getChildImageSource(child)}
                        style={styles.childSwitcherImage}
                        defaultSource={defaultChildImage}
                        onError={(e) => {
                          console.log(
                            "Error loading child image:",
                            e.nativeEvent.error
                          );
                        }}
                      />
                      <View style={styles.childSwitcherInfo}>
                        <Text
                          style={[
                            styles.childSwitcherName,
                            { color: theme.text },
                          ]}
                        >
                          {child.name}
                        </Text>
                        <Text
                          style={[
                            styles.childSwitcherAge,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {child.age}
                        </Text>
                      </View>
                      {String(child.id) === String(currentChildId) && (
                        <View
                          style={[
                            styles.currentChildIndicator,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.addChildButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setShowChildSwitcherModal(false);
                navigation.navigate("Settings");
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.addChildText}>Manage Children</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [
      showChildSwitcherModal,
      theme,
      localChildren,
      currentChildId,
      getChildImageSource,
      handleSelectChild,
      navigation,
    ]
  );

  // Main render
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {noChildren ? (
        <View style={styles.noChildContainer}>
          <Ionicons
            name="person-add"
            size={60}
            color={theme.primary}
            style={styles.noChildIcon}
          />
          <Text style={[styles.noChildTitle, { color: theme.text }]}>
            No Children Added
          </Text>
          <Text
            style={[styles.noChildSubtitle, { color: theme.textSecondary }]}
          >
            Add a child in the settings to start tracking their activities
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
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            {/* Profile image with mood image in bottom right */}
            <View style={styles.profileImageContainer}>
              <Image
                source={getChildImageSource(currentChild)}
                style={[
                  styles.childProfileImage,
                  { borderColor: theme.background },
                ]}
                defaultSource={defaultChildImage}
                onError={(e) => {
                  console.log(
                    "Error loading child profile image:",
                    e.nativeEvent.error
                  );
                }}
              />
              {/* Mood image in bottom right of profile image */}
              <View style={styles.smallImageContainer}>
                <Image
                  source={getMoodImage}
                  style={styles.smallChildImage}
                  resizeMode="contain"
                  onError={(e) => {
                    console.log(
                      "Error loading mood image:",
                      e.nativeEvent.error
                    );
                  }}
                />
              </View>
            </View>

            <Text style={[styles.headerText, { color: theme.text }]}>
              {currentChild.name.split(" ")[0]}'s Activity
            </Text>
            <Text
              style={[styles.subHeaderText, { color: theme.textSecondary }]}
            >
              Monitor and record daily activities
            </Text>
          </View>

          <View style={styles.cardGrid}>
            {activityCards.map((item, index) =>
              renderActivityCard(item, index)
            )}
          </View>
        </ScrollView>
      )}
      {childSwitcherModal}
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
    marginBottom: 20,
    paddingTop: 10,
    width: "100%",
  },
  profileImageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  childProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  smallImageContainer: {
    position: "absolute",
    bottom: -10,
    right: -10,
    zIndex: 10,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallChildImage: {
    width: 56,
    height: 56,
  },
  childSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: "600",
  },
  childAge: {
    fontSize: 12,
  },
  moodImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 14,
    textAlign: "center",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardImage: {
    borderRadius: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 12,
  },
  imageTextContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  imageCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageCardSubtitle: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trendIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  trendIconBackground: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  trendText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
  headerButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    width: "85%",
    maxHeight: "70%",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  childList: {
    maxHeight: 300,
  },
  childSwitcherItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  childSwitcherImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  childSwitcherInfo: {
    flex: 1,
    marginLeft: 16,
  },
  childSwitcherName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  childSwitcherAge: {
    fontSize: 14,
  },
  currentChildIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
  },
  addChildText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    textAlign: "center",
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
  noChildrenText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
});

export default Activity;
