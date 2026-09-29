import { getPool, initDatabase } from "../config/db.js";

async function run() {
  await initDatabase();
  const pool = getPool();
  await pool.query("ALTER TABLE rooms MODIFY COLUMN status VARCHAR(100) NOT NULL DEFAULT 'Available'");
  console.log("?? Updated rooms table schema.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
