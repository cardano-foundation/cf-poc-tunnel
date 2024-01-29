import { Request, Response } from "express";
import { getServerAuthn } from "../modules/signifyApi";

export const verifyRequest = async (req: Request, res: Response, next) => {
    const authn = await getServerAuthn();
    try {
        const verification = authn?.verify(
            new Headers(req.headers),
            req.method,
            req.path.split('?')[0],
        )
        console.log({ verification });
        if (!verification) {
            res.status(500).send("error");
        }            
        next();
    } catch (error) {
        console.log({ error });
        res.status(500).send("error");
    }
  }
