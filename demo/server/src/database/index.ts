import dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";

export const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    username: process.env.DB_USERNAME ? process.env.DB_USERNAME : 'postgres',
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : 'postgres',
    database: process.env.DB_DATABASE ? process.env.DB_DATABASE : 'cf-poc-tunnel',
    entities: ["src/database/entities/*.ts"],
    synchronize: process.env.NODE_ENV === 'production' ? false : true
  });
