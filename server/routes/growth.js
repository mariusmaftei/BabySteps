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
growthRoute.use(protect);

growthRoute.get("/child/:childId", getGrowthRecords);

growthRoute.get("/child/:childId/latest", getLatestGrowthRecord);

growthRoute.get("/child/:childId/previous", getPreviousGrowthRecord);

growthRoute.get("/child/:childId/statistics", getGrowthStatistics);

growthRoute.post("/", createGrowthRecord);

growthRoute.put("/:id", updateGrowthRecord);

growthRoute.delete("/:id", deleteGrowthRecord);

growthRoute.get("/check-sunday", checkIfSunday);

export default growthRoute;
