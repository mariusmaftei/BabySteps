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

vaccinationRoute.use(protect);

vaccinationRoute.get("/child/:childId", getVaccinationsForChild);

vaccinationRoute.post("/child/:childId", createVaccination);

vaccinationRoute.post("/child/:childId/bulk", createMultipleVaccinations);

vaccinationRoute.put(
  "/child/:childId/vaccination/:vaccinationId",
  updateVaccination
);

vaccinationRoute.put(
  "/child/:childId/vaccine/:vaccineId",
  updateVaccinationByVaccineId
);

vaccinationRoute.delete(
  "/child/:childId/vaccination/:vaccinationId",
  deleteVaccination
);

vaccinationRoute.get("/child/:childId/due", getDueVaccinations);

vaccinationRoute.get("/child/:childId/overdue", getOverdueVaccinations);

vaccinationRoute.get("/child/:childId/progress", getVaccinationProgress);

export default vaccinationRoute;
