import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";
import { disclosureAcdc} from "../modules/signifyApi";

async function disclosureMainAcdcApi(req: Request, res: Response) {
  await disclosureAcdc(req.body.aidPrefix);
  const response: ResponseData<any> = {
    statusCode: 200,
    success: true,
    data : null
  };
  httpResponse(res, response);
}
  
export { disclosureMainAcdcApi as disclosureAcdcApi, };
