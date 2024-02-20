import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";
import { getCredentials, getExnMessageBySaid } from "../modules/signifyApi";
import { Session } from "../database/entities/session";
import { dataSource } from "../database";
import { config } from "../config";

async function handleReqGrant(req: Request, res: Response) {
  const { said } = req.params;
  try {
    const exchange = await getExnMessageBySaid(said);
    const aid = exchange.exn.a.sid;
    const acdcs= await getCredentials({
      '-i': config.issuerAidPrefix,
      '-a-i': exchange.exn.i
    });
    if (!acdcs.length) {
      throw new Error("AID have not completed the ACDC disclosure yet.");
    }
    const session = new Session();
    const latestAcdc = acdcs.reduce((latestObj, currentObj) => {
        const maxDateTime = latestObj.sad.a.dt;
        const currentDateTime = currentObj.sad.a.dt;
        return currentDateTime > maxDateTime ? currentObj : latestObj;
    });

    if (new Date(latestAcdc.sad.a.dt).getTime() < new Date().getTime() - 60000) {
      throw new Error("The ACDC is too old");
    }
    const acdcSchema = latestAcdc.sad.s;
    if (acdcSchema === config.qviSchemaSaid) {
      session.role = 'user';
    };
    session.aid = aid;
    const currentTime = new Date().getTime();
    const sessionDuration = 5 * 60000; //5 mins
    session.validUntil = new Date(currentTime + sessionDuration);
    const entityManager = dataSource.manager;
    await entityManager.save(session);
    const response: ResponseData<any> = {
      statusCode: 200,
      success: true,
      data: exchange,
    };
    httpResponse(res, response);  
  } catch (error) {
    console.log(`handle req grant error:`, error);
    const response: ResponseData<any> = {
      statusCode: 500,
      success: false,
      data: (error as Error).message,
    };
    httpResponse(res, response);  
  }
}

export { handleReqGrant };
