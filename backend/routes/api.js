import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../config/db.js";
import { validateBookingWindow, formatTime12 } from "../config/collegeTimings.js";
import { notifyBookingRequested, notifyBookingDecision, isMailConfigured } from "../services/mailer.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "smart_room_booking_super_secret_key_2026";

// Utility helper to convert database room JSON fields
const formatRoom = (row) => ({
  ...row,
  facilities: typeof row.facilities === "string" ? JSON.parse(row.facilities) : row.facilities,
  position: typeof row.position === "string" ? JSON.parse(row.position) : row.position,
  dimensions: typeof row.dimensions === "string" ? JSON.parse(row.dimensions) : row.dimensions
});

const formatDateSafe = (rawDate) => {
  if (!rawDate) return "";
  if (typeof rawDate === "string") {
    return rawDate.split("T")[0];
  }
  if (rawDate instanceof Date) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, "0");
    const d = String(rawDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(rawDate).split("T")[0];
};

// unique ids (several rows can be created within the same millisecond)
const newId = (prefix) =>
  `${prefix}-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const formatBooking = (row) => ({
  id: row.id,
  roomId: row.room_id,
  roomName: row.room_name,
  facultyId: row.user_id,
  facultyName: row.faculty_name,
  department: row.department,
  eventName: row.event_name,
  date: formatDateSafe(row.date),
  startTime: row.start_time,
  endTime: row.end_time,
  participants: row.participants,
  purpose: row.purpose,
  equipment: typeof row.equipment === "string" ? JSON.parse(row.equipment) : row.equipment,
  status: row.status,
  adminRemarks: row.admin_remarks || "",
  createdAt: row.created_at,
  qrCodeData: row.qr_code_data
});

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Register Faculty Member
router.post("/auth/register", async (req, res) => {
  try {
    const pool = getPool();
    const { name, department, email, password, phone } = req.body;

    if (!name || !department || !email || !password) {
      return res.status(400).json({ error: "Name, department, email, and password are required." });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const userId = `FAC_${Date.now().toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (id, name, department, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?, 'Faculty')`,
      [userId, name.trim(), department.trim(), email.toLowerCase().trim(), hashedPassword, phone || ""]
    );

    const user = {
      id: userId,
      name: name.trim(),
      department: department.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      role: "Faculty",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=06b6d4&color=fff`
    };

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ message: "Registration successful!", user, token });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Server error during user registration." });
  }
});

// Login User (Admin or Faculty)
router.post("/auth/login", async (req, res) => {
  try {
    const pool = getPool();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = ?", [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email address or password." });
    }

    const dbUser = rows[0];
    const isMatch = await bcrypt.compare(password, dbUser.password);

    // Fallback plain check for initial admin setup if needed
    const isValid = isMatch || (dbUser.email === "admin@gmail.com" && password === "admin@123");

    if (!isValid) {
      return res.status(401).json({ error: "Invalid email address or password." });
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      department: dbUser.department,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.name)}&background=${dbUser.role === 'Administrator' ? 'f59e0b' : '06b6d4'}&color=fff`
    };

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful!", user, token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during authentication." });
  }
});

// Store OTPs in memory: email -> { otp, expiresAt }
const otpStore = new Map();

// Generate & Send Password Reset OTP
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const pool = getPool();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = ?", [cleanEmail]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No registered account found with this email address." });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

    otpStore.set(cleanEmail, { otp, expiresAt });

    console.log(`🔑 RESET OTP GENERATED for ${cleanEmail}: [ ${otp} ]`);

    res.json({
      message: `Verification OTP generated and sent to ${cleanEmail}!`,
      otpDemo: otp
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Failed to process password reset request." });
  }
});

// Verify OTP & Update Password in MySQL
router.post("/auth/reset-password", async (req, res) => {
  try {
    const pool = getPool();
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP code, and new password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const stored = otpStore.get(cleanEmail);

    if (!stored) {
      return res.status(400).json({ error: "No active OTP request found for this email. Please request a new OTP." });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: "OTP code has expired. Please request a new OTP." });
    }

    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Invalid OTP code entered. Please check your email and try again." });
    }

    // Hash new password and update MySQL user record
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE LOWER(email) = ?", [hashedPassword, cleanEmail]);

    otpStore.delete(cleanEmail);

    console.log(`✅ Password successfully updated for user: ${cleanEmail}`);

    res.json({ message: "Password updated successfully! You can now log in with your new password." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// Fetch all registered Users (Admin only view)
router.get("/users", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT id, name, department, email, phone, role, created_at FROM users");
    const users = rows.map((u) => ({
      ...u,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=${u.role === 'Administrator' ? 'f59e0b' : '06b6d4'}&color=fff`
    }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// ==========================================
