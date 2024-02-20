import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import { router } from "./routes";
import { log } from "./utils/log";
import { initKeri, initSignify } from "./services/signifyService";

async function startServer() {
  const app = express();
  app.use("/static", express.static("static"));
  app.use(cors({
    exposedHeaders: ["signature", "signature-input", "signify-resource", "signify-timestamp"]
  }));
  app.use(bodyParser.json());

  app.use(router);
  app.listen(config.port, () => {
    log(`Server is running on port ${config.port}`);
  });

  /**Generate AID */
  await initSignify();
  const { identifier, oobi, credDomain } = await initKeri();
  log(`Generated AID:`, {
    name: identifier.name,
    prefix: identifier.prefix,
    oobi: oobi.oobis[0],
    acdc: credDomain.sad,
  });
}

void startServer();
