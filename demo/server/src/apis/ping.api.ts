import { NextFunction, Request, Response } from "express";

export function ping(_: Request, res: Response, next: NextFunction) {
  res.locals.responseBody = {
    message: `Welcome, your Legal Entity Identifier is ${res.locals.session.lei}`,
  };
  res.set("Content-Type", "application/json");
  res.status(200);
  next();
}