// 2. ROOM MANAGEMENT
// ==========================================

router.get("/rooms", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM rooms ORDER BY name ASC");
    res.json(rows.map(formatRoom));
  } catch (error) {
    console.error("Fetch Rooms Error:", error);
    res.status(500).json({ error: "Failed to fetch infrastructure rooms." });
  }
});

router.post("/rooms", async (req, res) => {
  try {
    const pool = getPool();
    const room = req.body;
    const roomId = room.id || `ROOM_${Date.now().toString().slice(-6)}`;

    await pool.query(
      `INSERT INTO rooms (id, name, code, building, capacity, facilities, status, type, description, position, dimensions, color, maintenance_reason, floor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        room.name,
        room.code,
        room.building,
        room.capacity,
        JSON.stringify(room.facilities || []),
        room.status || "Available",
        room.type || "Seminar Hall",
        room.description || "",
        JSON.stringify(room.position || { x: 0, y: 0, z: 0 }),
        JSON.stringify(room.dimensions || { width: 4, height: 2.5, depth: 4 }),
        room.color || "#3b82f6",
        room.maintenanceReason || "",
        room.floor || "Ground Floor"
      ]
    );

    res.status(201).json({ message: "Room added successfully!", roomId });
  } catch (error) {
    console.error("Add Room Error:", error);
    res.status(500).json({ error: "Failed to create new room." });
  }
});

router.put("/rooms/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const room = req.body;

    await pool.query(
      `UPDATE rooms SET name=?, code=?, building=?, capacity=?, facilities=?, status=?, type=?, description=?, color=?, maintenance_reason=? WHERE id=?`,
      [
        room.name,
        room.code,
        room.building,
        room.capacity,
        JSON.stringify(room.facilities || []),
        room.status,
        room.type,
        room.description,
        room.color,
        room.maintenanceReason || "",
        id
      ]
    );

    // If Admin forces room to be Available, cancel any existing active/pending bookings for this room!
    if (room.status === "Force Available" || room.status === "Available") {
      await pool.query(
        "UPDATE bookings SET status = 'Cancelled', admin_remarks = 'Overridden by Administrator to make hall available' WHERE (room_id = ? OR room_name = ?) AND status IN ('Approved', 'Pending')",
        [id, room.name]
      );
    }

    res.json({ message: "Room updated successfully!" });
  } catch (error) {
    console.error("Update Room Error:", error);
    res.status(500).json({ error: "Failed to update room details." });
  }
});

router.delete("/rooms/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM rooms WHERE id = ?", [id]);
    res.json({ message: "Room deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete room." });
  }
});

// ==========================================
// 3. ROOM BOOKINGS & CONFLICT CONTROL
// ==========================================

router.get("/bookings", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM bookings ORDER BY date DESC, start_time ASC");
    res.json(rows.map(formatBooking));
  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    res.status(500).json({ error: "Failed to fetch booking records." });
  }
});

router.post("/bookings", async (req, res) => {
  const pool = getPool();
  const b = req.body || {};

  // ---- 1. basic validation -------------------------------------------------
  const date = String(b.date || "").slice(0, 10);
  const startTime = String(b.startTime || "").trim();
  const endTime = String(b.endTime || "").trim();
  const participants = Number(b.participants);

  if (!b.roomId || !b.facultyId || !b.eventName || !b.purpose) {
    return res.status(400).json({ error: "Room, event name and purpose are required." });
  }
  if (!Number.isFinite(participants) || participants < 1) {
    return res.status(400).json({ error: "Please enter a valid number of participants." });
  }

  // ---- 2. college timings only ---------------------------------------------
  const windowCheck = validateBookingWindow({ date, startTime, endTime });
  if (!windowCheck.valid) {
    return res.status(400).json({ error: windowCheck.error });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock the room row so two people can't grab the same slot at the same moment
    const [roomRows] = await conn.query("SELECT * FROM rooms WHERE id = ? FOR UPDATE", [b.roomId]);
    if (roomRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Selected room was not found." });
    }
    const room = roomRows[0];
    if (room.status === "Maintenance") {
      await conn.rollback();
      return res.status(409).json({ error: `${room.name} is under maintenance and cannot be booked.` });
    }

    const [userRows] = await conn.query("SELECT id, name, email, department FROM users WHERE id = ?", [b.facultyId]);
    if (userRows.length === 0) {
      await conn.rollback();
      return res.status(401).json({ error: "Your account was not found. Please sign in again." });
    }
    const user = userRows[0];

    // ---- 3. availability (no overlap with Approved / Pending bookings) -----
    const [clashes] = await conn.query(
      `SELECT event_name, start_time, end_time, status FROM bookings
       WHERE room_id = ? AND date = ? AND status IN ('Approved', 'Pending')
         AND start_time < ? AND end_time > ?`,
      [room.id, date, endTime, startTime]
    );
    if (clashes.length > 0) {
      await conn.rollback();
      const c = clashes[0];
      return res.status(409).json({
        error: `${room.name} is not available: it is already ${c.status === "Approved" ? "booked" : "requested"} from ${formatTime12(c.start_time)} to ${formatTime12(c.end_time)} on ${date}. Please choose another time or room.`
      });
    }

    // ---- 4. save the booking (status Pending until the admin confirms) -----
    const bookingId = newId("BOK");
    const qrData = `${bookingId}|${room.id}|${date}|${startTime}|${user.name}`;
    const equipment = b.equipment || [];

    await conn.query(
      `INSERT INTO bookings (id, room_id, room_name, user_id, faculty_name, department, event_name, date, start_time, end_time, participants, purpose, equipment, status, admin_remarks, qr_code_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', ?)`,
      [
        bookingId,
        room.id,
        room.name,
        user.id,
        user.name,
        (b.department || user.department || "").toString(),
        String(b.eventName).trim(),
        date,
        startTime,
        endTime,
        participants,
        String(b.purpose).trim(),
        JSON.stringify(equipment),
        qrData
      ]
    );

    // ---- 5. in-app notifications: requester + every admin ------------------
    await conn.query(
      `INSERT INTO notifications (id, user_id, title, message, type, booking_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newId("NOTIF"),
        user.id,
        "Booking Request Sent",
        `Your request for ${room.name} on ${date} (${formatTime12(startTime)} – ${formatTime12(endTime)}) has been sent to the admin. After confirmation your room will be booked.`,
        "warning",
        bookingId
      ]
    );

    const [admins] = await conn.query("SELECT id FROM users WHERE role = 'Administrator'");
    for (const admin of admins) {
      await conn.query(
        `INSERT INTO notifications (id, user_id, title, message, type, booking_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newId("NOTIF"),
          admin.id,
          "New Booking Request",
          `Booking request for ${room.name} by ${user.email} on ${date} (${formatTime12(startTime)} – ${formatTime12(endTime)}).`,
          "info",
          bookingId
        ]
      );
    }

    await conn.commit();

    // ---- 6. e-mails to the user AND the admin (not awaited: keeps the UI fast) ----
    console.log("📧 DEBUG: Sending booking request emails", { bookingId, requester: user.email });
    void notifyBookingRequested(
      {
        id: bookingId,
        roomName: room.name,
        date,
        startTime,
        endTime,
        eventName: String(b.eventName).trim(),
        purpose: String(b.purpose).trim(),
        participants,
        department: b.department || user.department,
        equipment
      },
      { name: user.name, email: user.email }
    );

    res.status(201).json({
      message: "Booking request sent to the admin. After confirmation your room will be booked.",
      bookingId,
      emailMode: isMailConfigured() ? "resend" : "console"
    });
  } catch (error) {
    try { await conn.rollback(); } catch { /* ignore */ }
    console.error("Create Booking Error:", error);
    res.status(500).json({ error: "Failed to create booking request." });
  } finally {
    conn.release();
  }
});

