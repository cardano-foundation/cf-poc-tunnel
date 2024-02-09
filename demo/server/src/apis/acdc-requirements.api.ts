import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";
import { config } from "../config";

function getAcdcRequirements(_: Request, res: Response) {
  const acdcRequirements = {
    user: {
      "-s": config.qviSchemaSaid,
    },
  };
  const response: ResponseData<any> = {
    statusCode: 200,
    success: true,
    data: acdcRequirements,
  };
  httpResponse(res, response);
}

export { getAcdcRequirements };
