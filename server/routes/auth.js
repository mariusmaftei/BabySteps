import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getCurrentUser,
  login,
  register,
  updateUserProfile,
} from "../controllers/auth.js";

const authRoute = express.Router();

authRoute.post("/register", register);
authRoute.post("/login", login);

authRoute.use(protect);

authRoute.get("/me", getCurrentUser);
authRoute.put("/update", updateUserProfile);

export default authRoute;
