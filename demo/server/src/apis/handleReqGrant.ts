import { Request, Response } from "express";
import { getCredentials, getExnMessageBySaid } from "../services/signifyService";
import { Session } from "../database/entities/session";
import { dataSource } from "../database";
import { config } from "../config";

async function handleReqGrant(req: Request, res: Response) {
  const { said } = req.params;
  try {
    const exchange = await getExnMessageBySaid(said);
    const aid = exchange.exn.a.sid;
    const acdcs = await getCredentials({
      "-i": config.issuerAidPrefix,
      "-a-i": exchange.exn.i,
    });
    if (!acdcs.length) {
      return res.status(409).send("AID has not completed the ACDC disclosure yet.");
    }
    const session = new Session();
    const latestAcdc = acdcs.reduce((latestObj, currentObj) => {
      const maxDateTime = latestObj.sad.a.dt;
      const currentDateTime = currentObj.sad.a.dt;
      return currentDateTime > maxDateTime ? currentObj : latestObj;
    });

    if (
      new Date(latestAcdc.sad.a.dt).getTime() <
      new Date().getTime() - 60000
    ) {
      return res.status(409).send(`Latest ACDC disclosure from ${exchange.exn.i} is too old`);
    }
    const acdcSchema = latestAcdc.sad.s;
    if (acdcSchema === config.qviSchemaSaid) {
      session.role = "user";
    }
    session.aid = aid;
    const currentTime = new Date().getTime();
    const sessionDuration = 24 * 60 * 60000; //1 day
    session.validUntil = new Date(currentTime + sessionDuration);
    const entityManager = dataSource.manager;
    await entityManager.save(session);
    return res.status(200).send(exchange);
  } catch (error) {
    console.warn(`handle req grant error:`, error);
    return res.status(500).send((error as Error).message);
  }
}

export { handleReqGrant };
