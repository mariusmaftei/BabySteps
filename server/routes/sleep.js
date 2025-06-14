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

sleepRoute.use(protect);

sleepRoute.post("/", createSleep);

sleepRoute.put("/:id", updateSleep);

sleepRoute.get("/child/:childId", getSleepByChild);

sleepRoute.get("/child/:childId/range", getSleepByDateRange);

sleepRoute.get("/child/:childId/today", getTodaySleep);

sleepRoute.get("/child/:childId/current", getCurrentSleepData);

sleepRoute.get("/child/:childId/weekly", getWeeklySleep);

sleepRoute.get("/child/:childId/monthly", getMonthlySleep);

sleepRoute.get("/:id", getSleepById);

sleepRoute.delete("/:id", deleteSleep);

sleepRoute.post("/auto-fill", autoFillSleepRecords);

export default sleepRoute;
