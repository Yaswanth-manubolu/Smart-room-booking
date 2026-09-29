import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root1n",
  database: process.env.DB_NAME || "smart_room_booking_db",
  port: Number(process.env.DB_PORT) || 3306
};

async function removeOldBookings() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    const targetIds = ['BOK-022295', 'BOK-699664'];
    
    const [result] = await connection.query(
      "DELETE FROM bookings WHERE id IN (?, ?)",
      targetIds
    );

    console.log(`✅ Successfully deleted ${result.affectedRows} old booking(s) from MySQL database.`);
    await connection.end();
  } catch (error) {
    console.error("❌ Error deleting old bookings:", error.message);
  }
}

removeOldBookings();
