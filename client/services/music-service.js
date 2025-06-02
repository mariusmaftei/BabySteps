import api from "./api";

export const getAllMusic = async () => {
  try {
    console.log("Fetching all music tracks...");
    const response = await api.get("/media/music");
    console.log(`Fetched ${response.data.length} music tracks successfully`);
    return response.data;
  } catch (error) {
    console.error("Error fetching music tracks:", error);
    throw error;
  }
};

export const getMusicByCategory = async (category) => {
  try {
    console.log(`Fetching music tracks for category: ${category}`);
    const response = await api.get("/media/music");
    const filteredTracks = response.data.filter(
      (track) => track.category === category
    );
    console.log(
      `Fetched ${filteredTracks.length} tracks for category ${category}`
    );
    return filteredTracks;
  } catch (error) {
    console.error(
      `Error fetching music tracks for category ${category}:`,
      error
    );
    throw error;
  }
};

export const getMusicById = async (id) => {
  try {
    console.log(`Fetching music track with ID: ${id}`);
    const response = await api.get("/media/music");
    const track = response.data.find((track) => track.id === id);

    if (!track) {
      throw new Error(`Track with ID ${id} not found`);
    }

    console.log(`Successfully fetched track: ${track.title}`);
    return track;
  } catch (error) {
    console.error(`Error fetching music track with ID ${id}:`, error);
    throw error;
  }
};

export const getMusicCategories = async () => {
  try {
    console.log("Fetching all music categories...");
    const response = await api.get("/media/music");
    const categories = [
      "All",
      ...new Set(response.data.map((track) => track.category)),
    ];
    console.log(`Fetched ${categories.length - 1} unique music categories`);
    return categories;
  } catch (error) {
    console.error("Error fetching music categories:", error);
    throw error;
  }
};

export default {
  getAllMusic,
  getMusicByCategory,
  getMusicById,
  getMusicCategories,
};
