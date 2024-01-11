import { Request, Response } from "express";
import { ResponseData } from "../types/response.type";
import { httpResponse } from "../utils/response.util";

async function resolveOOBI(req: Request, res: Response) {
  const response: ResponseData<string> = {
    statusCode: 200,
    success: true,
    data: "pong",
  };
  httpResponse(res, response);
}

export { resolveOOBI };
