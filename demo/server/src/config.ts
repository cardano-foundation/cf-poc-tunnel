import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const endpoint = process.env.ENDPOINT ?? `http://127.0.0.1:${port}`;
const keriaUrl = process.env.KERIA_URL as string;
const keriaBootUrl = process.env.KERIA_BOOT_URL as string;
const bran = process.env.BRAN as string;
const signifyName = process.env.SIGNIFY_NAME as string;
const sessionSecret = process.env.SESSION_SECRET;
const sessionTimeout = Number(process.env.SESSION_TIMEOUT);

const config = {
  endpoint: endpoint,
  endpoints: [endpoint],
  port,
  sessionSecret,
  keriaUrl,
  keriaBootUrl,
  bran,
  signifyName,
  path: {
    ping: "/ping",
    oobi: "/oobi",
    resolveOOBI: "/resolve-oobi",
    schema: "/oobi/:id",
    disclosureAcdc: "/disclosure-acdc",
    acdcRequirements: "/acdc-requirements",
    handleReqGrant: "/handle-req-grant/:said"
  },
  domainSchemaSaid : 'EGjD1gCLi9ecZSZp9zevkgZGyEX_MbOdmhBFt4o0wvdb',
  qviSchemaSaid: 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
  sessionTimeout,
};

export { config };
