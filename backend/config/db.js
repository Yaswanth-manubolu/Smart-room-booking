import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: AVNS_75TAyf6VvW5E-PCflPF,
  port: Number(process.env.DB_PORT || 3306),
  ssl: process.env.DB_SSL === "true"
    ? {
        ca: process.env.DB_CA_CERT?.replace(/\\n/g, "\n"),
        rejectUnauthorized: true
      }
    : undefined
};

const DB_NAME = process.env.DB_NAME || "smart_room_booking_db";

let pool = null;

export async function initDatabase() {
  try {
    // 1. Connect without database to ensure DB exists
    const rootConnection = await mysql.createConnection(DB_CONFIG);
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await rootConnection.end();

    // 2. Create pool connected to smart_room_booking_db
    pool = mysql.createPool({
      ...DB_CONFIG,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    });

    console.log(`✅ Connected to MySQL Database: ${DB_NAME}`);

    // 3. Create Tables
    await createTables();

    // 4. Seed Fresh Initial Data (Admin + Rooms)
    await seedInitialData();

    return pool;
  } catch (error) {
    console.error("❌ MySQL Database Initialization Error:", error.message);
    console.log("⚠️ Fallback Mode: Make sure MySQL server is running on localhost:3306 with user 'root' and password 'root1n'.");
    throw error;
  }
}

