import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";
import { getOOBIs, resolveOOBI } from "../modules/signifyApi";
import { config } from "../config";

async function resolveClientOOBI(req: Request, res: Response) {
  const resolveOobiResult = await resolveOOBI(req.body.oobiUrl);
  const response: ResponseData<any> = {
    statusCode: 200,
    success: true,
    data: resolveOobiResult,
  };
  httpResponse(res, response);
}

async function getServerOOBI(_: Request, res: Response) {
    const oobisResult = await getOOBIs(config.signifyName, "agent");
    const oobiUrlResponse = await fetch(oobisResult.oobis[0]);
    const formattedOobiResponse = await oobiUrlResponse.text();
    res.status(200).send(formattedOobiResponse);
  }
  
export { resolveClientOOBI, getServerOOBI };
