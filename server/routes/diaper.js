import express from "express";
import {
  getDiaperChanges,
  getDiaperChangeById,
  createDiaperChange,
  updateDiaperChange,
  deleteDiaperChange,
  getDiaperChangesByDateRange,
} from "../controllers/DiaperController.js";
import { protect } from "../middleware/auth.js";

const diaperRoute = express.Router();

diaperRoute.use(protect);

diaperRoute.get("/child/:childId", getDiaperChanges);

diaperRoute.get("/child/:childId/date-range", getDiaperChangesByDateRange);

diaperRoute.get("/child/:childId/:id", getDiaperChangeById);

diaperRoute.post("/child/:childId", createDiaperChange);

diaperRoute.put("/child/:childId/:id", updateDiaperChange);

diaperRoute.delete("/child/:childId/:id", deleteDiaperChange);

export default diaperRoute;
