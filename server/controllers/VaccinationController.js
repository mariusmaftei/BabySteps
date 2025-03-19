import Vaccination from "../models/Vaccination.js";
import Child from "../models/Child.js";
import { Op } from "sequelize";

// Get all vaccinations for a child
export const getVaccinationsForChild = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    const vaccinations = await Vaccination.findAll({
      where: { childId },
      order: [["scheduledDate", "ASC"]],
    });

    return res.status(200).json(vaccinations);
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new vaccination record
export const createVaccination = async (req, res) => {
  try {
    const { childId } = req.params;
    const {
      vaccineId,
      vaccineName,
      dose,
      scheduledDate,
      ageMonths,
      ageDays,
      notes,
    } = req.body;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Check if this vaccination already exists for this child
    const existingVaccination = await Vaccination.findOne({
      where: {
        childId,
        vaccineId,
      },
    });

    if (existingVaccination) {
      return res.status(400).json({
        message: "This vaccination record already exists for this child",
      });
    }

    const vaccination = await Vaccination.create({
      childId,
      vaccineId,
      vaccineName,
      dose,
      scheduledDate,
      ageMonths,
      ageDays,
      notes,
      isCompleted: false,
    });

    return res.status(201).json(vaccination);
  } catch (error) {
    console.error("Error creating vaccination:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create multiple vaccination records at once (for initial setup)
export const createMultipleVaccinations = async (req, res) => {
  try {
    const { childId } = req.params;
    const { vaccinations } = req.body;

    if (!Array.isArray(vaccinations) || vaccinations.length === 0) {
      return res.status(400).json({ message: "Invalid vaccinations data" });
    }

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Prepare vaccination records with childId
    const vaccinationRecords = vaccinations.map((vaccination) => ({
      ...vaccination,
      childId,
    }));

    // Create all vaccination records
    const createdVaccinations = await Vaccination.bulkCreate(
      vaccinationRecords
    );

    return res.status(201).json(createdVaccinations);
  } catch (error) {
    console.error("Error creating multiple vaccinations:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a vaccination record (mark as completed)
export const updateVaccination = async (req, res) => {
  try {
    const { childId, vaccinationId } = req.params;
    const { isCompleted, completedDate, completionNotes } = req.body;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Find the vaccination
    const vaccination = await Vaccination.findOne({
      where: {
        id: vaccinationId,
        childId,
      },
    });

    if (!vaccination) {
      return res.status(404).json({ message: "Vaccination record not found" });
    }

    // Update the vaccination
    vaccination.isCompleted = isCompleted ?? vaccination.isCompleted;

    if (isCompleted) {
      vaccination.completedDate = completedDate || new Date();
      vaccination.completionNotes =
        completionNotes || vaccination.completionNotes;
    } else {
      vaccination.completedDate = null;
      vaccination.completionNotes = null;
    }

    await vaccination.save();

    return res.status(200).json(vaccination);
  } catch (error) {
    console.error("Error updating vaccination:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a vaccination by vaccineId (for the mobile app)
export const updateVaccinationByVaccineId = async (req, res) => {
  try {
    const { childId } = req.params;
    const { vaccineId } = req.params;
    const { isCompleted, completedDate, completionNotes } = req.body;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Find the vaccination
    const vaccination = await Vaccination.findOne({
      where: {
        vaccineId,
        childId,
      },
    });

    if (!vaccination) {
      return res.status(404).json({ message: "Vaccination record not found" });
    }

    // Update the vaccination
    vaccination.isCompleted = isCompleted ?? vaccination.isCompleted;

    if (isCompleted) {
      vaccination.completedDate = completedDate || new Date();
      vaccination.completionNotes =
        completionNotes || vaccination.completionNotes;
    } else {
      vaccination.completedDate = null;
      vaccination.completionNotes = null;
    }

    await vaccination.save();

    return res.status(200).json(vaccination);
  } catch (error) {
    console.error("Error updating vaccination:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a vaccination record
export const deleteVaccination = async (req, res) => {
  try {
    const { childId, vaccinationId } = req.params;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Find and delete the vaccination
    const vaccination = await Vaccination.findOne({
      where: {
        id: vaccinationId,
        childId,
      },
    });

    if (!vaccination) {
      return res.status(404).json({ message: "Vaccination record not found" });
    }

    await vaccination.destroy();

    return res
      .status(200)
      .json({ message: "Vaccination record deleted successfully" });
  } catch (error) {
    console.error("Error deleting vaccination:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get due vaccinations for a child
export const getDueVaccinations = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Get current date
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Find vaccinations due this month and not completed
    const dueVaccinations = await Vaccination.findAll({
      where: {
        childId,
        scheduledDate: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        isCompleted: false,
      },
      order: [["scheduledDate", "ASC"]],
    });

    return res.status(200).json(dueVaccinations);
  } catch (error) {
    console.error("Error fetching due vaccinations:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get overdue vaccinations for a child
export const getOverdueVaccinations = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Get current date
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Find vaccinations due before this month and not completed
    const overdueVaccinations = await Vaccination.findAll({
      where: {
        childId,
        scheduledDate: {
          [Op.lt]: startOfMonth,
        },
        isCompleted: false,
      },
      order: [["scheduledDate", "ASC"]],
    });

    return res.status(200).json(overdueVaccinations);
  } catch (error) {
    console.error("Error fetching overdue vaccinations:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get vaccination progress for a child
export const getVaccinationProgress = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify child exists and belongs to the authenticated user
    const child = await Child.findOne({
      where: {
        id: childId,
        userId: req.user.id,
      },
    });

    if (!child) {
      return res
        .status(404)
        .json({ message: "Child not found or not authorized" });
    }

    // Count total and completed vaccinations
    const totalCount = await Vaccination.count({
      where: { childId },
    });

    const completedCount = await Vaccination.count({
      where: {
        childId,
        isCompleted: true,
      },
    });

    // Calculate percentage
    const percentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return res.status(200).json({
      total: totalCount,
      completed: completedCount,
      percentage,
    });
  } catch (error) {
    console.error("Error fetching vaccination progress:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
