import express from "express";
import {
  createSleep,
  updateSleep,
  getSleepByChild,
  getTodaySleep,
} from "../controllers/SleepController.js";

const sleepRoute = express.Router();

// Apply auth middleware to all routes

// Create a new sleep record
sleepRoute.post("/", createSleep);

// Get all sleep records for a child
sleepRoute.get("/child/:childId", getSleepByChild);

// Get sleep records for a child within a date range

// Get today's sleep record for a child
sleepRoute.get("/child/:childId/today", getTodaySleep);

// Get a specific sleep record

// Update a sleep record
sleepRoute.put("/:id", updateSleep);

// Delete a sleep record

export default sleepRoute;
