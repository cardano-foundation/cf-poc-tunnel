import { Request, Response } from "express";
import { SCHEMAS } from "../schemas";

export async function getSchema(req: Request, res: Response) {
  const { id } = req.params;
  const data = SCHEMAS.get(id);
  if (!data) {
    return res.status(404).send("Schema for given SAID not found");
  }
  return res.send(data);
}
