import { Request, Response } from "express";
import { getIdentifierByName, getSigner } from "../modules/signifyApi";
import { config } from "../config";
import { Authenticater } from "signify-ts";

export const verifyRequest = async (req: Request, res: Response, next) => {
  const serverAID = await getIdentifierByName(config.signifyName);

  const signer = await getSigner(serverAID);

  const authenticator = new Authenticater(
    signer.signers[0],
    signer.signers[0].verfer,
  );

  try {
    console.log("verifying...");
    const verification = authenticator?.verify(
      new Headers(req.headers),
      req.method,
      req.path.split("?")[0],
    );
    console.log({ verification });
    if (!verification) {
      res.status(400).send("Request was not signed correctly");
    } else {
      next();
    }
  } catch (error) {
    console.log({ error });
    res.status(500).send((error as Error).message);
  }
};
