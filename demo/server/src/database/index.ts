import dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";
import { Session } from "./entities/session";

export const dataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_DATABASE
    ? process.env.DB_DATABASE
    : "cf-poc-tunnel.sql",
  entities: [Session],
  synchronize: process.env.NODE_ENV === "production" ? false : true,
});
