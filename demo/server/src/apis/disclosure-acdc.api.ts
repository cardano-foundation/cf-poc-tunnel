import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";
import { disclosureAcdc } from "../modules/signifyApi";
import { ERROR_MESSAGE } from "../utils/constants";

async function disclosureAcdcApi(req: Request, res: Response) {
  try {
    await disclosureAcdc(
      req.body.aidPrefix,
      req.body.schemaSaid,
      req.body.issuer,
    );
    const response: ResponseData<any> = {
      statusCode: 200,
      success: true,
      data: null,
    };
    httpResponse(res, response);
  } catch (error) {
    if (error && error["message"] === ERROR_MESSAGE.ACDC_NOT_FOUND) {
      const response: ResponseData<any> = {
        statusCode: 409,
        success: false,
        data: null,
        error: error["message"],
      };
      return httpResponse(res, response);
    }
    const response: ResponseData<any> = {
      statusCode: 500,
      success: false,
      data: null,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    };
    return httpResponse(res, response);
  }
}

export { disclosureAcdcApi };
