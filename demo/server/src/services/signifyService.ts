import {
  Controller,
  Encrypter,
  Serder,
  SignifyClient,
  ready as signifyReady,
  Tier,
  Verfer,
} from "signify-ts";
import { Aid, ERROR_ACDC_NOT_FOUND } from "./signifyService.types";
import { config } from "../config";
import { log } from "../utils/log";
import { v4 as uuidv4 } from "uuid";

const { keriaUrl, keriaBootUrl } = config;
let signifyClient: SignifyClient;

export const initSignify = async () => {
  await signifyReady();
  signifyClient = new SignifyClient(
    keriaUrl,
    config.bran,
    Tier.low,
    keriaBootUrl,
  );
  try {
    await signifyClient.connect();
  } catch (err) {
    await signifyClient.boot();
    await signifyClient.connect();
  }
  return signifyClient;
};

export const getSignifyClient = async () => {
  if (!signifyClient) {
    return initSignify();
  }
  return signifyClient;
};

export const getIdentifierByName = async (name: string): Promise<Aid> => {
  const identifier = await signifyClient.identifiers().get(name);
  return identifier;
};

export const createIdentifier = async (name: string) => {
  const op: any = await signifyClient.identifiers().create(name);
  await op.op();
  await signifyClient
    .identifiers()
    .addEndRole(name, "agent", signifyClient.agent!.pre);
  const aid = await getIdentifierByName(name);
  return aid;
};

export const getOOBIs = async (name: string, role: string) => {
  const oobisResult = await signifyClient.oobis().get(name, role);
  return oobisResult;
};

export const resolveOOBI = async (url: string) => {
  let oobiOperation = await signifyClient.oobis().resolve(url);
  oobiOperation = await waitAndGetDoneOp(oobiOperation, 15000, 250);
  return oobiOperation;
};

export const waitAndGetDoneOp = async (
  op: any,
  timeout: number,
  interval: number,
) => {
  const startTime = new Date().getTime();
  while (!op.done && new Date().getTime() < startTime + timeout) {
    op = await signifyClient.operations().get(op.name);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return op;
};

export const createRegistry = async (name: string) => {
  const result = await signifyClient
    .registries()
    .create({ name, registryName: "domainRgk" });
  await result.op();
  const registries = await signifyClient.registries().list(name);
  return registries[0].regk;
};

export const issueDomainCredential = async (
  issuer: string,
  regk: string,
  schemaSAID: string,
  holder: string,
  domain: string,
) => {
  const vcdata = {
    domain,
  };
  try {
    const result = await signifyClient.credentials().issue({
      issuerName: issuer,
      registryId: regk,
      schemaId: schemaSAID,
      recipient: holder,
      data: vcdata,
    });
    await waitAndGetDoneOp(result.op, 15000, 250);
    const dateTime = new Date().toISOString().replace("Z", "000+00:00");

    const [grant, gsigs, gend] = await signifyClient.ipex().grant({
      senderName: issuer,
      acdc: result.acdc,
      anc: result.anc,
      iss: result.iss,
      recipient: holder,
      datetime: dateTime,
    });
    await signifyClient
      .exchanges()
      .sendFromEvents(issuer, "credential", grant, gsigs, gend, [holder]);
  } catch (error) {
    log(error);
  }
};

const getServerAcdc = async (
  owner: string,
  schemaSaid?: string,
  issuer?: string,
) => {
  return (
    await signifyClient.credentials().list({
      filter: {
        ...(schemaSaid
          ? { "-s": schemaSaid }
          : { "-s": config.domainSchemaSaid }),
        ...(issuer ? { "-i": issuer } : {}),
        "-a-i": owner,
      },
    })
  )[0];
};

export const disclosureAcdc = async (
  verifierPrefix: string,
  schemaSaid?: string,
  issuer?: string,
) => {
  const identifier = await getIdentifierByName(config.signifyName);
  const acdc = await getServerAcdc(identifier.prefix, schemaSaid, issuer);
  if (!acdc) {
    throw new Error(ERROR_ACDC_NOT_FOUND);
  }
  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant2, gsigs2, gend2] = await signifyClient.ipex().grant({
    senderName: config.signifyName,
    recipient: verifierPrefix,
    acdc: new Serder(acdc.sad),
    anc: new Serder(acdc.anc),
    iss: new Serder(acdc.iss),
    acdcAttachment: acdc.atc,
    ancAttachment: acdc.ancatc,
    issAttachment: acdc.issAtc,
    datetime,
  });
  await signifyClient
    .exchanges()
    .sendFromEvents(config.signifyName, "presentation", grant2, gsigs2, gend2, [
      verifierPrefix,
    ]);
  return acdc;
};

export const initKeri = async () => {
  const mainAidName = config.signifyName;
  const schemaSaid = config.domainSchemaSaid;
  let identifier = await getIdentifierByName(mainAidName).catch(() => null);
  if (!identifier) {
    identifier = await createIdentifier(mainAidName);
  }
  const oobi = await getOOBIs(mainAidName, "agent");
  // For the development purpose, the endpoint needs to be accessible from keria
  const schemaUrl = config.endpoint + "/oobi/" + schemaSaid;
  await resolveOOBI(schemaUrl);

  let credDomain = await getServerAcdc(identifier.prefix, schemaSaid);

  if (!credDomain) {
    const issuerMainAcdcName = uuidv4();
    await createIdentifier(issuerMainAcdcName);
    const keriRegistryRegk = await createRegistry(issuerMainAcdcName);
    await issueDomainCredential(
      issuerMainAcdcName,
      keriRegistryRegk,
      schemaSaid,
      identifier.prefix,
      config.endpoint,
    );
    credDomain = await getServerAcdc(identifier.prefix, schemaSaid);
  }

  return { identifier, oobi, credDomain };
};

export const getKeyManager = async (aid: Aid) => {
  const client = await getSignifyClient();
  return client.manager?.get(aid);
};

export const getServerSignifyController = async (): Promise<Controller> => {
  const client = await getSignifyClient();
  return client.controller;
};

export const getRemoteVerfer = async (aid: string) => {
  const client = await getSignifyClient();
  const pubKey = (await client.keyStates().get(aid))[0].k[0];
  return new Verfer({ qb64: pubKey });
}

export const getRemoteEncrypter = async (aid: string) => {
  const client = await getSignifyClient();
  const pubKey = (await client.keyStates().get(aid))[0].k[0];
  return new Encrypter({}, (new Verfer({ qb64: pubKey })).qb64b);
}
