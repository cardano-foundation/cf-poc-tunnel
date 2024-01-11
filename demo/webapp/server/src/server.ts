import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import router from "./routes";
import { log } from "./log";
import dotenv from 'dotenv';
import { createIdentifier, getIdentifierByName, getOOBIs, initSignify } from "./modules/signifyApi";
dotenv.config();

const bran = process.env.BRAN as string;
const signifyName = process.env.SIGNIFY_NAME as string;
console.log({ bran, signifyName })
async function startServer() {
  const app = express();
  app.use("/static", express.static("static"));
  app.use(cors());
  app.use(bodyParser.json());
  /**Generate AID */
  await initSignify(bran);
  let serverAID;
  try {
    serverAID = await getIdentifierByName(signifyName);    
  } catch (error) {
    if (/404 Not Found/.test((error as any).message)) {
      console.log(`creating server AID...`, );
      await createIdentifier(signifyName);
      serverAID = await getIdentifierByName(signifyName);      
    }
  }
  if (!serverAID) {
    throw new Error("Can't create AID")
  }
  const oobiResult = await getOOBIs(serverAID.name, "agent")
  console.log(`Created AID:`, {
    name: signifyName, 
    prefix: serverAID.prefix, 
    oobi: oobiResult.oobis[0]
  });

  app.use(router);
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
  log(`Listening on port ${config.port}`);
}

void startServer();
