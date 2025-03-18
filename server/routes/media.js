import express from "express";
import { getMusic } from "../controllers/mediaController.js";

const mediaRouter = express.Router();

mediaRouter.get("/music", getMusic);

export default mediaRouter;
