import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root1n",
  database: process.env.DB_NAME || "smart_room_booking_db",
  port: Number(process.env.DB_PORT) || 3306
};

async function fixColumn() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    await connection.query("ALTER TABLE rooms MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'Available';");
    console.log("✅ Successfully updated rooms.status column to VARCHAR(255).");
    await connection.end();
  } catch (error) {
    console.error("❌ Error modifying column:", error.message);
  }
}

fixColumn();
