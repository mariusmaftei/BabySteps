import React, { useState, useEffect, useCallback, useRef } from "react";
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
// contexts

import { useTheme } from "../../context/theme-context";
import { useChildActivity } from "../../context/child-activity-context";
import { useNotification } from "../../context/notification-context";

function Activity({ navigation }) {
  const { theme } = useTheme();
  const { currentChild, currentChildId, children, switchChild } =
    useChildActivity();

  // Add this state for the child switcher modal
  const [showChildSwitcherModal, setShowChildSwitcherModal] = useState(false);

  // Add this state for the add child prompt
  const [showAddChildPrompt, setShowAddChildPrompt] = useState(false);

  // Add a check for no children
  const noChildren = !currentChild || currentChild.id === "default";

  // useRef to hold the switchChild function
  const switchChildRef = useRef(switchChild);

  // Add this function to handle child selection
  const handleSelectChild = useCallback((childId) => {
    switchChildRef.current(childId);
    setShowChildSwitcherModal(false);
  }, []);

  // Show the add child prompt when there are no children
  useEffect(() => {
    if (noChildren) {
      setShowAddChildPrompt(true);
    }
  }, [noChildren]);

  // Add this near the top of the file, inside the component
  const { updateCurrentScreen } = useNotification();

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

  // If there are no children, show a message to add a child
  if (noChildren) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
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

        {/* Add Child Prompt */}
        {/* <AddChildPrompt visible={showAddChildPrompt} onClose={() => setShowAddChildPrompt(false)} /> */}
      </SafeAreaView>
    );
  }

  // Update the activity cards section to safely access nested properties
  // Replace the activityCards array definition with this code:

  // Activity card data with trend information
  const activityCards = [
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
    // {
    //   title: "Playtime",
    //   subtitle: "Play & Learn",
    //   icon: "game-controller",
    //   color: "#FF2D55",
    //   gradient: ["#FF2D55", "#FF5E7A"],
    //   image:
    //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/playing-clind.jpg-NZF8dK93W81EUuGUZ0xYBjZU2jRgZf.jpeg",
    //   trend: currentChild?.activities?.playtime?.trend?.startsWith("+")
    //     ? "up"
    //     : "down",
    //   trendValue: currentChild?.activities?.playtime?.trend || "0%",
    //   screen: "PlaytimeDetails",
    // },
    {
      title: "Health",
      subtitle: "Medical checkups",
      icon: "medkit",
      color: "#5856D6",
      gradient: ["#5856D6", "#7674E8"],
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/heatly-child.jpg-kyeSB4d3cISzh9dPjtHnSvLRzZG6D1.jpeg",
      trend: currentChild?.activities?.health?.trend?.startsWith("+")
        ? "up"
        : "down",
      trendValue: currentChild?.activities?.health?.trend || "0%",
      screen: "HealthDetails",
    },
    {
      title: "Social",
      subtitle: "Social Development",
      icon: "people",
      color: "#AF52DE",
      gradient: ["#AF52DE", "#C77CEA"],
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/child-social.jpg-nzn6ufJRA5nRx2aMAv2olCJJwkZVji.jpeg",
      trend: currentChild?.activities?.social?.trend?.startsWith("+")
        ? "up"
        : "down",
      trendValue: currentChild?.activities?.social?.trend || "0%",
      screen: "SocialDetails",
    },
  ];

  // Calculate overall mood based on trends
  const calculateOverallMood = () => {
    const positiveCount = activityCards.filter(
      (card) => card.trend === "up"
    ).length;
    const negativeCount = activityCards.filter(
      (card) => card.trend === "down"
    ).length;
    return positiveCount > negativeCount;
  };

  const isHappyMood = calculateOverallMood();

  // Handle card press
  const handleCardPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      console.log(`${item.title} pressed`);
    }
  };

  // Render activity card
  const renderActivityCard = (item, index) => {
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
            {/* Trend Icon */}
            <View style={styles.trendIconContainer}>
              <View
                style={[
                  styles.trendIconBackground,
                  {
                    backgroundColor:
                      item.trend === "up" ? "#4CD964" : "#FF3B30",
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
        {/* Trend Icon */}
        <View style={styles.trendIconContainer}>
          <View
            style={[
              styles.trendIconBackground,
              { backgroundColor: item.trend === "up" ? "#4CD964" : "#FF3B30" },
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

        <View style={styles.cardContent}>
          <Ionicons name={item.icon} size={36} color="#FFFFFF" />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Add this child switcher modal component
  const renderChildSwitcherModal = () => {
    return (
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
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childSwitcherItem,
                    child.id === currentChildId && {
                      backgroundColor: `${theme.primary}15`,
                    },
                    { borderBottomColor: theme.borderLight },
                  ]}
                  onPress={() => handleSelectChild(child.id)}
                >
                  <Image
                    source={{ uri: child.image }}
                    style={styles.childSwitcherImage}
                  />
                  <View style={styles.childSwitcherInfo}>
                    <Text
                      style={[styles.childSwitcherName, { color: theme.text }]}
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
                  {child.id === currentChildId && (
                    <View
                      style={[
                        styles.currentChildIndicator,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
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
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          {/* Child Selector - REMOVE THIS */}

          {/* Mood Image */}
          <Image
            source={{
              uri: isHappyMood
                ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/happy-child-gw57JJN4O9GsOs6YZlRzr3ith1Kk3V.png"
                : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sad-child-3IDiaJp9IDBflOIP71HIcipKKIty0S.png",
            }}
            style={styles.moodImage}
            resizeMode="contain"
          />

          <Text style={[styles.headerText, { color: theme.text }]}>
            {currentChild.name.split(" ")[0]}'s Activity
          </Text>
          <Text style={[styles.subHeaderText, { color: theme.textSecondary }]}>
            Monitor and record daily activities
          </Text>
        </View>

        <View style={styles.cardGrid}>
          {activityCards.map((item, index) => renderActivityCard(item, index))}
        </View>
      </ScrollView>
      {renderChildSwitcherModal()}
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
});

export default Activity;
