import Sleep from "../models/Sleep.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

// Helper function to get today's date in Romania timezone (YYYY-MM-DD format)
const getTodayLocalDate = () => {
  const now = new Date();
  // Convert to Romania timezone (Europe/Bucharest)
  const romaniaDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
  );

  const year = romaniaDate.getFullYear();
  const month = String(romaniaDate.getMonth() + 1).padStart(2, "0");
  const day = String(romaniaDate.getDate()).padStart(2, "0");

  console.log(
    `Romania local date: ${year}-${month}-${day} (UTC: ${
      now.toISOString().split("T")[0]
    })`
  );

  return `${year}-${month}-${day}`;
};

export const createSleep = async (req, res) => {
  try {
    const { childId, napHours, nightHours, date, notes, sleepProgress } =
      req.body;

    console.log("Received sleep data for database save:", {
      childId,
      napHours,
      nightHours,
      date,
      notes,
      sleepProgress,
    });

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

    // Use the date string as-is from the client (no conversion)
    const dateString = date || getTodayLocalDate();

    const existingRecord = await Sleep.findOne({
      where: {
        childId,
        date: dateString,
      },
    });

    let sleep;

    if (existingRecord) {
      console.log(
        "Updating existing sleep record in database:",
        existingRecord.id
      );
      existingRecord.napHours = napHours;
      existingRecord.nightHours = nightHours;
      existingRecord.notes = notes;
      existingRecord.sleepProgress = sleepProgress;
      existingRecord.date = dateString;
      sleep = await existingRecord.save();
      console.log("Sleep record updated successfully in database:", sleep.id);
      return res.status(200).json(sleep);
    } else {
      console.log("Creating new sleep record in database with data:", {
        childId,
        napHours,
        nightHours,
        date: dateString,
        notes,
        sleepProgress,
      });
      sleep = await Sleep.create({
        childId,
        napHours,
        nightHours,
        date: dateString,
        notes,
        sleepProgress,
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

export const updateSleep = async (req, res) => {
  try {
    const { id } = req.params;
    const { napHours, nightHours, date, notes, sleepProgress } = req.body;

    console.log(`Updating sleep record in database with ID: ${id}`, {
      napHours,
      nightHours,
      date,
      notes,
      sleepProgress,
    });

    const sleep = await Sleep.findByPk(id);

    if (!sleep) {
      console.error("Sleep record not found in database:", id);
      return res.status(404).json({ message: "Sleep record not found" });
    }

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

    sleep.napHours = napHours !== undefined ? napHours : sleep.napHours;
    sleep.nightHours = nightHours !== undefined ? nightHours : sleep.nightHours;
    sleep.date = date || sleep.date; // Use the date string as-is from client
    sleep.notes = notes !== undefined ? notes : sleep.notes;
    sleep.sleepProgress =
      sleepProgress !== undefined ? sleepProgress : sleep.sleepProgress;

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

export const getSleepByChild = async (req, res) => {
  try {
    const { childId } = req.params;

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

export const getSleepById = async (req, res) => {
  try {
    const { id } = req.params;

    const sleep = await Sleep.findByPk(id);

    if (!sleep) {
      return res.status(404).json({ message: "Sleep record not found" });
    }

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

export const deleteSleep = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Attempting to delete sleep record with ID: ${id}`);

    const sleep = await Sleep.findByPk(id);

    if (!sleep) {
      console.error("Sleep record not found in database:", id);
      return res.status(404).json({ message: "Sleep record not found" });
    }

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

export const getSleepByDateRange = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    const dateFilter = {};
    if (startDate && endDate) {
      // Since date is now a string, we can use string comparison
      dateFilter.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      dateFilter.date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      dateFilter.date = {
        [Op.lte]: endDate,
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

export const getTodaySleep = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    // Get today's date in local format (YYYY-MM-DD)
    const today = getTodayLocalDate();

    const sleepRecord = await Sleep.findOne({
      where: {
        childId,
        date: today,
      },
    });

    if (!sleepRecord) {
      // Return a default record with today's date
      const defaultRecord = {
        id: null,
        childId,
        napHours: 0,
        nightHours: 0,
        date: today,
        notes: "",
        totalHours: 0,
        sleepProgress: 0,
        isDefaultData: true,
      };

      return res.status(200).json(defaultRecord);
    }

    return res.status(200).json(sleepRecord);
  } catch (error) {
    console.error("Error fetching today's sleep record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getCurrentSleepData = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    const now = new Date();
    const currentHour = now.getHours();

    // Get today's date in local format (YYYY-MM-DD)
    const today = getTodayLocalDate();

    // If before noon, get yesterday's date in Romania timezone
    let targetDate = today;
    if (currentHour < 12) {
      const romaniaTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
      );
      const yesterday = new Date(romaniaTime);
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = `${yesterday.getFullYear()}-${String(
        yesterday.getMonth() + 1
      ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    }

    console.log(
      `Getting sleep data for child ${childId} for date ${targetDate} (current hour: ${currentHour})`
    );

    const sleepRecord = await Sleep.findOne({
      where: {
        childId,
        date: targetDate,
      },
    });

    if (!sleepRecord) {
      // Return a default record
      const defaultRecord = {
        id: null,
        childId,
        napHours: 0,
        nightHours: 0,
        date: targetDate,
        notes: "",
        totalHours: 0,
        sleepProgress: 0,
        isDefaultData: true,
        targetDate: targetDate,
        isBeforeNoon: currentHour < 12,
      };

      return res.status(200).json(defaultRecord);
    }

    return res.status(200).json({
      ...sleepRecord.toJSON(),
      targetDate: targetDate,
      isBeforeNoon: currentHour < 12,
    });
  } catch (error) {
    console.error("Error fetching current sleep data:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const autoFillSleepRecords = async (req, res) => {
  try {
    console.log("Starting auto-fill process for missing sleep records");

    // Get yesterday's date in Romania timezone (YYYY-MM-DD)
    const now = new Date();
    const romaniaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
    );
    const yesterday = new Date(romaniaTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = `${yesterday.getFullYear()}-${String(
      yesterday.getMonth() + 1
    ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const children = await Child.findAll();
    console.log(
      `Found ${children.length} children to check for missing sleep records`
    );

    let autoFilledCount = 0;

    for (const child of children) {
      const existingRecord = await Sleep.findOne({
        where: {
          childId: child.id,
          date: yesterdayFormatted,
        },
      });

      if (!existingRecord) {
        console.log(
          `No sleep record found for child ${child.id} on ${yesterdayFormatted}, creating auto-filled record`
        );

        let ageInMonths = 24;
        if (child.age) {
          const ageText = child.age;
          const ageNum = Number.parseInt(ageText.split(" ")[0]) || 0;
          const ageUnit = ageText.includes("month") ? "months" : "years";
          ageInMonths = ageUnit === "months" ? ageNum : ageNum * 12;
        }

        let recommendedNapHours = 2;
        let recommendedNightHours = 10;

        if (ageInMonths < 4) {
          recommendedNapHours = 8;
          recommendedNightHours = 8;
        } else if (ageInMonths >= 4 && ageInMonths <= 12) {
          recommendedNapHours = 4;
          recommendedNightHours = 10;
        } else if (ageInMonths > 12 && ageInMonths <= 24) {
          recommendedNapHours = 2;
          recommendedNightHours = 11;
        } else if (ageInMonths > 24 && ageInMonths <= 60) {
          recommendedNapHours = 1;
          recommendedNightHours = 11;
        } else {
          recommendedNapHours = 0;
          recommendedNightHours = 10;
        }

        await Sleep.create({
          childId: child.id,
          napHours: recommendedNapHours,
          nightHours: recommendedNightHours,
          date: yesterdayFormatted,
          notes: "Auto-filled with recommended values",
          autoFilled: true,
          sleepProgress: 0,
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
