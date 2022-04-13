import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

interface DB {
  host: string;
  user: string;
  database: string;
  password: string;
  port: number;
  max: number;
  idleTimeoutMillis: number;
}

interface Config {
  serviceName: string;
  port: number;
  loggerLevel: string;
  db: DB;
  TPC_HOST?: string;
  GWT_SECRET: string;
  GWT_EXPIRE_TIME: string;
  rpcAddress: string;
}

const config: Config = {
  serviceName: process.env.SERVICENAME || "ARBITRAGE",
  port: Number(process.env.PORT) || 3000,
  loggerLevel: "debug",

  db: {
    host: process.env.PGHOST || "",
    user: process.env.PGUSER || "",
    database: process.env.PGDATABASE || "",
    password: process.env.PGPASSWORD || "",
    port: Number(process.env.PGPORT) || 5432,
    max: Number(process.env.PG_MAX_CLIENT) || 499,
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
  },

  // db_local: {
  //   host: process.env.PGHOST_LOCAL || "",
  //   user: process.env.PGUSER_LOCAL || "",
  //   database: process.env.PGDATABASE_LOCAL || "",
  //   password: process.env.PGPASSWORD_LOCAL || "",
  //   port: Number(process.env.PGPORT_LOCAL) || 5432,
  //   max: Number(process.env.PG_MAX_CLIENT) || 20,
  //   idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
  // },

  rpcAddress: process.env.RPC_HTTP ?? "",

  TPC_HOST: process.env.RPC_HTTP,
  GWT_SECRET: process.env.GWT_SECRET ?? "something default ?",
  GWT_EXPIRE_TIME: process.env.GWT_EXPIRE_TIME ?? "",
};

export = config;
