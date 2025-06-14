import Feeding from "../models/Feeding.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

const getRomaniaDateTime = () => {
  const now = new Date();

  const romaniaOffset = 3 * 60;

  const romaniaTime = new Date(now.getTime() + romaniaOffset * 60 * 1000);

  const year = romaniaTime.getUTCFullYear();
  const month = String(romaniaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(romaniaTime.getUTCDate()).padStart(2, "0");
  const hours = String(romaniaTime.getUTCHours()).padStart(2, "0");
  const minutes = String(romaniaTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(romaniaTime.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getRomaniaDateTimeIntl = () => {
  const now = new Date();
  const romaniaTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const year = romaniaTime.getUTCFullYear();
  const month = String(romaniaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(romaniaTime.getUTCDate()).padStart(2, "0");
  const hours = String(romaniaTime.getUTCHours()).padStart(2, "0");
  const minutes = String(romaniaTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(romaniaTime.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getRomaniaDateRange = (dateStr) => {
  if (dateStr.length === 10) {
    return {
      start: `${dateStr} 00:00:00`,
      end: `${dateStr} 23:59:59`,
    };
  }

  const datePart = dateStr.split(" ")[0];
  return {
    start: `${datePart} 00:00:00`,
    end: `${datePart} 23:59:59`,
  };
};

const extractDateKey = (feeding) => {
  try {
    if (!feeding || !feeding.date) {
      console.warn("Feeding record missing date:", feeding);
      return null;
    }

    let dateStr = feeding.date;

    if (typeof dateStr === "object" && dateStr instanceof Date) {
      dateStr = dateStr.toISOString();
    }

    if (typeof dateStr !== "string") {
      console.warn("Invalid date format:", dateStr);
      return null;
    }

    if (dateStr.includes("T")) {
      return dateStr.split("T")[0];
    } else if (dateStr.includes(" ")) {
      return dateStr.split(" ")[0];
    } else if (dateStr.length >= 10) {
      return dateStr.substring(0, 10);
    }

    return null;
  } catch (error) {
    console.error("Error extracting date key:", error, feeding);
    return null;
  }
};

export const createFeeding = async (req, res) => {
  try {
    const { childId, type, startTime, endTime, duration, side, amount, note } =
      req.body;

    if (!childId || !type) {
      return res.status(400).json({
        success: false,
        message: "Child ID and feeding type are required",
      });
    }

    if (type === "breast" && (!duration || !side)) {
      return res.status(400).json({
        success: false,
        message: "Duration and side are required for breastfeeding",
      });
    }

    if ((type === "bottle" || type === "solid") && !amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required for bottle feeding and solid food",
      });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const feedingDateTime =
      req.body.date || req.body.timestamp || new Date().toISOString();

    console.log(`Received datetime from client: ${feedingDateTime}`);

    const feedingData = {
      childId,
      type,
      startTime: type === "breast" ? startTime : null,
      endTime: type === "breast" ? endTime : null,
      duration: type === "breast" ? duration : 0,
      side: type === "breast" ? side : null,
      amount: type === "bottle" || type === "solid" ? amount : 0,
      note: note || null,
      timestamp: feedingDateTime,
      date: feedingDateTime,
    };

    const feeding = await Feeding.create(feedingData);

    console.log(
      `Created feeding record with Romania datetime: ${feedingDateTime}`
    );

    return res.status(201).json({
      success: true,
      data: feeding,
      message: "Feeding record created successfully",
    });
  } catch (error) {
    console.error("Error creating feeding record:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getFeedingsByChildId = async (req, res) => {
  try {
    const { childId } = req.params;

    console.log(`Getting all feedings for child ID: ${childId}`);

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const feedings = await Feeding.findAll({
      where: { childId },
      order: [["date", "DESC"]],
    });

    console.log(
      `Found ${feedings.length} total feedings for child ID: ${childId}`
    );

    return res.status(200).json({
      success: true,
      count: feedings.length,
      data: feedings,
    });
  } catch (error) {
    console.error("Error getting feeding records:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getTodayFeedings = async (req, res) => {
  try {
    const { childId } = req.params;

    console.log(`Getting today's feedings for child ID: ${childId}`);

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      console.log(`Child not found or does not belong to user: ${childId}`);
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const now = new Date();
    const romaniaTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Bucharest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const todayStr = romaniaTime;

    const { start, end } = getRomaniaDateRange(todayStr);

    console.log(`Fetching today's feedings for Romania date: ${todayStr}`);
    console.log(`Date range: ${start} to ${end}`);

    const feedings = await Feeding.findAll({
      where: {
        childId,
        date: {
          [Op.between]: [start, end],
        },
      },
      order: [["date", "DESC"]],
    });

    console.log(`Found ${feedings.length} feedings for today`);

    return res.status(200).json({
      success: true,
      count: feedings.length,
      data: feedings,
    });
  } catch (error) {
    console.error("Error getting today's feeding records:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getFeedingsByDate = async (req, res) => {
  try {
    const { childId, date } = req.params;

    console.log(`Getting feedings for child ID: ${childId} on date: ${date}`);

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const { start, end } = getRomaniaDateRange(date);

    console.log(`Searching for feedings between: ${start} and ${end}`);

    const feedings = await Feeding.findAll({
      where: {
        childId,
        date: {
          [Op.between]: [start, end],
        },
      },
      order: [["date", "DESC"]],
    });

    console.log(`Found ${feedings.length} feedings for date ${date}`);

    return res.status(200).json({
      success: true,
      count: feedings.length,
      data: feedings,
    });
  } catch (error) {
    console.error("Error getting feeding records by date:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getFeedingsByDateRange = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    console.log(
      `Getting feedings for child ID: ${childId} from ${startDate} to ${endDate}`
    );

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const { start: startOfRange } = getRomaniaDateRange(startDate);
    const { end: endOfRange } = getRomaniaDateRange(endDate);

    console.log(
      `Searching for feedings between: ${startOfRange} and ${endOfRange}`
    );

    const feedings = await Feeding.findAll({
      where: {
        childId,
        date: {
          [Op.between]: [startOfRange, endOfRange],
        },
      },
      order: [["date", "DESC"]],
    });

    console.log(`Found ${feedings.length} feedings in date range`);

    return res.status(200).json({
      success: true,
      count: feedings.length,
      data: feedings,
    });
  } catch (error) {
    console.error("Error getting feeding records by date range:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getFeedingSummary = async (req, res) => {
  try {
    const { childId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const { start, end } = getRomaniaDateRange(date);

    const feedings = await Feeding.findAll({
      where: {
        childId,
        date: {
          [Op.between]: [start, end],
        },
      },
    });

    const breastFeedings = feedings.filter((f) => f.type === "breast");
    const bottleFeedings = feedings.filter((f) => f.type === "bottle");
    const solidFeedings = feedings.filter((f) => f.type === "solid");

    const summary = {
      date: date,
      breastFeedings: {
        count: breastFeedings.length,
        totalMinutes: breastFeedings.reduce(
          (total, f) => total + (f.duration || 0),
          0
        ),
        leftSide: breastFeedings.filter((f) => f.side === "left").length,
        rightSide: breastFeedings.filter((f) => f.side === "right").length,
      },
      bottleFeedings: {
        count: bottleFeedings.length,
        totalMl: bottleFeedings.reduce(
          (total, f) => total + (f.amount || 0),
          0
        ),
      },
      solidFeedings: {
        count: solidFeedings.length,
        totalGrams: solidFeedings.reduce(
          (total, f) => total + (f.amount || 0),
          0
        ),
      },
    };

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error getting feeding summary:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateFeeding = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, startTime, endTime, duration, side, amount, note } = req.body;

    const feeding = await Feeding.findOne({
      where: { id },
      include: [
        {
          model: Child,
          where: { userId: req.user.id },
        },
      ],
    });

    if (!feeding) {
      return res.status(404).json({
        success: false,
        message: "Feeding record not found or does not belong to user",
      });
    }

    if (type) {
      feeding.type = type;
      if (type === "breast") {
        feeding.amount = 0;
      } else {
        feeding.startTime = null;
        feeding.endTime = null;
        feeding.duration = 0;
        feeding.side = null;
      }
    }

    if (feeding.type === "breast") {
      if (startTime) feeding.startTime = startTime;
      if (endTime) feeding.endTime = endTime;
      if (duration !== undefined) feeding.duration = duration;
      if (side) feeding.side = side;
    } else {
      if (amount !== undefined) feeding.amount = amount;
    }

    if (note !== undefined) feeding.note = note;

    const romaniaDateTime = getRomaniaDateTimeIntl();
    feeding.date = romaniaDateTime;
    feeding.timestamp = romaniaDateTime;

    await feeding.save();

    return res.status(200).json({
      success: true,
      data: feeding,
      message: "Feeding record updated successfully",
    });
  } catch (error) {
    console.error("Error updating feeding record:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteFeeding = async (req, res) => {
  try {
    const { id } = req.params;

    const feeding = await Feeding.findByPk(id);

    if (!feeding) {
      return res.status(404).json({
        success: false,
        message: "Feeding record not found",
      });
    }

    const child = await Child.findOne({
      where: {
        id: feeding.childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    await feeding.destroy();

    return res.status(200).json({
      success: true,
      message: "Feeding record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feeding record:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getWeeklyFeedings = async (req, res) => {
  try {
    const { childId } = req.params;

    console.log(`Getting weekly feeding data for child ID: ${childId}`);

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const startDateStr =
      new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Bucharest",
      }).format(startDate) + " 00:00:00";

    const endDateStr =
      new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Bucharest",
      }).format(endDate) + " 23:59:59";

    console.log(
      `Searching for weekly feedings between: ${startDateStr} and ${endDateStr}`
    );

    const feedings = await Feeding.findAll({
      where: {
        childId,
        date: {
          [Op.between]: [startDateStr, endDateStr],
        },
      },
      order: [["date", "ASC"]],
    });

    console.log(`Found ${feedings.length} feeding records for weekly data`);

    const aggregatedData = {};

    feedings.forEach((feeding) => {
      try {
        const dateKey = extractDateKey(feeding);

        if (!dateKey) {
          console.warn(
            "Skipping feeding record with invalid date:",
            feeding.id
          );
          return;
        }

        if (!aggregatedData[dateKey]) {
          aggregatedData[dateKey] = {
            date: dateKey,
            breastFeedings: {
              count: 0,
              totalMinutes: 0,
              leftSide: 0,
              rightSide: 0,
            },
            bottleFeedings: {
              count: 0,
              totalMl: 0,
            },
            solidFeedings: {
              count: 0,
              totalGrams: 0,
            },
            totalFeedings: 0,
          };
        }

        aggregatedData[dateKey].totalFeedings++;

        if (feeding.type === "breast") {
          aggregatedData[dateKey].breastFeedings.count++;
          aggregatedData[dateKey].breastFeedings.totalMinutes +=
            Number(feeding.duration) || 0;
          if (feeding.side === "left") {
            aggregatedData[dateKey].breastFeedings.leftSide++;
          } else if (feeding.side === "right") {
            aggregatedData[dateKey].breastFeedings.rightSide++;
          }
        } else if (feeding.type === "bottle") {
          aggregatedData[dateKey].bottleFeedings.count++;
          aggregatedData[dateKey].bottleFeedings.totalMl +=
            Number(feeding.amount) || 0;
        } else if (feeding.type === "solid") {
          aggregatedData[dateKey].solidFeedings.count++;
          aggregatedData[dateKey].solidFeedings.totalGrams +=
            Number(feeding.amount) || 0;
        }
      } catch (error) {
        console.error("Error processing feeding record:", error, feeding);
      }
    });

    const aggregatedArray = Object.values(aggregatedData).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    console.log(`Aggregated weekly data into ${aggregatedArray.length} days`);

    return res.status(200).json({
      success: true,
      count: aggregatedArray.length,
      totalRecords: feedings.length,
      data: aggregatedArray,
    });
  } catch (error) {
    console.error("Error getting weekly feeding data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getMonthlyFeedings = async (req, res) => {
  try {
    const { childId } = req.params;
    const { month } = req.query;

    console.log(
      `Getting monthly feeding data for child ID: ${childId}, month: ${month}`
    );

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month parameter is required (format: YYYY-MM)",
      });
    }

    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM (e.g., 2025-06)",
      });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found or does not belong to user",
      });
    }

    const [year, monthNum] = month.split("-");
    const startDate = `${year}-${monthNum}-01 00:00:00`;

    const lastDay = new Date(
      Number.parseInt(year),
      Number.parseInt(monthNum),
      0
    ).getDate();
    const endDate = `${year}-${monthNum}-${lastDay
      .toString()
      .padStart(2, "0")} 23:59:59`;

    console.log(
      `Searching for monthly feedings between: ${startDate} and ${endDate}`
    );

    const feedings = await Feeding.findAll({
      where: {
        childId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });

    console.log(`Found ${feedings.length} feeding records for month ${month}`);

    const aggregatedData = {};

    feedings.forEach((feeding) => {
      try {
        const dateKey = extractDateKey(feeding);

        if (!dateKey) {
          console.warn(
            "Skipping feeding record with invalid date:",
            feeding.id
          );
          return;
        }

        if (!aggregatedData[dateKey]) {
          aggregatedData[dateKey] = {
            date: dateKey,
            breastFeedings: {
              count: 0,
              totalMinutes: 0,
              leftSide: 0,
              rightSide: 0,
            },
            bottleFeedings: {
              count: 0,
              totalMl: 0,
            },
            solidFeedings: {
              count: 0,
              totalGrams: 0,
            },
            totalFeedings: 0,
          };
        }

        aggregatedData[dateKey].totalFeedings++;

        if (feeding.type === "breast") {
          aggregatedData[dateKey].breastFeedings.count++;
          aggregatedData[dateKey].breastFeedings.totalMinutes +=
            Number(feeding.duration) || 0;
          if (feeding.side === "left") {
            aggregatedData[dateKey].breastFeedings.leftSide++;
          } else if (feeding.side === "right") {
            aggregatedData[dateKey].breastFeedings.rightSide++;
          }
        } else if (feeding.type === "bottle") {
          aggregatedData[dateKey].bottleFeedings.count++;
          aggregatedData[dateKey].bottleFeedings.totalMl +=
            Number(feeding.amount) || 0;
        } else if (feeding.type === "solid") {
          aggregatedData[dateKey].solidFeedings.count++;
          aggregatedData[dateKey].solidFeedings.totalGrams +=
            Number(feeding.amount) || 0;
        }
      } catch (error) {
        console.error("Error processing feeding record:", error, feeding);
      }
    });

    const aggregatedArray = Object.values(aggregatedData).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    console.log(`Aggregated monthly data into ${aggregatedArray.length} days`);

    return res.status(200).json({
      success: true,
      count: aggregatedArray.length,
      totalRecords: feedings.length,
      month: month,
      data: aggregatedArray,
    });
  } catch (error) {
    console.error("Error getting monthly feeding data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};
