import { Request, Response } from "express";
import { config } from "../config";

export function getAcdcRequirements(_: Request, res: Response) {
  const acdcRequirements = {
    user: {
      "-s": config.qviSchemaSaid,
    },
  };
  res.status(200).send(acdcRequirements);
}
