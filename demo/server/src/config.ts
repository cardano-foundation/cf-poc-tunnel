import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const endpoint = process.env.ENDPOINT ?? `http://127.0.0.1:${port}`;
const keriaUrl = process.env.KERIA_URL as string;
const keriaBootUrl = process.env.KERIA_BOOT_URL as string;
const bran = process.env.BRAN as string;
const signifyName = process.env.SIGNIFY_NAME as string;

const config = {
  endpoint: endpoint,
  endpoints: [endpoint],
  port,
  keriaUrl,
  keriaBootUrl,
  bran,
  signifyName,
  path: {
    ping: "/ping",
    serverOobi: "/server-oobi",
    resolveOOBI: "/resolve-oobi",
    schema: "/oobi/:id",
  },
};

export { config };
