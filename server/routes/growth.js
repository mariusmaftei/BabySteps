import express from "express";
import {
  checkIfSunday,
  createGrowthRecord,
  deleteGrowthRecord,
  getGrowthRecords,
  getGrowthStatistics,
  getLatestGrowthRecord,
  getPreviousGrowthRecord,
  updateGrowthRecord,
} from "../controllers/GrowthController.js";
import { protect } from "../middleware/auth.js";

const growthRoute = express.Router();
// Apply authentication middleware to all routes
growthRoute.use(protect);

// Get all growth records for a specific child
growthRoute.get("/child/:childId", getGrowthRecords);

// Get the latest growth record for a specific child
growthRoute.get("/child/:childId/latest", getLatestGrowthRecord);

// Get the previous growth record for a specific child
growthRoute.get("/child/:childId/previous", getPreviousGrowthRecord);

// Get growth statistics for a specific child
growthRoute.get("/child/:childId/statistics", getGrowthStatistics);

// Create a new growth record
growthRoute.post("/", createGrowthRecord);

// Update a growth record
growthRoute.put("/:id", updateGrowthRecord);

// Delete a growth record
growthRoute.delete("/:id", deleteGrowthRecord);

// Check if today is Sunday (for client validation)
growthRoute.get("/check-sunday", checkIfSunday);

export default growthRoute;
