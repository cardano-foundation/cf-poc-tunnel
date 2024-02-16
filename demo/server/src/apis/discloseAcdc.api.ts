import { Request, Response } from "express";
import { disclosureAcdc } from "../services/signifyService";
import { ERROR_ACDC_NOT_FOUND } from "../services/signifyService.types";

export async function discloseAcdc(req: Request, res: Response) {
  try {
    await disclosureAcdc(
      req.body.aidPrefix,
      req.body.schemaSaid,
      req.body.issuer,
    );
    return res.status(200).send();
  } catch (error) {
    if (error instanceof Error && error["message"] === ERROR_ACDC_NOT_FOUND) {
      return res.status(409).send(error["message"]);
    }
    return res.status(500).send(JSON.stringify(error, Object.getOwnPropertyNames(error)));
  }
}
