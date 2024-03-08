import { NextFunction, Request, Response } from "express";
import { dataSource } from "../database";
import { Session } from "../database/entities/session";

export const verifySession = (validRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const aid = req.headers["signify-resource"] as string;
        const sessionRepository = dataSource.getRepository(Session);
        const session = await sessionRepository.findOne({
            where: {
                aid,
            }
        });
        if (!session) {
            return res.status(401).send("User is not logged in");
        }
        if (!validRoles.includes(session.role)) {
            return res.status(401).send(`${session.role} can't access this resource`);
        }
        const currentTimestamp = new Date().getTime();
        const sessionExpireTime = new Date(session.validUntil).getTime();
        if (sessionExpireTime < currentTimestamp) {
            await sessionRepository.delete(session.id);
            return res.status(401).send("Session timed out, please login again!");
        } else {
            res.locals.session = session;
        }
        return next();
    }
  }
