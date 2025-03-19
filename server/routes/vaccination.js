import express from "express";
import {
  getVaccinationsForChild,
  createVaccination,
  createMultipleVaccinations,
  updateVaccination,
  updateVaccinationByVaccineId,
  deleteVaccination,
  getDueVaccinations,
  getOverdueVaccinations,
  getVaccinationProgress,
} from "../controllers/VaccinationController.js";
import { protect } from "../middleware/auth.js";

const vaccinationRoute = express.Router();

// Apply authentication middleware to all routes below
vaccinationRoute.use(protect);

// Get all vaccinations for a child
vaccinationRoute.get("/child/:childId", getVaccinationsForChild);

// Create a new vaccination record
vaccinationRoute.post("/child/:childId", createVaccination);

// Create multiple vaccination records at once
vaccinationRoute.post("/child/:childId/bulk", createMultipleVaccinations);

// Update a vaccination record
vaccinationRoute.put(
  "/child/:childId/vaccination/:vaccinationId",
  updateVaccination
);

// Update a vaccination by vaccineId (for the mobile app)
vaccinationRoute.put(
  "/child/:childId/vaccine/:vaccineId",
  updateVaccinationByVaccineId
);

// Delete a vaccination record
vaccinationRoute.delete(
  "/child/:childId/vaccination/:vaccinationId",
  deleteVaccination
);

// Get due vaccinations for a child
vaccinationRoute.get("/child/:childId/due", getDueVaccinations);

// Get overdue vaccinations for a child
vaccinationRoute.get("/child/:childId/overdue", getOverdueVaccinations);

// Get vaccination progress for a child
vaccinationRoute.get("/child/:childId/progress", getVaccinationProgress);

export default vaccinationRoute;
