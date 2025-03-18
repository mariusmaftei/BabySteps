import { db } from "../config/firebase.js";

export const getMusic = async (req, res) => {
  try {
    const musicCollection = db.collection("album");
    const snapshot = await musicCollection.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No music found" });
    }

    const musicList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(musicList);
  } catch (error) {
    console.error("Error fetching music:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
