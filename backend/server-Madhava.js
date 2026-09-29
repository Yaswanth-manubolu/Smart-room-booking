import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/api.js";
import { initDatabase } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRouter);

// Root health
app.get("/", (req, res) => {
  res.json({
    message: "Smart Room Booking 3D Backend API is Running",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      rooms: "/api/rooms",
      bookings: "/api/bookings",
      auth: "/api/auth/login",
      analytics: "/api/analytics/stats"
    }
  });
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`?? Backend Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to initialize database:", err.message);
    app.listen(PORT, () => {
      console.log(`?? Backend Server running with DB fallback at http://localhost:${PORT}`);
    });
  }
}

startServer();
