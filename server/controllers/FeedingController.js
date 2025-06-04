import Feeding from "../models/Feeding.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

// Helper function to get current Romanian datetime
const getRomaniaDateTime = () => {
  const now = new Date();
  const romaniaOffset = 3 * 60 * 60 * 1000; // UTC+3 for Romania (EEST)
  const romaniaTime = new Date(
    now.getTime() + now.getTimezoneOffset() * 60 * 1000 + romaniaOffset
  );

  const year = romaniaTime.getFullYear();
  const month = String(romaniaTime.getMonth() + 1).padStart(2, "0");
  const day = String(romaniaTime.getDate()).padStart(2, "0");
  const hours = String(romaniaTime.getHours()).padStart(2, "0");
  const minutes = String(romaniaTime.getMinutes()).padStart(2, "0");
  const seconds = String(romaniaTime.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Helper function to get Romania date range for a specific date
const getRomaniaDateRange = (dateStr) => {
  // If dateStr is just a date (YYYY-MM-DD), create full day range
  if (dateStr.length === 10) {
    return {
      start: `${dateStr} 00:00:00`,
      end: `${dateStr} 23:59:59`,
    };
  }

  // If it's already a datetime, extract the date part and create range
  const datePart = dateStr.split(" ")[0];
  return {
    start: `${datePart} 00:00:00`,
    end: `${datePart} 23:59:59`,
  };
};

// Create a new feeding record
export const createFeeding = async (req, res) => {
  try {
    const { childId, type, startTime, endTime, duration, side, amount, note } =
      req.body;

    // Validate required fields based on feeding type
    if (!childId || !type) {
      return res.status(400).json({
        success: false,
        message: "Child ID and feeding type are required",
      });
    }

    // Type-specific validation
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

    // Check if child exists and belongs to user
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

    // Use Romania datetime
    const romaniaDateTime = getRomaniaDateTime();

    // Create feeding record with Romania datetime
    const feedingData = {
      childId,
      type,
      startTime: type === "breast" ? startTime : null,
      endTime: type === "breast" ? endTime : null,
      duration: type === "breast" ? duration : 0,
      side: type === "breast" ? side : null,
      amount: type === "bottle" || type === "solid" ? amount : 0,
      note: note || null,
      timestamp: romaniaDateTime,
      date: romaniaDateTime, // Store Romania datetime
    };

    const feeding = await Feeding.create(feedingData);

    console.log(
      `Created feeding record with Romania datetime: ${romaniaDateTime}`
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

// Get all feeding records for a child
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

// Get today's feeding records for a child (Romania timezone)
export const getTodayFeedings = async (req, res) => {
  try {
    const { childId } = req.params;

    console.log(`Getting today's feedings for child ID: ${childId}`);

    // Check if child exists and belongs to user
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

    // Get today's date in Romania timezone
    const now = new Date();
    const romaniaOffset = 3 * 60 * 60 * 1000;
    const romaniaTime = new Date(
      now.getTime() + now.getTimezoneOffset() * 60 * 1000 + romaniaOffset
    );

    const year = romaniaTime.getFullYear();
    const month = String(romaniaTime.getMonth() + 1).padStart(2, "0");
    const day = String(romaniaTime.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

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

// Get feeding records for a child by specific date
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

// Get feeding records for a child by date range
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

// Get feeding summary for a child (daily totals)
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

// Update a feeding record
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

    // Update fields based on feeding type
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

    // Update type-specific fields
    if (feeding.type === "breast") {
      if (startTime) feeding.startTime = startTime;
      if (endTime) feeding.endTime = endTime;
      if (duration !== undefined) feeding.duration = duration;
      if (side) feeding.side = side;
    } else {
      if (amount !== undefined) feeding.amount = amount;
    }

    if (note !== undefined) feeding.note = note;

    // Update with Romania datetime
    feeding.date = getRomaniaDateTime();

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

// Delete a feeding record
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
