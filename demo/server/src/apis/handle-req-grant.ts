import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";
import { getCredentials, getExnMessageBySaid } from "../modules/signifyApi";
import { Session } from "../database/entities/session";
import { dataSource } from "../database";

async function handleReqGrant(req: Request, res: Response) {
  const { said } = req.params;
  try {
    const exchange = await getExnMessageBySaid(said);
    const aid = exchange.exn.a.sid;
    const acdcs= await getCredentials();
    const acdcsOfAid = acdcs.filter(acdc => acdc.sad.a.i === aid);
    if (!acdcsOfAid.length) {
      throw new Error("AID have not completed the ACDC disclosure yet.");
    }
    const session = new Session();
    session.aid = aid;
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
