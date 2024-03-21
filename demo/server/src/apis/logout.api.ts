import { NextFunction, Request, Response } from "express";
import { dataSource } from "../database";
import { Session } from "../database/entities/session";

export async function logout(_: Request, res: Response, next: NextFunction) {
  const sessionRepository = dataSource.getRepository(Session);
  await sessionRepository.delete(res.locals.session.id);
  res.status(204);
  next();
}
