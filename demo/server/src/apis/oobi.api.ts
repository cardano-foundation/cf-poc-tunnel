import { Request, Response } from "express";
import { getOOBIs, resolveOOBI } from "../services/signifyService";
import { config } from "../config";

export async function resolveClientOOBI(req: Request, res: Response) {
  const resolveOobiResult = await resolveOOBI(req.body.oobiUrl);
  res.status(200).send(resolveOobiResult);
}

export async function getServerOOBI(_: Request, res: Response) {
  const oobisResult = await getOOBIs(config.signifyName, "agent");
  res.status(200).send(oobisResult);
}
