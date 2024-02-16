import { Request, Response } from "express";
import { Authenticater, Cipher, Matter, MtrDex, b } from "signify-ts";
import { getIdentifierByName, getRemoteEncrypter, getKeyManager } from "../services/signifyService";
import { config } from "../config";
import { EssrBody } from "../types";

/**
 * This middleware will sign any headers, the path and query params (pending in Signify).
 * It will also encrypt and sign the body in accordance with KERI ESSR.
 * 
 * A future interaction could try to encrypt the header/path/query params with ESSR too,
 * but this would actually be better done at a transport layer within the browser rather than an extension.
 */
export async function encryptSignResponse(req: Request, res: Response) {
  const reqAid = req.get("Signify-Resource");
  if (!reqAid) {
    // Shouldn't happen if decrypt middleware 
    return res.status(400).send("Missing Signify-Resource header");
  }
  
  const serverAid = await getIdentifierByName(config.signifyName);
  const keyManager = await getKeyManager(serverAid);

  // SIGN HEADERS
  const authenticator = new Authenticater(
    keyManager.signers[0],
    keyManager.signers[0].verfer,
  );

  const originalHeaders = JSON.parse(JSON.stringify(res.getHeaders()));
  const headers = new Headers(originalHeaders);

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  headers.set("Signify-Resource", serverAid.prefix);
  headers.set("Signify-Timestamp", datetime);
  const signedHeaders = authenticator?.sign(
    headers,
    req.method,
    req.path.split("?")[0],
  );
  signedHeaders?.forEach((value, key) => {
    res.set(key, value);
  });
  
  // SIGN BODY
  if (res.locals.responseBody) {
    const encrypter = await getRemoteEncrypter(reqAid);
    const toEncrypt: Uint8Array = Buffer.from(JSON.stringify({
      src: serverAid.prefix,
      data: res.locals.responseBody,
    }));
    const cipher: Cipher = encrypter.encrypt(null, new Matter({ raw: toEncrypt, code: LEAD_CODES.get(toEncrypt.length % 3) }));

    // src, datetime are both already in the headers, and dest is already known by the receiver for this (src, dest) interaction.
    const essrBody: EssrBody = {
      sig: keyManager.signers[0].sign(b(JSON.stringify({
        src: serverAid.prefix,
        dest: reqAid,
        datetime,
        cipher: cipher.qb64,
      }))).qb64,
      cipher: cipher.qb64,
    }
    
    return res.send(essrBody);
  }
  
  return res.send();
};

const LEAD_CODES = new Map<number, string>([
  [0, MtrDex.StrB64_L0],
  [1, MtrDex.StrB64_L1],
  [2, MtrDex.StrB64_L2],
]);
