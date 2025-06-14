import Diaper from "../models/Diaper.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

export const getDiaperChanges = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

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

export const getDiaperChangeById = async (req, res) => {
  try {
    const { id, childId } = req.params;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

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

export const createDiaperChange = async (req, res) => {
  try {
    const { childId } = req.params;
    const { date, type, color, consistency, notes } = req.body;
    const userId = req.user.id;

    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

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

export const updateDiaperChange = async (req, res) => {
  try {
    const { id, childId } = req.params;
    const { date, type, color, consistency, notes } = req.body;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    const diaperChange = await Diaper.findOne({
      where: {
        id,
        childId,
      },
    });

    if (!diaperChange) {
      return res.status(404).json({ message: "Diaper change not found" });
    }

    if (date) diaperChange.date = date;
    if (type) diaperChange.type = type;

    if (type === "wet") {
      diaperChange.color = null;
      diaperChange.consistency = null;
    } else {
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

export const deleteDiaperChange = async (req, res) => {
  try {
    const { id, childId } = req.params;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

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

export const getDiaperChangesByDateRange = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    const child = await Child.findOne({
      where: {
        id: childId,
        userId,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    parsedEndDate.setHours(23, 59, 59, 999);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const diaperChanges = await Diaper.findAll({
      where: {
        childId,
        date: {
          [Op.between]: [parsedStartDate, parsedEndDate],
        },
      },
      order: [["date", "ASC"]],
    });

    console.log(
      `Found ${diaperChanges.length} diaper changes between ${startDate} and ${endDate}`
    );

    res.status(200).json(diaperChanges);
  } catch (error) {
    console.error("Error fetching diaper changes by date range:", error);
    res.status(500).json({ error: error.message });
  }
};
