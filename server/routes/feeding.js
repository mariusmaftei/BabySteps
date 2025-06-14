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

feedingRoute.use(protect);

feedingRoute.post("/", createFeeding);

feedingRoute.get("/child/:childId/weekly", getWeeklyFeedings);

feedingRoute.get("/child/:childId/monthly", getMonthlyFeedings);

feedingRoute.get("/child/:childId", getFeedingsByChildId);

feedingRoute.get("/child/:childId/today", getTodayFeedings);

feedingRoute.get("/child/:childId/date/:date", getFeedingsByDate);

feedingRoute.get("/child/:childId/date-range", getFeedingsByDateRange);

feedingRoute.get("/child/:childId/summary", getFeedingSummary);

feedingRoute.put("/:id", updateFeeding);

feedingRoute.delete("/:id", deleteFeeding);

export default feedingRoute;
