import { Request, Response } from 'express';
import { getIdentifierByName, getSigner } from '../modules/signifyApi';
import { config } from '../config';
import { Authenticater } from 'signify-ts';

export const signResponse = async (req: Request, res: Response, next) => {
  const serverAID = await getIdentifierByName(config.signifyName);

  const signer = await getSigner(serverAID);

  const authenticator = new Authenticater(
    signer.signers[0],
    signer.signers[0].verfer,
  );

  // Intercept the response
  const originalSend = res.send;
  res.send = function (body) {
    const originalHeaders = res.getHeaders();
    const headers = new Headers(originalHeaders);
    headers.set('Signify-Resource', serverAID.prefix);
    headers.set(
      'Signify-Timestamp',
      new Date().toISOString().replace('Z', '000+00:00'),
    );
    headers.set('Content-Type', 'application/json');
    if (typeof body === 'string') {
      headers.set('Content-Length', String(body.length));
    } else {
      headers.set('Content-Length', String(JSON.stringify(body.length)));
    }
    const signedHeaders = authenticator?.sign(
      headers,
      req.method,
      req.path.split('?')[0],
    );
    signedHeaders?.forEach((value, key) => {
      res.set(key, value);
    });
    originalSend.call(this, JSON.stringify(body));
  };
  next();
};
