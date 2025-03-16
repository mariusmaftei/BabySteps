import express from "express";
import cors from "cors";
import sequelize from "./config/database.js";
import authRoute from "./routes/auth.js";
import setupAssociations from "./models/setupAssociations.js";
import childRoute from "./routes/child.js";
import sleepRoute from "./routes/sleep.js";

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

  <p>The server encountered an internal error or misconfiguration and was unable to complete your request.<p>
  <p>Please contact the server administrator at root@localhost to inform them of the time this error occurred, and the actions you performed just before this error.<p>
  <p>More information about this error may be available in the server error log.</p>`);
});

app.use("/auth", authRoute);
app.use("/children", childRoute); // Add the child routes
// Add this line after the app.use("/children", childRoute) line
app.use("/sleep", sleepRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Change this line to use alter: true to update the table structure
sequelize
  .sync({ alter: true }) // This will update existing tables to match the model
  .then(() => {
    app.listen(port, () => {
      console.log(`Server has started on port ${port}`);
      console.log("Connected to MYSQL");
      console.log("Database tables have been synchronized");
    });
  })
  .catch((err) => {
    console.log("Database sync error:", err);
  });
