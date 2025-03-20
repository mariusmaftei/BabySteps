import Diaper from "../models/Diaper.js";
import Child from "../models/Child.js";

// Get all diaper changes for a specific child
export const getDiaperChanges = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.id;

    // Verify the child belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    // Get diaper changes for the child, ordered by date (newest first)
    const diaperChanges = await Diaper.findAll({
      where: { childId },
      order: [["date", "DESC"]],
    });

    res.status(200).json(diaperChanges);
  } catch (error) {
    console.error("Error fetching diaper changes:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific diaper change by ID
export const getDiaperChangeById = async (req, res) => {
  try {
    const { id, childId } = req.params;
    const userId = req.user.id;

    // Verify the child belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    // Get the specific diaper change
    const diaperChange = await Diaper.findOne({
      where: {
        id,
        childId,
      },
    });

    if (!diaperChange) {
      return res.status(404).json({ message: "Diaper change not found" });
    }

    res.status(200).json(diaperChange);
  } catch (error) {
    console.error("Error fetching diaper change:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new diaper change
export const createDiaperChange = async (req, res) => {
  try {
    const { childId } = req.params;
    const { date, type, color, consistency, notes } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }

    // Verify the child belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    // Create the diaper change
    const newDiaperChange = await Diaper.create({
      childId,
      date: date || new Date(),
      type,
      color: type === "wet" ? null : color,
      consistency: type === "wet" ? null : consistency,
      notes,
    });

    res.status(201).json(newDiaperChange);
  } catch (error) {
    console.error("Error creating diaper change:", error);
    res.status(400).json({ error: error.message });
  }
};

// Update a diaper change
export const updateDiaperChange = async (req, res) => {
  try {
    const { id, childId } = req.params;
    const { date, type, color, consistency, notes } = req.body;
    const userId = req.user.id;

    // Verify the child belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    // Find the diaper change
    const diaperChange = await Diaper.findOne({
      where: {
        id,
        childId,
      },
    });

    if (!diaperChange) {
      return res.status(404).json({ message: "Diaper change not found" });
    }

    // Update fields
    if (date) diaperChange.date = date;
    if (type) diaperChange.type = type;

    // If type is wet, set color and consistency to null
    if (type === "wet") {
      diaperChange.color = null;
      diaperChange.consistency = null;
    } else {
      // Only update color and consistency if type is dirty or both
      if (color !== undefined) diaperChange.color = color;
      if (consistency !== undefined) diaperChange.consistency = consistency;
    }

    if (notes !== undefined) diaperChange.notes = notes;

    await diaperChange.save();

    res.status(200).json(diaperChange);
  } catch (error) {
    console.error("Error updating diaper change:", error);
    res.status(400).json({ error: error.message });
  }
};

// Delete a diaper change
export const deleteDiaperChange = async (req, res) => {
  try {
    const { id, childId } = req.params;
    const userId = req.user.id;

    // Verify the child belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    // Find the diaper change
    const diaperChange = await Diaper.findOne({
      where: {
        id,
        childId,
      },
    });

    if (!diaperChange) {
      return res.status(404).json({ message: "Diaper change not found" });
    }

    await diaperChange.destroy();

    res.status(200).json({ message: "Diaper change deleted successfully" });
  } catch (error) {
    console.error("Error deleting diaper change:", error);
    res.status(500).json({ error: error.message });
  }
};
