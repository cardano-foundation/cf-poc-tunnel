import { Request, Response } from 'express';
import { ResponseData } from '../types/response.type';
import { httpResponse } from '../utils/response.util';
import { disclosureAcdc } from '../modules/signifyApi';

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
    const response: ResponseData<any> = {
      statusCode: 409,
      success: true,
      data: null,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    };
    httpResponse(res, response);
  }
}

export { disclosureAcdcApi };
