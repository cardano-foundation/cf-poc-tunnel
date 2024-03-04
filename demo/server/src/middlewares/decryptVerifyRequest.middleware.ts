import { NextFunction, Request, Response } from "express";
import { Authenticater, Cigar, Cipher, Decrypter } from "signify-ts";
import { config } from "../config";
import {
  getIdentifierByName,
  getRemoteVerfer,
  getKeyManager,
} from "../services/signifyService";
export var incomingRequestsCache = new Map();

export async function decryptVerifyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const reqAid = req.get("Signify-Resource");
  if (!reqAid) {
    return res.status(400).send("Missing Signify-Resource header");
  }

  const reqDateTime = req.get("Signify-Timestamp");
  if (!reqDateTime) {
    return res.status(400).send("Missing Signify-Timestamp header");
  }

  // For now this isn't full protection - we need to verify that the request is unique.
  // Follow up story will cover this.
  if (Date.now() - new Date(reqDateTime).getTime() > 1000) {
    return res.status(409).send("Signify-Timestamp too old");
  }
  let requestUniqueId = req.get("Signature");
  if (req.body?.sig) {
    requestUniqueId = requestUniqueId.concat(req.body.sig);
  }

  if (incomingRequestsCache.get(requestUniqueId)) {
    return res
      .status(409)
      .send("Request replay detected");
  };
  const reqVerfer = await getRemoteVerfer(reqAid);
  const serverAid = await getIdentifierByName(config.signifyName);
  const keyManager = await getKeyManager(serverAid);

  const authenticator = new Authenticater(
    keyManager.signers[0], // Not used here, we only need to verify so just inject our own.
    reqVerfer,
  );

  try {
    if (
      !authenticator.verify(
        new Headers(JSON.parse(JSON.stringify(req.headers))),
        req.method.toUpperCase(),
        req.path.split("?")[0],
      )
    ) {
      return res
        .status(400)
        .send("Signature headers not in the correct format");
    }
  } catch (error) {
    console.warn(error);
    // @TODO - foconnor: Catch this more specifically just in case.
    return res
      .status(400)
      .send("Signature header not valid for given Signify-Resource");
  }
  if (req.body) {
    if (!req.body.sig || !req.body.cipher) {
      return res
        .status(400)
        .send("Body must contain a valid ESSR ciphertext and signature");
    }
    const signature = new Cigar({ qb64: req.body.sig }); // @TODO - foconnor: Will crash if not valid CESR - handle.
    if (
      !reqVerfer.verify(
        signature.raw,
        JSON.stringify({
          src: reqAid,
          dest: serverAid.prefix,
          datetime: reqDateTime,
          cipher: req.body.cipher,
        }),
      )
    ) {
      return res
        .status(400)
        .send("Signature of body is not valid for given Signify-Resource");
    }

    const cipher = new Cipher({ qb64: req.body.cipher }); // @TODO - foconnor: Same here.
    const decrypter: Decrypter = new Decrypter({}, keyManager.signers[0].qb64b);
    const decrypted = JSON.parse(
      Buffer.from(decrypter.decrypt(null, cipher).raw).toString(),
    );

    if (!(decrypted.src && decrypted.src === reqAid)) {
      return res
        .status(400)
        .send("Invalid src identifier in plaintext of cipher");
    }

    req.body = decrypted.data;
  }

  /**Set the request in the cache then remove the signature from the cache after 1 second*/
  incomingRequestsCache.set(requestUniqueId, true);
  setTimeout(() => incomingRequestsCache.delete(requestUniqueId), 1000);

  return next();
}
