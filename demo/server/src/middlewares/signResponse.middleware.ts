import { Request, Response } from "express";
import { getServerAuthn, getIdentifierByName, getServerSignifyController } from "../modules/signifyApi";
import { config } from "../config";

export const signResponse = async (req: Request, res: Response, next) => {
    const serverAID = await getIdentifierByName(config.signifyName);
    const authn = await getServerAuthn();
    const signifyController = await getServerSignifyController();
    // Intercept the response
    const originalSend = res.send;
    res.send = function (body) {
        const originalHeaders = res.getHeaders();
        const headers = new Headers(originalHeaders);
        headers.set("aid", JSON.stringify({ aid: serverAID }));
        headers.set('Signify-Resource', signifyController.pre);
        headers.set(
            'Signify-Timestamp',
            new Date().toISOString().replace('Z', '000+00:00')
        );
        headers.set('Content-Type', 'application/json');
        if (typeof body === "string") {
            headers.set('Content-Length', String(body.length));
        } else {
            headers.set('Content-Length', String(JSON.stringify(body.length)));
        }
        const signedHeaders = authn?.sign(headers, req.method, req.path.split('?')[0]);
        signedHeaders?.forEach((value, key) => {
            console.log({ key, value })
            res.set(key, value);
        });
        originalSend.call(this, JSON.stringify(body));
    };
    next();
  }
