import Growth from "../models/Growth.js";
import Child from "../models/Child.js";

export const createGrowthRecord = async (req, res) => {
  try {
    const {
      childId,
      weight,
      height,
      headCircumference,
      weightProgress,
      heightProgress,
      headCircumferenceProgress,
      recordDate,
      notes,
      isInitialRecord,
    } = req.body;

    if (!childId || !weight || !height || !headCircumference) {
      return res.status(400).json({
        message:
          "Child ID, weight, height, and head circumference are required",
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
        message: "Child not found or you don't have access",
      });
    }

    const growthRecord = await Growth.create({
      childId,
      weight,
      height,
      headCircumference,
      weightProgress: weightProgress || 0,
      heightProgress: heightProgress || 0,
      headCircumferenceProgress: headCircumferenceProgress || 0,
      recordDate: recordDate || new Date(),
      notes,
      isInitialRecord: isInitialRecord || false,
    });

    console.log("Created growth record with progress values:", {
      weightProgress,
      heightProgress,
      headCircumferenceProgress,
    });

    return res.status(201).json(growthRecord);
  } catch (error) {
    console.error("Error creating growth record:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateGrowthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      weight,
      height,
      headCircumference,
      weightProgress,
      heightProgress,
      headCircumferenceProgress,
      recordDate,
      notes,
    } = req.body;

    const growthRecord = await Growth.findByPk(id);

    if (!growthRecord) {
      return res.status(404).json({ message: "Growth record not found" });
    }

    const child = await Child.findOne({
      where: {
        id: growthRecord.childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res.status(403).json({
        message: "You don't have permission to update this record",
      });
    }

    await growthRecord.update({
      weight: weight || growthRecord.weight,
      height: height || growthRecord.height,
      headCircumference: headCircumference || growthRecord.headCircumference,
      weightProgress:
        weightProgress !== undefined
          ? weightProgress
          : growthRecord.weightProgress,
      heightProgress:
        heightProgress !== undefined
          ? heightProgress
          : growthRecord.heightProgress,
      headCircumferenceProgress:
        headCircumferenceProgress !== undefined
          ? headCircumferenceProgress
          : growthRecord.headCircumferenceProgress,
      recordDate: recordDate || growthRecord.recordDate,
      notes: notes !== undefined ? notes : growthRecord.notes,
    });

    console.log("Updated growth record with progress values:", {
      weightProgress,
      heightProgress,
      headCircumferenceProgress,
    });

    return res.status(200).json(growthRecord);
  } catch (error) {
    console.error("Error updating growth record:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getGrowthRecords = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({ message: "Child ID is required" });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or you don't have access" });
    }

    const growthRecords = await Growth.findAll({
      where: { childId },
      order: [["recordDate", "DESC"]],
    });

    return res.status(200).json(growthRecords);
  } catch (error) {
    console.error("Error fetching growth records:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getLatestGrowthRecord = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({ message: "Child ID is required" });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or you don't have access" });
    }

    const latestRecord = await Growth.findOne({
      where: { childId },
      order: [["recordDate", "DESC"]],
    });

    if (!latestRecord) {
      return res
        .status(404)
        .json({ message: "No growth records found for this child" });
    }

    return res.status(200).json(latestRecord);
  } catch (error) {
    console.error("Error fetching latest growth record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getPreviousGrowthRecord = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({ message: "Child ID is required" });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or you don't have access" });
    }

    const records = await Growth.findAll({
      where: { childId },
      order: [["recordDate", "DESC"]],
      limit: 2,
    });

    if (records.length < 2) {
      return res
        .status(404)
        .json({ message: "No previous growth record found" });
    }

    return res.status(200).json(records[1]);
  } catch (error) {
    console.error("Error fetching previous growth record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deleteGrowthRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const growthRecord = await Growth.findByPk(id);

    if (!growthRecord) {
      return res.status(404).json({ message: "Growth record not found" });
    }

    const child = await Child.findOne({
      where: {
        id: growthRecord.childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(403)
        .json({ message: "You don't have permission to delete this record" });
    }

    if (growthRecord.isInitialRecord) {
      return res.status(403).json({
        message: "Initial growth records cannot be deleted",
      });
    }

    await growthRecord.destroy();

    return res
      .status(200)
      .json({ message: "Growth record deleted successfully" });
  } catch (error) {
    console.error("Error deleting growth record:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getGrowthStatistics = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!childId) {
      return res.status(400).json({ message: "Child ID is required" });
    }

    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or you don't have access" });
    }

    const growthRecords = await Growth.findAll({
      where: { childId },
      order: [["recordDate", "ASC"]],
    });

    if (growthRecords.length === 0) {
      return res
        .status(404)
        .json({ message: "No growth records found for this child" });
    }

    const statistics = {
      weightData: growthRecords.map((record) => ({
        date: record.recordDate,
        value: record.weight,
        progress: record.weightProgress || 0,
      })),
      heightData: growthRecords.map((record) => ({
        date: record.recordDate,
        value: record.height,
        progress: record.heightProgress || 0,
      })),
      headCircumferenceData: growthRecords.map((record) => ({
        date: record.recordDate,
        value: record.headCircumference,
        progress: record.headCircumferenceProgress || 0,
      })),
      totalRecords: growthRecords.length,
      firstRecord: growthRecords[0],
      latestRecord: growthRecords[growthRecords.length - 1],
      weightGain:
        growthRecords.length > 1
          ? growthRecords[growthRecords.length - 1].weight -
            growthRecords[0].weight
          : 0,
      heightGain:
        growthRecords.length > 1
          ? growthRecords[growthRecords.length - 1].height -
            growthRecords[0].height
          : 0,
      headCircumferenceGain:
        growthRecords.length > 1
          ? growthRecords[growthRecords.length - 1].headCircumference -
            growthRecords[0].headCircumference
          : 0,
    };

    return res.status(200).json(statistics);
  } catch (error) {
    console.error("Error fetching growth statistics:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const checkIfSunday = async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();

    return res.status(200).json({
      isSunday: true,
      currentDay: dayOfWeek,
      dayName: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][dayOfWeek],
      nextSunday: getNextSunday(),
    });
  } catch (error) {
    console.error("Error checking if today is Sunday:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

function getNextSunday() {
  const today = new Date();
  const dayOfWeek = today.getDay();

  if (dayOfWeek === 0) {
    return today;
  }

  const daysUntilSunday = 7 - dayOfWeek;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);

  return nextSunday;
}
