import { execSync } from "node:child_process";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.test", override: true });

const url = process.env.DATABASE_URL ?? "";
if (!/_test(\?|$)/.test(url)) {
  throw new Error("La base de pruebas debe terminar en _test. Revisa .env.test");
}

const dbName = new URL(url).pathname.slice(1);
const adminUrl = new URL(url);
adminUrl.pathname = "/postgres";

const client = new pg.Client({ connectionString: adminUrl.toString() });
await client.connect();
const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (exists.rowCount === 0) {
  await client.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Base de datos ${dbName} creada`);
}
await client.end();

execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });