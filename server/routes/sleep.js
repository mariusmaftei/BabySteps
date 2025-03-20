import express from "express";
import {
  createSleep,
  getSleepByChild,
  getSleepById,
  updateSleep,
  deleteSleep,
  getSleepByDateRange,
  getTodaySleep,
  getCurrentSleepData,
  autoFillSleepRecords,
} from "../controllers/SleepController.js";
import { protect } from "../middleware/auth.js";

const sleepRoute = express.Router();

// Apply auth middleware to all routes
sleepRoute.use(protect);

// Create a new sleep record
sleepRoute.post("/", createSleep);

// Get all sleep records for a child
sleepRoute.get("/child/:childId", getSleepByChild);

// Get sleep records for a child within a date range
sleepRoute.get("/child/:childId/range", getSleepByDateRange);

// Get today's sleep record for a child
sleepRoute.get("/child/:childId/today", getTodaySleep);

// Get current sleep data (yesterday before noon, today after noon)
sleepRoute.get("/child/:childId/current", getCurrentSleepData);

// Get a specific sleep record
sleepRoute.get("/:id", getSleepById);

// Update a sleep record
sleepRoute.put("/:id", updateSleep);

// Delete a sleep record
sleepRoute.delete("/:id", deleteSleep);

// Auto-fill missing sleep records (for cron job)
sleepRoute.post("/auto-fill", autoFillSleepRecords);

export default sleepRoute;
