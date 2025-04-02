import Feeding from "../models/Feeding.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

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

    // Create feeding record with explicit defaults for non-relevant fields
    const feedingData = {
      childId,
      type,
      // Set defaults based on feeding type
      startTime: type === "breast" ? startTime : null,
      endTime: type === "breast" ? endTime : null,
      duration: type === "breast" ? duration : 0,
      side: type === "breast" ? side : null,
      amount: type === "bottle" || type === "solid" ? amount : 0,
      note: note || null,
      timestamp: new Date(),
    };

    const feeding = await Feeding.create(feedingData);

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

    // Get feeding records
    const feedings = await Feeding.findAll({
      where: { childId },
      order: [["timestamp", "DESC"]],
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

// Get today's feeding records for a child
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

    // Calculate start and end of today
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(
      `Searching for feedings between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`
    );

    // Get feeding records for today
    const feedings = await Feeding.findAll({
      where: {
        childId,
        timestamp: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      order: [["timestamp", "DESC"]],
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

    // Get feeding records within date range
    const feedings = await Feeding.findAll({
      where: {
        childId,
        timestamp: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
      order: [["timestamp", "DESC"]],
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

// Get a specific feeding record
export const getFeedingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the feeding record and check if it belongs to a child of the user
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

    return res.status(200).json({
      success: true,
      data: feeding,
    });
  } catch (error) {
    console.error("Error getting feeding record:", error);
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

    // Calculate start and end of the requested date
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    // Get feeding records for the day
    const feedings = await Feeding.findAll({
      where: {
        childId,
        timestamp: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    // Calculate summary
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

    // Find the feeding record and check if it belongs to a child of the user
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

      // Reset fields not relevant to the new type
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

    // Update common fields
    if (note !== undefined) feeding.note = note;

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

    // Find the feeding record first
    const feeding = await Feeding.findByPk(id);

    if (!feeding) {
      return res.status(404).json({
        success: false,
        message: "Feeding record not found",
      });
    }

    // Then check if the child belongs to the user
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

    // If both checks pass, delete the feeding record
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
