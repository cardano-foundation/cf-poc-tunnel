import { SignifyClient, ready as signifyReady, Tier } from "signify-ts";

export let signifyClient;

export const initSignify = async (bran: string) => {
    await signifyReady();
    signifyClient = new SignifyClient(
      'https://dev.keria.cf-keripy.metadata.dev.cf-deployments.org', 
      bran, 
      Tier.low, 
      'https://dev.keria-boot.cf-keripy.metadata.dev.cf-deployments.org'
    );
    try {
      await signifyClient.connect();
    } catch (err) {
      await signifyClient.boot();
      await signifyClient.connect();
    }
    return signifyClient;
}

export const getIdentifierByName = async(name: string) => {
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