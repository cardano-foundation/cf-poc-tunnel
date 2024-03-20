import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const endpoint = process.env.ENDPOINT ?? `http://127.0.0.1:${port}`;
const keriaUrl = process.env.KERIA_URL as string;
const keriaBootUrl = process.env.KERIA_BOOT_URL as string;
const bran = process.env.BRAN as string;
const signifyName = process.env.SIGNIFY_NAME as string;
const issuerAidPrefix = process.env.ISSUER_AID_PREFIX;

export const config = {
  endpoint: endpoint,
  endpoints: [endpoint],
  port,
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
    logout: "/logout",
  },
  domainSchemaSaid: "EGjD1gCLi9ecZSZp9zevkgZGyEX_MbOdmhBFt4o0wvdb",
  qviSchemaSaid: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  issuerAidPrefix,
};
