import { Request, Response } from "express";
import { getServerAuthn, getIdentifierByName, getSigner } from "../modules/signifyApi";
import { config } from "../config";

const encoder = new TextEncoder();
export const signResponse = async (req: Request, res: Response, next) => {
    const serverAID = await getIdentifierByName(config.signifyName);
    const signer = await getSigner(serverAID);
    const authn = await getServerAuthn();
    // Intercept the response
    const originalSend = res.send;
    res.send = function (body) {
        const originalHeaders = res.getHeaders();
        const headers = new Headers(originalHeaders);
        headers.set("aid", JSON.stringify({ aid: serverAID }));
        const signedBody = signer.sign(encoder.encode(JSON.stringify(body)));
        if (typeof body === "string") {
            body = JSON.parse(body);
        }
        body.data = { signedBody, data: body.data };
        const signedHeaders = authn?.sign(headers, req.method, req.path.split('?')[0]);
        signedHeaders?.forEach((value, key) => {
            console.log({ key, value })
            res.set(key, value);
        });
        originalSend.call(this, JSON.stringify(body));
    };
    next();
  }
