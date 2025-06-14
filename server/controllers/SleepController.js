import Sleep from "../models/Sleep.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

const getRomaniaDateTime = () => {
  const now = new Date();
  const romaniaOffset = 3 * 60 * 60 * 1000; // UTC+3 for Romania (EEST)
  const romaniaTime = new Date(now.getTime() + romaniaOffset);

  const year = romaniaTime.getFullYear();
  const month = String(romaniaTime.getMonth() + 1).padStart(2, "0");
  const day = String(romaniaTime.getDate()).padStart(2, "0");
  const hours = String(romaniaTime.getHours()).padStart(2, "0");
  const minutes = String(romaniaTime.getMinutes()).padStart(2, "0");
  const seconds = String(romaniaTime.getSeconds()).padStart(2, "0");

  const romaniaDatetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  console.log(
    `Romania datetime: ${romaniaDatetime} (UTC: ${now.toISOString()})`
  );

  return romaniaDatetime;
};

const getTodayLocalDate = () => {
  const romaniaDatetime = getRomaniaDateTime();
  return romaniaDatetime.split(" ")[0];
};

const ensureDateTime = (dateStr) => {
  if (!dateStr) return getRomaniaDateTime();
  if (dateStr.length === 10) return `${dateStr} 00:00:00`;
  return dateStr;
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

    const dateTimeString = ensureDateTime(date);

    const datePart = dateTimeString.split(" ")[0];

    const existingRecords = await Sleep.findAll({
      where: {
        childId,
        date: {
          [Op.like]: `${datePart}%`,
        },
      },
    });

    let sleep;

    if (existingRecords.length > 0) {
      console.log(
        "Updating existing sleep record in database:",
        existingRecords[0].id
      );
      const existingRecord = existingRecords[0];
      existingRecord.napHours = napHours;
      existingRecord.nightHours = nightHours;
      existingRecord.notes = notes;
      existingRecord.sleepProgress = sleepProgress;
      existingRecord.date = dateTimeString;
      sleep = await existingRecord.save();
      console.log("Sleep record updated successfully in database:", sleep.id);
      return res.status(200).json(sleep);
    } else {
      console.log("Creating new sleep record in database with data:", {
        childId,
        napHours,
        nightHours,
        date: dateTimeString,
        notes,
        sleepProgress,
      });
      sleep = await Sleep.create({
        childId,
        napHours,
        nightHours,
        date: dateTimeString,
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
    sleep.date = ensureDateTime(date);
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

    console.log(`Fetching all sleep records for child ${childId}`);

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

    console.log(
      `Found ${sleepRecords.length} sleep records for child ${childId}:`,
      sleepRecords
    );

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

    console.log("Fetching sleep data for date range:", {
      childId,
      startDate,
      endDate,
    });

    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    const dateStrings = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateStrings.push(dateStr);
    }

    console.log("Looking for sleep records with dates:", dateStrings);

    const whereConditions = dateStrings.map((dateStr) => ({
      date: {
        [Op.like]: `${dateStr}%`,
      },
    }));

    const sleepRecords = await Sleep.findAll({
      where: {
        childId,
        [Op.or]: whereConditions,
      },
      order: [["date", "ASC"]],
    });

    console.log(
      `Found ${sleepRecords.length} sleep records:`,
      sleepRecords.map((r) => ({
        id: r.id,
        date: r.date,
        napHours: r.napHours,
        nightHours: r.nightHours,
      }))
    );

    return res.status(200).json(sleepRecords);
  } catch (error) {
    console.error("Error fetching sleep records by date range:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getWeeklySleep = async (req, res) => {
  try {
    const { childId } = req.params;

    console.log(`Fetching weekly sleep data for child ${childId}`);

    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    const today = new Date();
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(today.getDate() - 6);

    const todayStr = today.toISOString().split("T")[0];
    const sixDaysAgoStr = sixDaysAgo.toISOString().split("T")[0];

    console.log("Weekly date range:", {
      startDate: sixDaysAgoStr,
      endDate: todayStr,
    });

    const dateStrings = [];
    for (let d = new Date(sixDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateStrings.push(dateStr);
    }

    console.log("Looking for weekly sleep records with dates:", dateStrings);

    const whereConditions = dateStrings.map((dateStr) => ({
      date: {
        [Op.like]: `${dateStr}%`,
      },
    }));

    const sleepRecords = await Sleep.findAll({
      where: {
        childId,
        [Op.or]: whereConditions,
      },
      order: [["date", "ASC"]],
    });

    console.log(
      `Found ${sleepRecords.length} weekly sleep records:`,
      sleepRecords.map((r) => ({
        id: r.id,
        date: r.date,
        napHours: r.napHours,
        nightHours: r.nightHours,
      }))
    );

    return res.status(200).json(sleepRecords);
  } catch (error) {
    console.error("Error fetching weekly sleep records:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getMonthlySleep = async (req, res) => {
  try {
    const { childId } = req.params;
    const { year, month } = req.query;

    console.log(
      `Fetching monthly sleep data for child ${childId}, year: ${year}, month: ${month}`
    );

    const child = await Child.findOne({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or doesn't belong to user" });
    }

    const targetYear = Number.parseInt(year) || new Date().getFullYear();
    const targetMonth = Number.parseInt(month) || new Date().getMonth() + 1;

    const datePattern = `${targetYear}-${String(targetMonth).padStart(
      2,
      "0"
    )}-`;

    console.log(`Monthly date pattern for filtering: ${datePattern}`);

    const sleepRecords = await Sleep.findAll({
      where: {
        childId,
        date: {
          [Op.like]: `${datePattern}%`,
        },
      },
      order: [["date", "ASC"]],
    });

    console.log(
      `Found ${sleepRecords.length} monthly sleep records for ${datePattern}:`,
      sleepRecords.map((r) => ({
        id: r.id,
        date: r.date,
        napHours: r.napHours,
        nightHours: r.nightHours,
      }))
    );

    return res.status(200).json(sleepRecords);
  } catch (error) {
    console.error("Error fetching monthly sleep records:", error);
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

    const today = getTodayLocalDate();

    console.log(
      `Looking for today's sleep record for child ${childId} on date: ${today}`
    );

    const sleepRecords = await Sleep.findAll({
      where: {
        childId,
        date: {
          [Op.like]: `${today}%`,
        },
      },
      order: [["date", "DESC"]],
    });

    console.log(
      `Found ${sleepRecords.length} sleep records for today:`,
      sleepRecords
    );

    if (sleepRecords.length === 0) {
      const defaultRecord = {
        id: null,
        childId,
        napHours: 0,
        nightHours: 0,
        date: getRomaniaDateTime(),
        notes: "",
        totalHours: 0,
        sleepProgress: 0,
        isDefaultData: true,
      };

      return res.status(200).json(defaultRecord);
    }

    return res.status(200).json(sleepRecords[0]);
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

    const today = getTodayLocalDate();

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

    const sleepRecords = await Sleep.findAll({
      where: {
        childId,
        date: {
          [Op.like]: `${targetDate}%`,
        },
      },
      order: [["date", "DESC"]],
    });

    if (sleepRecords.length === 0) {
      const defaultRecord = {
        id: null,
        childId,
        napHours: 0,
        nightHours: 0,
        date: `${targetDate} 00:00:00`,
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
      ...sleepRecords[0].toJSON(),
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

    const now = new Date();
    const romaniaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
    );
    const yesterday = new Date(romaniaTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = `${yesterday.getFullYear()}-${String(
      yesterday.getMonth() + 1
    ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    const yesterdayDateTime = `${yesterdayFormatted} 12:00:00`;

    const children = await Child.findAll();
    console.log(
      `Found ${children.length} children to check for missing sleep records`
    );

    let autoFilledCount = 0;

    for (const child of children) {
      const existingRecords = await Sleep.findAll({
        where: {
          childId: child.id,
          date: {
            [Op.like]: `${yesterdayFormatted}%`,
          },
        },
      });

      if (existingRecords.length === 0) {
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
          date: yesterdayDateTime,
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