// Update Booking Status (Approve / Reject)
router.put("/bookings/:id/status", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!["Approved", "Rejected", "Cancelled"].includes(status)) {
      return res.status(400).json({ error: "Status must be Approved, Rejected or Cancelled." });
    }

    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    const booking = rows[0];

    // never confirm a slot that overlaps another confirmed booking
    if (status === "Approved") {
      const [clashes] = await pool.query(
        `SELECT event_name, start_time, end_time FROM bookings
         WHERE room_id = ? AND date = ? AND status = 'Approved' AND id <> ?
           AND start_time < ? AND end_time > ?`,
        [booking.room_id, booking.date, id, booking.end_time, booking.start_time]
      );
      if (clashes.length > 0) {
        return res.status(409).json({
          error: `Cannot approve: ${booking.room_name} is already booked from ${formatTime12(clashes[0].start_time)} to ${formatTime12(clashes[0].end_time)} ("${clashes[0].event_name}").`
        });
      }
    }

    await pool.query(
      "UPDATE bookings SET status = ?, admin_remarks = ? WHERE id = ?",
      [status, adminRemarks || "", id]
    );

    // in-app notification for the faculty member
    const notifTitle = status === "Approved" ? "Booking Approved! 🎉" : `Booking Request ${status}`;
    const notifMsg = status === "Approved"
      ? `Your booking for ${booking.room_name} on '${booking.event_name}' was APPROVED!`
      : `Your booking for ${booking.room_name} was ${status.toLowerCase()}. Remarks: ${adminRemarks || "None"}`;

    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, booking_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [newId("NOTIF"), booking.user_id, notifTitle, notifMsg, status === "Approved" ? "success" : "error", id]
    );

    // e-mail the requester about the admin's decision
    const [userRows] = await pool.query("SELECT name, email FROM users WHERE id = ?", [booking.user_id]);
    if (userRows.length > 0) {
      console.log("📧 DEBUG: Sending booking decision email", { bookingId: id, status, requester: userRows[0].email });
      void notifyBookingDecision(
        {
          id,
          roomName: booking.room_name,
          date: formatDateSafe(booking.date),
          startTime: booking.start_time,
          endTime: booking.end_time,
          eventName: booking.event_name
        },
        userRows[0],
        status,
        adminRemarks
      );
    }

    res.json({ message: `Booking status updated to ${status}.` });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ error: "Failed to update booking status." });
  }
});

// Delete Booking Record
router.delete("/bookings/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM bookings WHERE id = ?", [id]);
    res.json({ message: "Booking record deleted successfully." });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    res.status(500).json({ error: "Failed to delete booking record." });
  }
});

// ==========================================
// 4. NOTIFICATIONS
// ==========================================

router.get("/notifications/:userId", async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

router.put("/notifications/:id/read", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    res.json({ message: "Notification marked as read." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification." });
  }
});

router.put("/notifications/user/:userId/read-all", async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;
    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read." });
  }
});

router.delete("/notifications/user/:userId", async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;
    await pool.query("DELETE FROM notifications WHERE user_id = ?", [userId]);
    res.json({ message: "Notifications cleared." });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear notifications." });
  }
});

export default router;
