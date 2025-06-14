import { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTheme } from "../../../context/theme-context";
import Icon from "react-native-vector-icons/Feather";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import * as musicService from "../../../services/music-service";

const MusicScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const soundRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const audioConfiguredRef = useRef(false);

  const spinValue = new Animated.Value(0);

  useEffect(() => {
    const fetchMusicData = async () => {
      try {
        setLoading(true);
        setError(null);

        const musicData = await musicService.getAllMusic();
        setSongs(musicData);

        const uniqueCategories = [
          "All",
          ...new Set(musicData.map((song) => song.category)),
        ];
        setCategories(uniqueCategories);

        if (musicData.length > 0) {
          setCurrentSong(musicData[0]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching music data:", err);
        setError("Failed to load music. Please try again later.");
        setLoading(false);
      }
    };

    fetchMusicData();

    const setupAudio = async () => {
      if (audioConfiguredRef.current) return;

      try {
        const audioConfig = {
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        };

        if (Platform.OS === "android") {
          audioConfig.shouldDuckAndroid = true;
        }

        await Audio.setAudioModeAsync(audioConfig);
        console.log("Audio mode set successfully with minimal config");
        audioConfiguredRef.current = true;
      } catch (err) {
        console.error("Error setting audio mode:", err);
      }
    };

    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const filteredSongs =
    selectedCategory === "All"
      ? songs
      : songs.filter((song) => song.category === selectedCategory);

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

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const loadAndPlaySong = async (song) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      console.log(`Loading song: ${song.title}, URL: ${song.trackUrl}`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.trackUrl },
        {
          shouldPlay: true,
          volume: volume,
          progressUpdateIntervalMillis: 1000,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentSong(song);
      setIsPlaying(true);

      startProgressTracking();

      console.log(`Now playing: ${song.title}`);
    } catch (err) {
      console.error("Error loading and playing song:", err);
      setError(`Failed to play "${song.title}". Please try again.`);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(0);
        playNextSong();
      }
    }
  };

  const startProgressTracking = () => {
    progressIntervalRef.current = setInterval(async () => {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            const newProgress = status.positionMillis / status.durationMillis;
            setProgress(newProgress || 0);
            setPosition(status.positionMillis || 0);
          }
        } catch (err) {
          console.error("Error getting playback status:", err);
        }
      }
    }, 1000);
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return "0:00";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayPause = async () => {
    if (!currentSong) return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        if (soundRef.current) {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          startProgressTracking();
        } else {
          await loadAndPlaySong(currentSong);
        }
      }
    } catch (err) {
      console.error("Error toggling play/pause:", err);
    }
  };

  const handleSongSelect = async (song) => {
    if (currentSong && currentSong.id === song.id) {
      handlePlayPause();
    } else {
      await loadAndPlaySong(song);
    }
  };

  const handleSeek = async (value) => {
    if (!soundRef.current) return;

    try {
      const newPosition = value * duration;
      await soundRef.current.setPositionAsync(newPosition);
      setProgress(value);
      setPosition(newPosition);
    } catch (err) {
      console.error("Error seeking:", err);
    }
  };

  const handleVolumeChange = async (value) => {
    setVolume(value);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(value);
      } catch (err) {
        console.error("Error setting volume:", err);
      }
    }
  };

  const playNextSong = () => {
    if (!currentSong || filteredSongs.length === 0) return;

    const currentIndex = filteredSongs.findIndex(
      (song) => song.id === currentSong.id
    );
    const nextIndex = (currentIndex + 1) % filteredSongs.length;
    loadAndPlaySong(filteredSongs[nextIndex]);
  };

  const playPreviousSong = () => {
    if (!currentSong || filteredSongs.length === 0) return;

    const currentIndex = filteredSongs.findIndex(
      (song) => song.id === currentSong.id
    );
    const prevIndex =
      (currentIndex - 1 + filteredSongs.length) % filteredSongs.length;
    loadAndPlaySong(filteredSongs[prevIndex]);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading music...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.background },
        ]}
      >
        <Icon name="alert-circle" size={50} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render empty state
  if (songs.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.background },
        ]}
      >
        <Icon name="music-off" size={50} color={theme.textLight} />
        <Text style={[styles.emptyText, { color: theme.text }]}>
          No music available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Now Playing Section */}
      <View
        style={[
          styles.nowPlayingContainer,
          { backgroundColor: theme.cardBackground },
        ]}
      >
        {currentSong && (
          <>
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
                  onError={(e) =>
                    console.log("Error loading cover art:", e.nativeEvent.error)
                  }
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
                {formatTime(position)}
              </Text>
              <Slider
                style={styles.progressBar}
                minimumValue={0}
                maximumValue={1}
                value={progress}
                onValueChange={setProgress}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.borderLight}
                thumbTintColor={theme.primary}
              />
              <Text style={[styles.timeText, { color: theme.textLight }]}>
                {formatTime(duration)}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={playPreviousSong}
              >
                <Icon name="skip-back" size={24} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.primary }]}
                onPress={handlePlayPause}
              >
                <Icon
                  name={isPlaying ? "pause" : "play"}
                  size={30}
                  color="#FFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={playNextSong}
              >
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
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.borderLight}
                thumbTintColor={theme.primary}
              />
              <Icon name="volume-2" size={20} color={theme.textLight} />
            </View>
          </>
        )}
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
                  currentSong && currentSong.id === item.id
                    ? `${theme.primary}20`
                    : theme.cardBackground,
              },
            ]}
            onPress={() => handleSongSelect(item)}
          >
            <Image
              source={{ uri: item.coverArt }}
              style={styles.songCover}
              onError={(e) =>
                console.log("Error loading song cover:", e.nativeEvent.error)
              }
            />
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
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
    backgroundColor: "#f0f0f0",
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
    height: 42,
  },
  categoryContainer: {
    height: 42,
  },
  categoryContent: {
    paddingRight: 16,
    alignItems: "center",
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 3,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#F0F0F0",
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
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
    backgroundColor: "#f0f0f0",
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

export default MusicScreen;
