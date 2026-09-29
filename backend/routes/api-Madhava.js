import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../config/db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "smart_room_3d_secret_key_2026";

// Auth Middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "Administrator") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Health Check
router.get("/health", async (req, res) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    res.json({ status: "healthy", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", error: error.message });
  }
});

// AUTHENTICATION ROUTES
router.post("/auth/register", async (req, res) => {
  try {
    const pool = getPool();
    const { name, email, password, department, phone, role } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "USR_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
    const userRole = role === "Administrator" ? "Administrator" : "Faculty";

    await pool.query(
      `INSERT INTO users (id, name, department, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, department, email.toLowerCase(), hashedPassword, phone || "", userRole]
    );

    const token = jwt.sign({ id: userId, email: email.toLowerCase(), role: userRole, name, department }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: userId, name, email: email.toLowerCase(), department, phone: phone || "", role: userRole }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Failed to register user", error: error.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const pool = getPool();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Failed to log in", error: error.message });
  }
});

router.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT id, name, department, email, phone, role, created_at FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
  }
});

router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT id, name, department, email, phone, role, created_at FROM users ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

// ROOM MANAGEMENT ROUTES
router.get("/rooms", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM rooms ORDER BY name ASC");
    
    const rooms = rows.map(room => ({
      ...room,
      facilities: typeof room.facilities === "string" ? JSON.parse(room.facilities || "[]") : (room.facilities || []),
      position: typeof room.position === "string" ? JSON.parse(room.position || "{}") : (room.position || { x: 0, y: 0, z: 0 }),
      dimensions: typeof room.dimensions === "string" ? JSON.parse(room.dimensions || "{}") : (room.dimensions || { width: 4, height: 2.5, depth: 4 })
    }));

    res.json(rooms);
  } catch (error) {
    console.error("Fetch Rooms Error:", error);
    res.status(500).json({ message: "Failed to fetch rooms", error: error.message });
  }
});

router.post("/rooms", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const { name, code, building, capacity, facilities, type, description, position, dimensions, color, floor } = req.body;

    const roomId = "ROOM_" + Date.now().toString(36).toUpperCase();
    const facilitiesJson = JSON.stringify(facilities || []);
    const positionJson = JSON.stringify(position || { x: 0, y: 0, z: 0 });
    const dimensionsJson = JSON.stringify(dimensions || { width: 4, height: 2.5, depth: 4 });

    await pool.query(
      `INSERT INTO rooms (id, name, code, building, capacity, facilities, status, type, description, position, dimensions, color, maintenance_reason, floor)
       VALUES (?, ?, ?, ?, ?, ?, 'Available', ?, ?, ?, ?, ?, '', ?)`,
      [
        roomId,
        name,
        code,
        building,
        Number(capacity) || 50,
        facilitiesJson,
        type || "Seminar Hall",
        description || "",
        positionJson,
        dimensionsJson,
        color || "#3b82f6",
        floor || "Ground Floor"
      ]
    );

    res.status(201).json({ message: "Room created successfully", roomId });
  } catch (error) {
    console.error("Create Room Error:", error);
    res.status(500).json({ message: "Failed to create room", error: error.message });
  }
});

router.put("/rooms/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { name, code, building, capacity, facilities, status, type, description, position, dimensions, color, maintenance_reason, floor } = req.body;

    const facilitiesJson = JSON.stringify(facilities || []);
    const positionJson = JSON.stringify(position || { x: 0, y: 0, z: 0 });
    const dimensionsJson = JSON.stringify(dimensions || { width: 4, height: 2.5, depth: 4 });

    await pool.query(
      `UPDATE rooms SET 
        name = ?, code = ?, building = ?, capacity = ?, facilities = ?, 
        status = ?, type = ?, description = ?, position = ?, dimensions = ?, 
        color = ?, maintenance_reason = ?, floor = ?
       WHERE id = ?`,
      [
        name,
        code,
        building,
        Number(capacity) || 50,
        facilitiesJson,
        status || "Available",
        type || "Seminar Hall",
        description || "",
        positionJson,
        dimensionsJson,
        color || "#3b82f6",
        maintenance_reason || "",
        floor || "Ground Floor",
        id
      ]
    );

    res.json({ message: "Room updated successfully" });
  } catch (error) {
    console.error("Update Room Error:", error);
    res.status(500).json({ message: "Failed to update room", error: error.message });
  }
});

router.patch("/rooms/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status, maintenance_reason } = req.body;

    await pool.query("UPDATE rooms SET status = ?, maintenance_reason = ? WHERE id = ?", [
      status,
      maintenance_reason || "",
      id
    ]);

    res.json({ message: "Room status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

router.delete("/rooms/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM rooms WHERE id = ?", [id]);
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete room", error: error.message });
  }
});

// BOOKINGS ROUTES
router.get("/bookings", async (req, res) => {
  try {
    const pool = getPool();
    const { room_id, date, status, user_id } = req.query;

    let query = "SELECT * FROM bookings WHERE 1=1";
    const params = [];

    if (room_id) {
      query += " AND room_id = ?";
      params.push(room_id);
    }
    if (date) {
      query += " AND date = ?";
      params.push(date);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (user_id) {
      query += " AND user_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY date ASC, start_time ASC";

    const [rows] = await pool.query(query, params);

    const bookings = rows.map(b => ({
      ...b,
      equipment: typeof b.equipment === "string" ? JSON.parse(b.equipment || "[]") : (b.equipment || [])
    }));

    res.json(bookings);
  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
});

router.post("/bookings", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const {
      room_id,
      room_name,
      faculty_name,
      department,
      event_name,
      date,
      start_time,
      end_time,
      participants,
      purpose,
      equipment
    } = req.body;

    if (!room_id || !date || !start_time || !end_time || !event_name) {
      return res.status(400).json({ message: "Missing required booking details" });
    }

    const [roomRows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [room_id]);
    if (roomRows.length > 0 && roomRows[0].status === "Maintenance") {
      return res.status(409).json({
        message: "Room is currently under Maintenance and unavailable for reservation.",
        conflict: true,
        reason: roomRows[0].maintenance_reason || "Scheduled maintenance"
      });
    }

    const [conflicts] = await pool.query(
      `SELECT * FROM bookings 
       WHERE room_id = ? 
         AND date = ? 
         AND status IN ('Pending', 'Approved') 
         AND NOT (end_time <= ? OR start_time >= ?)`,
      [room_id, date, start_time, end_time]
    );

    if (conflicts.length > 0) {
      const conflictBooking = conflicts[0];
      return res.status(409).json({
        message: "Time slot conflict detected! The selected room is already booked/pending for this duration.",
        conflict: true,
        conflictingBooking: {
          eventName: conflictBooking.event_name,
          facultyName: conflictBooking.faculty_name,
          startTime: conflictBooking.start_time,
          endTime: conflictBooking.end_time,
          status: conflictBooking.status
        }
      });
    }

    const bookingId = "BKG_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
    const equipmentJson = JSON.stringify(equipment || []);
    
    const qrPassData = JSON.stringify({
      bookingId,
      room: room_name,
      event: event_name,
      date,
      time: `${start_time} - ${end_time}`,
      faculty: faculty_name,
      dept: department
    });

    await pool.query(
      `INSERT INTO bookings (id, room_id, room_name, user_id, faculty_name, department, event_name, date, start_time, end_time, participants, purpose, equipment, status, admin_remarks, qr_code_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?)`,
      [
        bookingId,
        room_id,
        room_name,
        req.user.id,
        faculty_name || req.user.name,
        department || req.user.department,
        event_name,
        date,
        start_time,
        end_time,
        Number(participants) || 1,
        purpose || "Department Event",
        equipmentJson,
        qrPassData
      ]
    );

    const notifId = "NTF_" + Date.now().toString(36).toUpperCase();
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, booking_id)
       VALUES (?, ?, ?, ?, 'info', 0, ?)`,
      [
        notifId,
        req.user.id,
        "Booking Submitted",
        `Your booking request for "${event_name}" in ${room_name} on ${date} (${start_time} - ${end_time}) has been submitted for admin approval.`,
        bookingId
      ]
    );

    res.status(201).json({
      message: "Booking request submitted successfully",
      bookingId,
      status: "Pending"
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
});

router.patch("/bookings/:id/status", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status, admin_remarks } = req.body;

    const [bkgRows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    if (bkgRows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bkgRows[0];

    if (req.user.role !== "Administrator" && booking.user_id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this booking" });
    }

    await pool.query("UPDATE bookings SET status = ?, admin_remarks = ? WHERE id = ?", [
      status,
      admin_remarks || "",
      id
    ]);

    const notifType = status === "Approved" ? "success" : (status === "Rejected" ? "error" : "warning");
    const notifTitle = `Booking ${status}`;
    const notifMsg = `Your booking for "${booking.event_name}" on ${booking.date} has been ${status.toLowerCase()}.${admin_remarks ? ` Remarks: ${admin_remarks}` : ""}`;
    
    const notifId = "NTF_" + Date.now().toString(36).toUpperCase();
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, booking_id)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [notifId, booking.user_id, notifTitle, notifMsg, notifType, id]
    );

    res.json({ message: `Booking status updated to ${status}` });
  } catch (error) {
    console.error("Update Booking Status Error:", error);
    res.status(500).json({ message: "Failed to update booking status", error: error.message });
  }
});

