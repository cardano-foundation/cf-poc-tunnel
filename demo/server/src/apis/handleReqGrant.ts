import { Request, Response } from "express";
import { admitIpex, getExnMessageBySaid, getUnhandledGrants, markNotification } from "../services/signifyService";
import { Session } from "../database/entities/session";
import { dataSource } from "../database";
import { config } from "../config";

async function handleReqGrant(req: Request, res: Response) {
  const { said } = req.params;
  try {
    const exchange = await getExnMessageBySaid(said);
    const aid = exchange.exn.a.sid;
    const unhandledGrants = await getUnhandledGrants(exchange.exn.i);
    if (!unhandledGrants.length) {
      return res.status(409).send("AID has not completed the ACDC disclosure yet.");
    }
    const latestGrant = unhandledGrants.reduce((latestObj, currentObj) => {
      const maxDateTime = latestObj.exchange.exn.a.dt;
      const currentDateTime = currentObj.exchange.exn.a.dt;
      return currentDateTime > maxDateTime ? currentObj : latestObj;
    });

    if (
      new Date(latestGrant.exchange.exn.a.dt).getTime() <
      new Date().getTime() - 60000
    ) {
      return res.status(409).send(`Latest ACDC disclosure from ${exchange.exn.i} is too old`);
    }
    const acdcSchema = latestGrant.exchange.exn.acdc.sad.s;

    const session = new Session();
    if (acdcSchema === config.qviSchemaSaid) {
      session.role = "user";
    }
    session.aid = aid;
    const currentTime = new Date().getTime();
    const sessionDuration = 5 * 60000; //5 mins
    session.validUntil = new Date(currentTime + sessionDuration);
    const entityManager = dataSource.manager;
    await entityManager.save(session);

    /**admit and mark the notification */
    await Promise.all(unhandledGrants.map(async grant => {
      const exnData = grant.exchange.exn;
      await admitIpex(grant.notiSaid, config.signifyName, exnData.i);
      await markNotification(grant.notiId);
    }));
      
    return res.status(200).send(exchange);
  } catch (error) {
    console.warn(`handle req grant error:`, error);
    return res.status(500).send((error as Error).message);
  }
}

export { handleReqGrant };
