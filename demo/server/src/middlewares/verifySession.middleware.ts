import { Request, Response } from "express";
import { dataSource } from "../database";
import { Session } from "../database/entities/session";

export const verifySession = (validRoles: string[]) => {
    return async (req: Request, res: Response, next) => {
        const aid = req.headers['signify-resource'];
        const sessionRepository = dataSource.getRepository(Session);
        const session = await sessionRepository.findOne({
            where: {
                aid,
            }
        });
        if (!session) {
            return res.status(401).send('The AID is not logged in yet');
        }
        if (!validRoles.includes(session.role)) {
            return res.status(401).send(`${session.role} can't access this resource`);
        }
        const currentTimestamp = new Date().getTime();
        const sessionExpireTime = new Date(session.validUntil).getTime();
        if (sessionExpireTime < currentTimestamp) {
            await sessionRepository.delete(session.id);
            return res.status(401).send('Session timed out');
        } else {
            res.locals = {
                role: session.role,
                userAid: session.aid,
            }
        }
        next();
    }
  }
