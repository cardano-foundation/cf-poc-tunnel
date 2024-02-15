import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import router from "./routes";
import { log } from "./log";
import { initKeri, initSignify } from "./modules/signifyApi";
import session from 'express-session';

const signifyName = config.signifyName;
log({ signifyName });
async function startServer() {
  const app = express();
  // Use the session middleware
  app.use(session({
    secret: 'your-secret-key', // Change this to a strong, secure secret
    resave: false,
    saveUninitialized: true,
  }));
  app.use('/static', express.static('static'));
  app.use(cors());
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
