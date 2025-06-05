import express from "express";
import {
  createSleep,
  getSleepByChild,
  getSleepById,
  updateSleep,
  deleteSleep,
  getSleepByDateRange,
  getWeeklySleep,
  getMonthlySleep,
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

// Update a sleep record
sleepRoute.put("/:id", updateSleep);

// Get all sleep records for a child
sleepRoute.get("/child/:childId", getSleepByChild);

// Get sleep records by date range
sleepRoute.get("/child/:childId/range", getSleepByDateRange);

// Get today's sleep record for a child
sleepRoute.get("/child/:childId/today", getTodaySleep);

// Get current sleep data (today or yesterday based on time of day)
sleepRoute.get("/child/:childId/current", getCurrentSleepData);

// Get weekly sleep data for a child (last 7 days)
sleepRoute.get("/child/:childId/weekly", getWeeklySleep);

// Get monthly sleep data for a child (specific month/year)
sleepRoute.get("/child/:childId/monthly", getMonthlySleep);

// Get a specific sleep record
sleepRoute.get("/:id", getSleepById);

// Delete a sleep record
sleepRoute.delete("/:id", deleteSleep);

// Auto-fill missing sleep records
sleepRoute.post("/auto-fill", autoFillSleepRecords);

export default sleepRoute;
