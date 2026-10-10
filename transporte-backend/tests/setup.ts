import dotenv from "dotenv";

dotenv.config({ path: ".env.test", override: true });

if (!/_test(\?|$)/.test(process.env.DATABASE_URL ?? "")) {
  throw new Error("Las pruebas solo pueden correr contra una base cuyo nombre termine en _test");
}