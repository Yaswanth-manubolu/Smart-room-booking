import { getPool, initDatabase } from "../config/db.js";

async function run() {
  await initDatabase();
  const pool = getPool();
  
  const positions = [
    { id: "ROOM_HALL_A", pos: { x: -9, y: 0, z: -4.5 } },
    { id: "ROOM_HALL_B", pos: { x: -3, y: 0, z: -4.5 } },
    { id: "ROOM_HALL_C", pos: { x: 3, y: 0, z: -4.5 } },
    { id: "ROOM_HALL_D", pos: { x: 9, y: 0, z: -4.5 } },
    { id: "ROOM_AUDITORIUM", pos: { x: 0, y: 0, z: 4.5 } }
  ];

  for (const item of positions) {
    await pool.query("UPDATE rooms SET position = ? WHERE id = ?", [JSON.stringify(item.pos), item.id]);
  }

  console.log("?? Updated 3D coordinates for all rooms.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
