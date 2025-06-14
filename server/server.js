import express from "express";
import cors from "cors";
import sequelize from "./config/database.js";
import authRoute from "./routes/auth.js";
import setupAssociations from "./models/setupAssociations.js";
import childRoute from "./routes/child.js";
import sleepRoute from "./routes/sleep.js";
import dotenv from "dotenv";
import mediaRouter from "./routes/media.js";
import { db } from "./config/firebase.js";
import vaccinationRoute from "./routes/vaccination.js";
import diaperRoute from "./routes/diaper.js";
import growthRoute from "./routes/growth.js";
import feedingRoute from "./routes/feeding.js";

dotenv.config();

const app = express();
const port = 8080;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

setupAssociations();

app.get("/", (req, res) => {
  res.send(`<h1>Internal Server Error</h1>
  <p>The server encountered an internal error or misconfiguration and was unable to complete your request.</p>
  <p>Please contact the server administrator at root@localhost to inform them of the time this error occurred, and the actions you performed just before this error.</p>
  <p>More information about this error may be available in the server error log.</p>`);
});

app.use("/auth", authRoute);
app.use("/children", childRoute);
app.use("/sleep", sleepRoute);
app.use("/diaper", diaperRoute);
app.use("/media", mediaRouter);
app.use("/vaccinations", vaccinationRoute);
app.use("/growth", growthRoute);
app.use("/feeding", feedingRoute);

db.listCollections()
  .then(() => console.log("Connected to Firebase Firestore"))
  .catch((err) => console.error("Error connecting to Firebase:", err));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

sequelize
  .sync({ alter: true })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log("Connected to MySQL");
      console.log("Database tables synchronized");
    });
  })
  .catch((err) => {
    console.error("Database sync error:", err);
  });
