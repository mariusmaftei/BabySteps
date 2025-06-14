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

childRoute.use(protect);

childRoute.get("/", getUserChildren);

childRoute.get("/:id", getChildById);

childRoute.post("/", createChild);

childRoute.put("/:id", updateChild);

childRoute.delete("/:id", deleteChild);

export default childRoute;
