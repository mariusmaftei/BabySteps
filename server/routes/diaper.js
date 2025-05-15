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

// All routes require authentication
diaperRoute.use(protect);

// Get all diaper changes for a specific child
diaperRoute.get("/child/:childId", getDiaperChanges);

// Get diaper changes by date range
diaperRoute.get("/child/:childId/date-range", getDiaperChangesByDateRange);

// Get a specific diaper change by ID
diaperRoute.get("/child/:childId/:id", getDiaperChangeById);

// Create a new diaper change
diaperRoute.post("/child/:childId", createDiaperChange);

// Update a diaper change
diaperRoute.put("/child/:childId/:id", updateDiaperChange);

// Delete a diaper change
diaperRoute.delete("/child/:childId/:id", deleteDiaperChange);

export default diaperRoute;
