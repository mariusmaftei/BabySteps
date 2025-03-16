import Sleep from "../models/Sleep.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

// Create a new sleep record
export const createSleep = async (req, res) => {
  try {
    const { childId, napHours, nightHours, date, notes } = req.body;

    console.log("Received sleep data for database save:", {
      childId,
      napHours,
      nightHours,
      date,
      notes,
    });

    // Validate child belongs to user
    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      console.error(
        "Child not found or doesn't belong to user:",
        childId,
        req.user.id
      );
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    // Check if a record already exists for this child and date
    const existingRecord = await Sleep.findOne({
      where: {
        childId,
        date: new Date(date),
      },
    });

    let sleep;

    if (existingRecord) {
      // Update existing record
      console.log(
        "Updating existing sleep record in database:",
        existingRecord.id
      );
      existingRecord.napHours = napHours;
      existingRecord.nightHours = nightHours;
      existingRecord.notes = notes;
      sleep = await existingRecord.save();
      console.log("Sleep record updated successfully in database:", sleep.id);
      return res.status(200).json(sleep);
    } else {
      // Create new record
      console.log("Creating new sleep record in database with data:", {
        childId,
        napHours,
        nightHours,
        date: new Date(date),
        notes,
      });
      sleep = await Sleep.create({
        childId,
        napHours,
        nightHours,
        date: new Date(date),
        notes,
      });
      console.log(
        "Sleep record created successfully in database with ID:",
        sleep.id
      );
      return res.status(201).json(sleep);
    }
  } catch (error) {
    console.error("Database error creating sleep record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get all sleep records for a child
export const getSleepByChild = async (req, res) => {
  try {
    const { childId } = req.params;

    // Validate child belongs to user
    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    const sleepRecords = await Sleep.findAll({
      where: { childId },
      order: [["date", "DESC"]],
    });

    return res.status(200).json(sleepRecords);
  } catch (error) {
    console.error("Error fetching sleep records:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get a specific sleep record
export const getSleepById = async (req, res) => {
  try {
    const { id } = req.params;

    const sleep = await Sleep.findByPk(id);

    if (!sleep) {
      return res.status(404).json({ message: "Sleep record not found" });
    }

    // Validate child belongs to user
    const child = await Child.findOne({
      where: { id: sleep.childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this sleep record" });
    }

    return res.status(200).json(sleep);
  } catch (error) {
    console.error("Error fetching sleep record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a sleep record
export const updateSleep = async (req, res) => {
  try {
    const { id } = req.params;
    const { napHours, nightHours, date, notes } = req.body;

    console.log(`Updating sleep record in database with ID: ${id}`, {
      napHours,
      nightHours,
      date,
      notes,
    });

    const sleep = await Sleep.findByPk(id);

    if (!sleep) {
      console.error("Sleep record not found in database:", id);
      return res.status(404).json({ message: "Sleep record not found" });
    }

    // Validate child belongs to user
    const child = await Child.findOne({
      where: { id: sleep.childId, userId: req.user.id },
    });

    if (!child) {
      console.error(
        "Not authorized to update this sleep record:",
        sleep.childId,
        req.user.id
      );
      return res
        .status(403)
        .json({ message: "Not authorized to update this sleep record" });
    }

    // Update the record
    sleep.napHours = napHours !== undefined ? napHours : sleep.napHours;
    sleep.nightHours = nightHours !== undefined ? nightHours : sleep.nightHours;
    sleep.date = date ? new Date(date) : sleep.date;
    sleep.notes = notes !== undefined ? notes : sleep.notes;

    await sleep.save();
    console.log("Sleep record updated successfully in database:", sleep.id);

    return res.status(200).json(sleep);
  } catch (error) {
    console.error("Database error updating sleep record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a sleep record
export const deleteSleep = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Attempting to delete sleep record with ID: ${id}`);

    const sleep = await Sleep.findByPk(id);

    if (!sleep) {
      console.error("Sleep record not found in database:", id);
      return res.status(404).json({ message: "Sleep record not found" });
    }

    // Validate child belongs to user
    const child = await Child.findOne({
      where: { id: sleep.childId, userId: req.user.id },
    });

    if (!child) {
      console.error(
        "Not authorized to delete this sleep record:",
        sleep.childId,
        req.user.id
      );
      return res
        .status(403)
        .json({ message: "Not authorized to delete this sleep record" });
    }

    await sleep.destroy();
    console.log("Sleep record deleted successfully from database:", id);

    return res
      .status(200)
      .json({ message: "Sleep record deleted successfully" });
  } catch (error) {
    console.error("Database error deleting sleep record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get sleep records for a date range
export const getSleepByDateRange = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate child belongs to user
    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    // Set up date range filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      dateFilter.date = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      dateFilter.date = {
        [Op.lte]: new Date(endDate),
      };
    }

    const sleepRecords = await Sleep.findAll({
      where: {
        childId,
        ...dateFilter,
      },
      order: [["date", "DESC"]],
    });

    return res.status(200).json(sleepRecords);
  } catch (error) {
    console.error("Error fetching sleep records by date range:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get today's sleep record for a child
export const getTodaySleep = async (req, res) => {
  try {
    const { childId } = req.params;

    // Validate child belongs to user
    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    // Get today's date (start and end)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sleepRecord = await Sleep.findOne({
      where: {
        childId,
        date: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    if (!sleepRecord) {
      return res
        .status(404)
        .json({ message: "No sleep record found for today" });
    }

    return res.status(200).json(sleepRecord);
  } catch (error) {
    console.error("Error fetching today's sleep record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
