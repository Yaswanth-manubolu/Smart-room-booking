import { getPool, initDatabase } from "../config/db.js";

async function run() {
  await initDatabase();
  const pool = getPool();
  await pool.query("DELETE FROM bookings WHERE status = 'Cancelled' OR status = 'Rejected'");
  console.log("?? Cleaned stale cancelled/rejected bookings.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
