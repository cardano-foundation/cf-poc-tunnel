import { NextFunction, Request, Response } from "express";

export function ping(_: Request, res: Response, next: NextFunction) {
  res.locals.responseBody = {
    data: "pong",
  };
  res.set("Content-Type", "application/json");
  res.status(200);
  next();
}
