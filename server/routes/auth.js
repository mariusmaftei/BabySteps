import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getCurrentUser,
  login,
  register,
  updateUserProfile,
} from "../controllers/auth.js";

const authRoute = express.Router();

// Public routes (accessible without authentication)
authRoute.post("/register", register);
authRoute.post("/login", login);

// Apply authentication middleware to all routes below
authRoute.use(protect);

// Protected routes (require authentication)
authRoute.get("/me", getCurrentUser);
authRoute.put("/update", updateUserProfile);

export default authRoute;