router.delete("/bookings/:id", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM bookings WHERE id = ?", [id]);
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete booking", error: error.message });
  }
});

// NOTIFICATIONS
router.get("/notifications/:userId", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
});

router.patch("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification", error: error.message });
  }
});

// ANALYTICS & STATS
router.get("/analytics/stats", async (req, res) => {
  try {
    const pool = getPool();

    const [statusCounts] = await pool.query(
      "SELECT status, COUNT(*) as count FROM bookings GROUP BY status"
    );

    const [deptCounts] = await pool.query(
      "SELECT department, COUNT(*) as count FROM bookings GROUP BY department ORDER BY count DESC LIMIT 6"
    );

    const [roomCounts] = await pool.query(
      "SELECT room_name, COUNT(*) as count FROM bookings WHERE status = 'Approved' GROUP BY room_name ORDER BY count DESC"
    );

    const [totalRooms] = await pool.query("SELECT COUNT(*) as count FROM rooms");
    const [totalUsers] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [totalBookings] = await pool.query("SELECT COUNT(*) as count FROM bookings");

    res.json({
      summary: {
        totalRooms: totalRooms[0].count,
        totalUsers: totalUsers[0].count,
        totalBookings: totalBookings[0].count
      },
      statusBreakdown: statusCounts,
      departmentBreakdown: deptCounts,
      popularRooms: roomCounts
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Failed to generate analytics", error: error.message });
  }
});

export default router;
