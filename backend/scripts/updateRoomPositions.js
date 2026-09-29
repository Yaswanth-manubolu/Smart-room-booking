import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root1n",
  database: process.env.DB_NAME || "smart_room_booking_db",
  port: Number(process.env.DB_PORT) || 3306
};

async function updatePositions() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);

    const positions = [
      { id: "ROOM_HALL_A", pos: { x: -9, y: 0, z: -4.5 } },
      { id: "ROOM_HALL_B", pos: { x: -3, y: 0, z: -4.5 } },
      { id: "ROOM_HALL_C", pos: { x: 3, y: 0, z: -4.5 } },
      { id: "ROOM_HALL_D", pos: { x: 9, y: 0, z: -4.5 } },
      { id: "ROOM_AUDITORIUM", pos: { x: 0, y: 0, z: 4.5 } }
    ];

    for (const item of positions) {
      await connection.query("UPDATE rooms SET position = ? WHERE id = ?", [
        JSON.stringify(item.pos),
        item.id
      ]);
    }

    console.log("✅ Successfully updated all 5 hall 3D positions in MySQL database (Halls A, B, C, D in one back row!).");
    await connection.end();
  } catch (error) {
    console.error("❌ Error updating positions:", error.message);
  }
}

updatePositions();
