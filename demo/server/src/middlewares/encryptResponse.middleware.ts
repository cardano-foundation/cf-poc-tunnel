import { Request, Response } from "express";
import { getIdentifierByName, getSignifyClient } from "../modules/signifyApi";
import { config } from "../config";

const encoder = new TextEncoder();
export const encryptResponse = async (_: Request, res: Response, next) => {
    const serverAID = await getIdentifierByName(config.signifyName);
    const signifyClient = await getSignifyClient();
    const signer = await signifyClient.manager?.get(serverAID);
    // Intercept the response
    const originalSend = res.send;
    res.send = function (body) {
        const originalHeaders = res.getHeaders();
        const headers = new Headers(originalHeaders);
        const encryptedBody = signer.sign(encoder.encode(body));
        if (typeof body === "string") {
            body = JSON.parse(body);
        }
        body.data = encryptedBody;
        const signedHeaders = signifyClient.authn?.sign(headers, "POST", "/");
        signedHeaders?.forEach((value, key) => {
            res.set(key, value);
        });
        originalSend.call(this, JSON.stringify(body));
    };
  
    next();
  }
