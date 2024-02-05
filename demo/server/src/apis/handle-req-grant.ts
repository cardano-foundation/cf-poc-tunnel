import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";
import { getCredentials, getExchangesBySaid } from "../modules/signifyApi";

async function handleReqGrant(req: Request, res: Response) {
  const { said } = req.params;
  try {
    const exchange = await getExchangesBySaid(said);
    const aid = exchange.exn.a.gid;
    const acdcs= await getCredentials();
    const acdcsOfAid = acdcs.filter(acdc => acdc.sad.a.i === aid);
    if (!acdcsOfAid.length) {
      throw new Error("AID have not completed the ACDC disclosure yet.");
    }
    req.session.loginInfo = {
      aid, 
      timestamp: new Date().getTime()
    }
    const response: ResponseData<any> = {
      statusCode: 200,
      success: true,
      data: exchange,
    };
    httpResponse(res, response);  
  } catch (error) {
    const response: ResponseData<any> = {
      statusCode: 500,
      success: false,
      data: (error as Error).message,
    };
    httpResponse(res, response);  
  }

}

export { handleReqGrant };
