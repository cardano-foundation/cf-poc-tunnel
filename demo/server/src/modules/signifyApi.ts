import { SignifyClient, ready as signifyReady, Tier } from 'signify-ts';
import { config } from '../config';
import { log } from '../log';
import { v4 as uuidv4 } from 'uuid';

const { keriaUrl, keriaBootUrl } = config;
export let signifyClient: SignifyClient;

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

export const getIdentifierByName = async (name: string) => {
  try {
    const identifier = await signifyClient.identifiers().get(name);
    return identifier;
  } catch (error) {
    throw error;
  }
};

export const createIdentifier = async (name: string) => {
  const op: any = await signifyClient.identifiers().create(name);
  await op.op();
  await signifyClient
    .identifiers()
    .addEndRole(name, 'agent', signifyClient.agent!.pre);
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
    .create({ name, registryName: 'domainRgk' });
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
    const dateTime = new Date().toISOString().replace('Z', '000+00:00');

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
      .sendFromEvents(issuer, 'credential', grant, gsigs, gend, [holder]);
  } catch (error) {
    log(error);
  }
};

export const initKeri = async (schemaSaid: string, issuerName: string) => {
  let identifier = await getIdentifierByName(issuerName).catch(() => null);
  if (!identifier) {
    identifier = await createIdentifier(issuerName);
  }
  // For the development purpose, the endpoint needs to be accessible from keria
  const schemaUrl = config.endpoint + '/oobi/' + schemaSaid;
  await resolveOOBI(schemaUrl);
  const oobi = await getOOBIs(issuerName, 'agent');
  const keriRegistryRegk = await createRegistry(issuerName);
  const holderAcdc = uuidv4();
  const holder = await createIdentifier(holderAcdc);
  const oobiHolder = await getOOBIs(holderAcdc, 'agent');
  await resolveOOBI(oobiHolder.oobis[0]);
  await issueDomainCredential(
    issuerName,
    keriRegistryRegk,
    schemaSaid,
    holder.prefix,
    config.endpoint,
  );
  return { identifier, oobi, keriRegistryRegk };
};