async function createTables() {
  // Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      role ENUM('Faculty', 'Administrator') NOT NULL DEFAULT 'Faculty',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Rooms Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      building VARCHAR(255) NOT NULL,
      capacity INT NOT NULL,
      facilities JSON NOT NULL,
      status VARCHAR(100) NOT NULL DEFAULT 'Available',
      type VARCHAR(100) NOT NULL,
      description TEXT,
      position JSON,
      dimensions JSON,
      color VARCHAR(50),
      maintenance_reason TEXT,
      floor VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure rooms status column is VARCHAR(100) to support Force Available and Maintenance
  try {
    await pool.query(`ALTER TABLE rooms MODIFY COLUMN status VARCHAR(100) NOT NULL DEFAULT 'Available';`);
  } catch (err) {
    // Column already modified
  }

  // Bookings Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(100) PRIMARY KEY,
      room_id VARCHAR(100) NOT NULL,
      room_name VARCHAR(255) NOT NULL,
      user_id VARCHAR(100) NOT NULL,
      faculty_name VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      participants INT NOT NULL,
      purpose TEXT NOT NULL,
      equipment JSON NOT NULL,
      status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
      admin_remarks TEXT,
      qr_code_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Notifications Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      booking_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

async function seedInitialData() {
  // 1. Seed Admin User (admin@gmail.com / admin@123)
  const [adminRows] = await pool.query("SELECT * FROM users WHERE id = 'USR_ADMIN_01'");
  if (adminRows.length === 0) {
    const hashedPassword = await bcrypt.hash("admin@123", 10);
    await pool.query(
      `INSERT INTO users (id, name, department, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "USR_ADMIN_01",
        "System Administrator",
        "Infrastructure Administration",
        "admin@gmail.com",
        hashedPassword,
        "+1 (555) 010-0000",
        "Administrator"
      ]
    );
    console.log("🔑 Seeded Default Admin User: admin@gmail.com / admin@123");
  }

  // 2. Seed Default Infrastructure Rooms if empty
  const [roomRows] = await pool.query("SELECT * FROM rooms");
  if (roomRows.length === 0) {
    const defaultRooms = [
      {
        id: "ROOM_HALL_A",
        name: "Seminar Hall A",
        code: "SHA-101",
        building: "Block A - Ground Floor",
        capacity: 120,
        facilities: JSON.stringify(["HD Projector", "Centralized AC", "Dolby Audio", "High-speed Wi-Fi", "Podium"]),
        status: "Available",
        type: "Seminar Hall",
        description: "Spacious tiered seminar hall suitable for department lectures, guest talks, and interactive workshops.",
        position: JSON.stringify({ x: -9, y: 0, z: -4.5 }),
        dimensions: JSON.stringify({ width: 4.5, height: 2.5, depth: 4 }),
        color: "#10b981",
        maintenance_reason: "",
        floor: "Ground Floor"
      },
      {
        id: "ROOM_HALL_B",
        name: "Seminar Hall B",
        code: "SHB-102",
        building: "Block A - First Floor",
        capacity: 80,
        facilities: JSON.stringify(["HD Projector", "Wireless Mics", "Standard AC", "Whiteboard"]),
        status: "Available",
        type: "Seminar Hall",
        description: "Compact modern hall optimized for small seminars, faculty discussions, and technical tutorials.",
        position: JSON.stringify({ x: -3, y: 0, z: -4.5 }),
        dimensions: JSON.stringify({ width: 4, height: 2.5, depth: 3.5 }),
        color: "#3b82f6",
        maintenance_reason: "",
        floor: "1st Floor"
      },
      {
        id: "ROOM_HALL_C",
        name: "Seminar Hall C",
        code: "SHC-201",
        building: "Block B - Ground Floor",
        capacity: 60,
        facilities: JSON.stringify(["Interactive Smart Board", "Video Conferencing Camera", "AC", "Surround Sound"]),
        status: "Maintenance",
        type: "Smart Classroom / Hall",
        description: "High-tech smart hall with interactive digital boards and video call studio integration.",
        position: JSON.stringify({ x: 3, y: 0, z: -4.5 }),
        dimensions: JSON.stringify({ width: 3.8, height: 2.5, depth: 3.2 }),
        color: "#6b7280",
        maintenance_reason: "Projector lens calibration & audio wiring upgrades",
        floor: "Ground Floor"
      },
      {
        id: "ROOM_HALL_D",
        name: "Seminar Hall D",
        code: "SHD-202",
        building: "Block B - Second Floor",
        capacity: 100,
        facilities: JSON.stringify(["Centralized AC", "Dual Screen Projection", "Wireless Microphones", "Podium Screen"]),
        status: "Available",
        type: "Seminar Hall",
        description: "Versatile medium hall featuring dual projection screens and high-capacity acoustic treatment.",
        position: JSON.stringify({ x: 9, y: 0, z: -4.5 }),
        dimensions: JSON.stringify({ width: 4.2, height: 2.5, depth: 3.8 }),
        color: "#8b5cf6",
        maintenance_reason: "",
        floor: "2nd Floor"
      },
      {
        id: "ROOM_AUDITORIUM",
        name: "Main Auditorium",
        code: "AUD-001",
        building: "Central Cultural Complex",
        capacity: 500,
        facilities: JSON.stringify(["Concert Sound System", "Grand Theater Stage", "Green Rooms", "Stage Spotlight System", "Live Streaming Suite", "Central AC"]),
        status: "Available",
        type: "Auditorium",
        description: "Flagship multi-tier auditorium for university convocations, national conferences, cultural galas, and annual summits.",
        position: JSON.stringify({ x: 0, y: 0, z: 4.5 }),
        dimensions: JSON.stringify({ width: 7, height: 3.5, depth: 6 }),
        color: "#f59e0b",
        maintenance_reason: "",
        floor: "Ground & Balcony"
      }
    ];

    for (const room of defaultRooms) {
      await pool.query(
        `INSERT INTO rooms (id, name, code, building, capacity, facilities, status, type, description, position, dimensions, color, maintenance_reason, floor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          room.id,
          room.name,
          room.code,
          room.building,
          room.capacity,
          room.facilities,
          room.status,
          room.type,
          room.description,
          room.position,
          room.dimensions,
          room.color,
          room.maintenance_reason,
          room.floor
        ]
      );
    }
    console.log("🏛️ Seeded Default Infrastructure Rooms in MySQL.");
  }
}

export function getPool() {
  return pool;
}
