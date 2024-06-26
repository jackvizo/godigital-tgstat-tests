import { Client } from "pg";
import * as dotenv from "dotenv";

// Загрузка переменных из файла .env
dotenv.config();

export const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export const connectDB = async () => {
  await client.connect();
};

export const disconnectDB = async () => {
  await client.end();
};

export const truncate = async () => {
  // Очищаем таблицы перед заполнением
  await client.query("TRUNCATE TABLE stat_user RESTART IDENTITY CASCADE");
  await client.query("TRUNCATE TABLE stat_post RESTART IDENTITY CASCADE");
  await client.query("TRUNCATE TABLE stat_reaction RESTART IDENTITY CASCADE");
};
