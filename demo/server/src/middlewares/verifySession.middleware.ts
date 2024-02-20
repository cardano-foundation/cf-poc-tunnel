import { Request, Response } from "express";
import { dataSource } from "../database";
import { Session } from "../database/entities/session";

export const verifySession = async (req: Request, res: Response, next) => {
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
    const currentTimestamp = new Date().getTime();
    const sessionExpireTime = new Date(session.validUntil).getTime();
    if (sessionExpireTime < currentTimestamp) {
        await sessionRepository.delete(session.id);
        return res.status(401).send('Session timed out');
    }
    next();
  }
