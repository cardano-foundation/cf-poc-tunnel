import { Request, Response } from "express";
import { config } from '../config';

export const verifySession = async (req: Request, res: Response, next) => {
    if (!req.session.loginInfo) {
        return res.status(401).send('The AID is not logged in yet');
    }
    const currentTimestamp = new Date().getTime();
    const sessionExpireTime = req.session.loginInfo.timestamp + config.sessionTimeout;
    if (sessionExpireTime < currentTimestamp) {
        req.session.destroy();
        return res.status(401).send('Session timed out');
    }
    next();
  }
