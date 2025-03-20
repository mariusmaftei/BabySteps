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

// Add this new function to get sleep data based on time (before/after noon)
export const getCurrentSleepData = async (req, res) => {
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

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();

    // If before noon (12 PM), get yesterday's data
    // If after noon, get today's data
    let targetDate;
    if (currentHour < 12) {
      // Before noon - get yesterday's data
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - 1);
    } else {
      // After noon - get today's data
      targetDate = now;
    }

    // Format the date to YYYY-MM-DD
    const formattedDate = targetDate.toISOString().split("T")[0];

    console.log(
      `Getting sleep data for child ${childId} for date ${formattedDate} (current hour: ${currentHour})`
    );

    // Find the sleep record for the target date
    const sleepRecord = await Sleep.findOne({
      where: {
        childId,
        date: formattedDate,
      },
    });

    if (!sleepRecord) {
      return res.status(404).json({
        message: "No sleep record found for the target date",
        targetDate: formattedDate,
        isBeforeNoon: currentHour < 12,
      });
    }

    return res.status(200).json({
      ...sleepRecord.toJSON(),
      targetDate: formattedDate,
      isBeforeNoon: currentHour < 12,
    });
  } catch (error) {
    console.error("Error fetching current sleep data:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Add this new function to auto-fill missing sleep records
export const autoFillSleepRecords = async (req, res) => {
  try {
    console.log("Starting auto-fill process for missing sleep records");

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split("T")[0];

    // Get all children
    const children = await Child.findAll();
    console.log(
      `Found ${children.length} children to check for missing sleep records`
    );

    let autoFilledCount = 0;

    // For each child, check if they have a sleep record for yesterday
    for (const child of children) {
      const existingRecord = await Sleep.findOne({
        where: {
          childId: child.id,
          date: yesterdayFormatted,
        },
      });

      // If no record exists, create one with recommended values based on age
      if (!existingRecord) {
        console.log(
          `No sleep record found for child ${child.id} on ${yesterdayFormatted}, creating auto-filled record`
        );

        // Get child's age in months for recommendations
        let ageInMonths = 24; // Default to toddler if no age
        if (child.age) {
          const ageText = child.age;
          const ageNum = Number.parseInt(ageText.split(" ")[0]) || 0;
          const ageUnit = ageText.includes("month") ? "months" : "years";
          ageInMonths = ageUnit === "months" ? ageNum : ageNum * 12;
        }

        // Get recommended sleep hours based on age
        let recommendedNapHours = 2;
        let recommendedNightHours = 10;

        if (ageInMonths < 4) {
          // Newborn (0-3 months)
          recommendedNapHours = 8;
          recommendedNightHours = 8;
        } else if (ageInMonths >= 4 && ageInMonths <= 12) {
          // Infant (4-12 months)
          recommendedNapHours = 4;
          recommendedNightHours = 10;
        } else if (ageInMonths > 12 && ageInMonths <= 24) {
          // Toddler (1-2 years)
          recommendedNapHours = 2;
          recommendedNightHours = 11;
        } else if (ageInMonths > 24 && ageInMonths <= 60) {
          // Preschooler (3-5 years)
          recommendedNapHours = 1;
          recommendedNightHours = 11;
        } else {
          // School-age (6-12 years)
          recommendedNapHours = 0;
          recommendedNightHours = 10;
        }

        // Create auto-filled record
        await Sleep.create({
          childId: child.id,
          napHours: recommendedNapHours,
          nightHours: recommendedNightHours,
          date: yesterdayFormatted,
          notes: "Auto-filled with recommended values",
          autoFilled: true,
        });

        autoFilledCount++;
      }
    }

    console.log(
      `Auto-fill process completed. Created ${autoFilledCount} new sleep records.`
    );
    return res.status(200).json({
      message: "Auto-fill process completed successfully",
      autoFilledCount,
    });
  } catch (error) {
    console.error("Error in auto-fill process:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
