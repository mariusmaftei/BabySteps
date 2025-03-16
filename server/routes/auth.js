import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getCurrentUser,
  login,
  register,
  updateUserProfile,
} from "../controllers/auth.js";

const authRoute = express.Router();

// Public routes
authRoute.post("/register", register);
authRoute.post("/login", login);

// Protected routes
authRoute.get("/me", protect, getCurrentUser);
authRoute.put("/update", protect, updateUserProfile);

export default authRoute;
