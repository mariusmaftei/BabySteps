import express from "express";

import { protect } from "../middleware/auth.js";
import {
  createFeeding,
  deleteFeeding,
  getFeedingsByChildId,
  getFeedingsByDate,
  getFeedingsByDateRange,
  getFeedingSummary,
  getTodayFeedings,
  updateFeeding,
  getWeeklyFeedings,
  getMonthlyFeedings,
} from "../controllers/FeedingController.js";

const feedingRoute = express.Router();

// Apply auth middleware to all routes
feedingRoute.use(protect);

// Create a new feeding record
feedingRoute.post("/", createFeeding);

// Get weekly feeding records for a specific child
feedingRoute.get("/child/:childId/weekly", getWeeklyFeedings);

// Get monthly feeding records for a specific child
feedingRoute.get("/child/:childId/monthly", getMonthlyFeedings);

// Get all feeding records for a specific child
feedingRoute.get("/child/:childId", getFeedingsByChildId);

// Get today's feeding records for a specific child
feedingRoute.get("/child/:childId/today", getTodayFeedings);

feedingRoute.get("/child/:childId/date/:date", getFeedingsByDate);

// Get feeding records for a specific child within a date range
feedingRoute.get("/child/:childId/date-range", getFeedingsByDateRange);

// Get feeding summary for a specific child
feedingRoute.get("/child/:childId/summary", getFeedingSummary);

// Get a specific feeding record

// Update a feeding record
feedingRoute.put("/:id", updateFeeding);

// Delete a feeding record
feedingRoute.delete("/:id", deleteFeeding);

export default feedingRoute;
