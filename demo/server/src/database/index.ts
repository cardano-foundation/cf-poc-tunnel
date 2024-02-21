import dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";

export const dataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_DATABASE
    ? process.env.DB_DATABASE
    : "cf-poc-tunnel.sql",
  entities: ["src/database/entities/*.ts"],
  synchronize: process.env.NODE_ENV === "production" ? false : true,
});
