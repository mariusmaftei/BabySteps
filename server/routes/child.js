import express from "express";
import {
  getUserChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild,
} from "../controllers/ChildController.js";
import { protect } from "../middleware/auth.js";

const childRoute = express.Router();

// All routes require authentication
childRoute.use(protect);

// Get all children for the authenticated user
childRoute.get("/", getUserChildren);

// Get a specific child by ID
childRoute.get("/:id", getChildById);

// Create a new child
childRoute.post("/", createChild);

// Update a child
childRoute.put("/:id", updateChild);

// Delete a child
childRoute.delete("/:id", deleteChild);

export default childRoute;
