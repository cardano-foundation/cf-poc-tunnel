import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import router from "./routes";
import { log } from "./log";
import { createIdentifier, getIdentifierByName, getOOBIs, initSignify } from "./modules/signifyApi";

const signifyName = config.signifyName;
log({ signifyName })
async function startServer() {
  const app = express();
  app.use("/static", express.static("static"));
  app.use(cors());
  app.use(bodyParser.json());
  /**Generate AID */
  await initSignify();
  let serverAID;
  try {
    serverAID = await getIdentifierByName(signifyName);    
  } catch (error) {
    if (/404 Not Found/.test((error as any).message)) {
      log(`creating server AID...`, );
      await createIdentifier(signifyName);
      serverAID = await getIdentifierByName(signifyName);      
    }
  }
  if (!serverAID) {
    throw new Error("Can't create AID")
  }
  const oobiResult = await getOOBIs(serverAID.name, "agent")
  log(`Generated AID:`, {
    name: serverAID.name, 
    prefix: serverAID.prefix, 
    oobi: oobiResult.oobis[0]
  });

  app.use(router);
  app.listen(config.port, () => {
    log(`Server is running on port ${config.port}`);
  });
}

void startServer();
