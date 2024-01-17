import { SignifyClient, ready as signifyReady, Tier } from "signify-ts";
import { config } from "../config";
import { Aid } from "../types/signifyApi.types";

const { keriaUrl, keriaBootUrl } = config;
let signifyClient: SignifyClient;

export const initSignify = async () => {
    await signifyReady();
    signifyClient = new SignifyClient(
      keriaUrl, 
      config.bran, 
      Tier.low, 
      keriaBootUrl
    );
    try {
      await signifyClient.connect();
    } catch (err) {
      await signifyClient.boot();
      await signifyClient.connect();
    }
    return signifyClient;
}

export const getSignifyClient = async () => {
  if (!signifyClient) {
    return initSignify();
  }
  return signifyClient;
}

export const getIdentifierByName = async(name: string): Promise<Aid> => {
  try {
    const identifier = await signifyClient.identifiers().get(name);
    return identifier;    
  } catch (error) {
    throw error;
  }
}

export const createIdentifier = async (name: string) => {
    const op: any = await signifyClient.identifiers().create(name);
      await op.op();
      await signifyClient
      .identifiers()
      .addEndRole(
        name,
        "agent",
        signifyClient.agent!.pre
      );
}

export const getOOBIs = async (name: string, role: string) => {
    const oobisResult = await signifyClient.oobis().get(name, role);
    return oobisResult;
}

export const resolveOOBI = async (url: string) => {
  let oobiOperation = await signifyClient.oobis().resolve(url);
  oobiOperation = await waitAndGetDoneOp(oobiOperation, 15000, 250) 
  return oobiOperation;
}

export const waitAndGetDoneOp = async(
  op: any,
  timeout: number,
  interval: number
) => {
  const startTime = new Date().getTime();
  while (!op.done && new Date().getTime() < startTime + timeout) {
    op = await signifyClient.operations().get(op.name);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return op;
}