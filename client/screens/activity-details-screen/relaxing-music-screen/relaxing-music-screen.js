import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../context/theme-context";
import Icon from "react-native-vector-icons/Feather";
import Slider from "@react-native-community/slider";

// Dummy data for relaxing music
const dummySongs = [
  {
    id: "1",
    title: "Twinkle Twinkle Little Star",
    artist: "Lullaby Dreams",
    duration: "3:24",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "Lullaby",
  },
  {
    id: "2",
    title: "Ocean Waves",
    artist: "Nature Sounds",
    duration: "5:12",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "White Noise",
  },
  {
    id: "3",
    title: "Brahms Lullaby",
    artist: "Classical Baby",
    duration: "4:05",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "Classical",
  },
  {
    id: "4",
    title: "Gentle Rain",
    artist: "Nature Sounds",
    duration: "6:30",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "White Noise",
  },
  {
    id: "5",
    title: "Rock-a-bye Baby",
    artist: "Lullaby Dreams",
    duration: "2:58",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "Lullaby",
  },
  {
    id: "6",
    title: "Heartbeat Sounds",
    artist: "Womb Sounds",
    duration: "8:15",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "White Noise",
  },
  {
    id: "7",
    title: "Mozart for Babies",
    artist: "Classical Baby",
    duration: "4:45",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "Classical",
  },
  {
    id: "8",
    title: "Soft Piano Lullaby",
    artist: "Piano Dreams",
    duration: "5:20",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "Instrumental",
  },
  {
    id: "9",
    title: "Hush Little Baby",
    artist: "Lullaby Dreams",
    duration: "3:10",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "Lullaby",
  },
  {
    id: "10",
    title: "Calming Guitar",
    artist: "Acoustic Baby",
    duration: "4:35",
    coverArt:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diaper.jpg-FaQNeaZWZLIIiQ91zJ9jFp56kijoWa.jpeg",
    category: "Instrumental",
  },
];

// Get all unique categories
const categories = ["All", ...new Set(dummySongs.map((song) => song.category))];

const RelaxingMusicScreen = () => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentSong, setCurrentSong] = useState(dummySongs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);

  // Animation for the album rotation
  const spinValue = new Animated.Value(0);

  // Filter songs based on selected category
  const filteredSongs =
    selectedCategory === "All"
      ? dummySongs
      : dummySongs.filter((song) => song.category === selectedCategory);

  // Start spinning animation when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
    }

    // Simulate progress
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.01;
        });
      }, 300);
    }

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Create the spinning animation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const formatTime = (progress) => {
    const duration = currentSong ? currentSong.duration : "0:00";
    const [minutes, seconds] = duration.split(":");
    const totalSeconds =
      Number.parseInt(minutes) * 60 + Number.parseInt(seconds);
    const currentSeconds = Math.floor(progress * totalSeconds);
    const currentMinutes = Math.floor(currentSeconds / 60);
    const remainingSeconds = currentSeconds % 60;
    return `${currentMinutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSongSelect = (song) => {
    setCurrentSong(song);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Now Playing Section */}
      <View
        style={[
          styles.nowPlayingContainer,
          { backgroundColor: theme.cardBackground },
        ]}
      >
        <View style={styles.songInfoContainer}>
          <Animated.View
            style={[
              styles.albumCoverContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Image
              source={{ uri: currentSong.coverArt }}
              style={styles.albumCover}
            />
          </Animated.View>

          <View style={styles.songDetails}>
            <Text style={[styles.songTitle, { color: theme.text }]}>
              {currentSong.title}
            </Text>
            <Text style={[styles.artistName, { color: theme.textLight }]}>
              {currentSong.artist}
            </Text>
            <Text style={[styles.category, { color: theme.primary }]}>
              {currentSong.category}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={[styles.timeText, { color: theme.textLight }]}>
            {formatTime(progress)}
          </Text>
          <Slider
            style={styles.progressBar}
            minimumValue={0}
            maximumValue={1}
            value={progress}
            onValueChange={setProgress}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.borderLight}
            thumbTintColor={theme.primary}
          />
          <Text style={[styles.timeText, { color: theme.textLight }]}>
            {currentSong.duration}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="skip-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: theme.primary }]}
            onPress={handlePlayPause}
          >
            <Icon name={isPlaying ? "pause" : "play"} size={30} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Icon name="skip-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Volume Control */}
        <View style={styles.volumeContainer}>
          <Icon name="volume-1" size={20} color={theme.textLight} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.borderLight}
            thumbTintColor={theme.primary}
          />
          <Icon name="volume-2" size={20} color={theme.textLight} />
        </View>
      </View>

      {/* Category Selector */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === category ? "#FFF" : theme.text,
                  },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Song List */}
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.songItem,
              {
                backgroundColor:
                  currentSong.id === item.id
                    ? `${theme.primary}20`
                    : theme.cardBackground,
              },
            ]}
            onPress={() => handleSongSelect(item)}
          >
            <Image source={{ uri: item.coverArt }} style={styles.songCover} />
            <View style={styles.songItemDetails}>
              <Text style={[styles.songItemTitle, { color: theme.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.songItemArtist, { color: theme.textLight }]}>
                {item.artist}
              </Text>
            </View>
            <Text style={[styles.songDuration, { color: theme.textLight }]}>
              {item.duration}
            </Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.songList}
      />
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  nowPlayingContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  songInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  albumCoverContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginRight: 16,
  },
  albumCover: {
    width: "100%",
    height: "100%",
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  categoryWrapper: {
    marginBottom: 10,
    height: 42, // Increased by 50% from 28px
  },
  categoryContainer: {
    height: 42,
  },
  categoryContent: {
    paddingRight: 16,
    alignItems: "center", // Center items vertically
  },
  categoryButton: {
    paddingHorizontal: 18, // Increased from 12px
    paddingVertical: 3, // Increased from 2px
    borderRadius: 20, // Increased from 14px
    marginRight: 10, // Increased from 8px
    backgroundColor: "#F0F0F0",
    height: 36, // Increased by 50% from 24px
    justifyContent: "center", // Center text vertically
    alignItems: "center", // Center text horizontally
    minWidth: 60, // Added minimum width for better touch targets
  },
  categoryText: {
    fontSize: 13, // Increased from 11px
    fontWeight: "500",
    textAlign: "center", // Ensure text is centered
  },
  songList: {
    paddingBottom: 80,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  songItemDetails: {
    flex: 1,
  },
  songItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  songItemArtist: {
    fontSize: 14,
  },
  songDuration: {
    fontSize: 14,
  },
});

export default RelaxingMusicScreen;
