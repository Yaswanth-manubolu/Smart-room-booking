import "dotenv/config"; // must be first so .env is loaded before other modules read process.env
import express from "express";
import cors from "cors";
import { initDatabase } from "./config/db.js";
import apiRoutes from "./routes/api.js";
import { verifyMailSetup, isMailConfigured } from "./services/mailer.js";

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date(), email: isMailConfigured() ? "smtp" : "console" });
});

// Initialize MySQL DB & Start Express Server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Smart Room Booking Express Server running on http://localhost:${PORT}`);
      verifyMailSetup();
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB connection error:", err.message);
    // Start Express anyway so fallback notice is served
    app.listen(PORT, () => {
      console.log(`⚠️ Express Server running on http://localhost:${PORT} (Database pending connection)`);
    });
  });
