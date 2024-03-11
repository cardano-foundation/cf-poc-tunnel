import {
  Controller,
  Encrypter,
  Operation,
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
import { Session } from "../database/entities/session";
import { dataSource } from "../database";

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
  return signifyClient.oobis().get(name, role);
};

export const resolveOOBI = async (url: string): Promise<Operation<unknown>> => {
  const oobiOperation = await signifyClient.oobis().resolve(url);
  return waitAndGetDoneOp(oobiOperation, 15000, 250);
};

export const waitAndGetDoneOp = async <T>(
  op: Operation<T>,
  timeout: number,
  interval: number,
): Promise<Operation<T>> => {
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
): Promise<void> => {
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
  if (!(await resolveOOBI(schemaUrl)).done) {
    throw new Error(
      "Failed to resolve schema OOBI, endpoint most likely incorrect.",
    );
  }

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
      new URL(config.endpoint).hostname,
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

export const getRemoteVerfer = async (aid: string): Promise<Verfer> => {
  const client = await getSignifyClient();
  const pubKey = (await client.keyStates().get(aid))[0].k[0];
  return new Verfer({ qb64: pubKey });
};

export const getRemoteEncrypter = async (aid: string): Promise<Encrypter> => {
  const client = await getSignifyClient();
  const pubKey = (await client.keyStates().get(aid))[0].k[0];
  return new Encrypter({}, new Verfer({ qb64: pubKey }).qb64b);
};

export const getExnMessageBySaid = async (said: string): Promise<any> => {
  const client = await getSignifyClient();
  return client.exchanges().get(said);
};

export const getCredentials = async (filters?: any): Promise<any> => {
  const client = await getSignifyClient();
  if (filters) {
    return client.credentials().list({
      filter: filters,
    });
  }
  return client.credentials().list();
};

export const getUnhandledTunnelRequestNotifications = async () => {
  const client = await getSignifyClient();
  const notificationsList = await client.notifications().list(0, 100); //TODO: Add pagination later. Use fixed range at the moment
  const unreadNotificationsList = notificationsList.notes
    .filter(note => !note.r && note.a.r === "/tunnel/server/request");
  const notificationsData = await Promise.all(unreadNotificationsList.map(async note => {
    const exchange = await client.exchanges().get(note.a.d);
    return {
      notiId: note.i,
      notiSaid: note.a.d,
      exchange,
    }
  }));
  return notificationsData;
}

export const getUnhandledGrantNotifications = async (sender: string) => {
  const client = await getSignifyClient();
  const notificationsList = await client.notifications().list(0, 100); //TODO: Add pagination later. Use fixed range at the moment
  const unreadNotificationsList = notificationsList.notes
    .filter(note => !note.r && note.a.r === "/exn/ipex/grant");
  const notificationsData = await Promise.all(unreadNotificationsList.map(async note => {
    const exchange = await client.exchanges().get(note.a.d);
    return {
      notiId: note.i,
      notiSaid: note.a.d,
      exchange,
    }
  }));
  return notificationsData.filter(notification => notification.exchange.exn.i === sender && notification.exchange.exn.e.acdc);
}

export const admitIpex = async (
  grantSaid: string,
  signifyName: string,
  recpAid: string
)=> {
  const client = await getSignifyClient();
  const dt = new Date().toISOString().replace("Z", "000+00:00");
  const [admit, sigs, aend] = await client
    .ipex()
    .admit(signifyName, "", grantSaid, dt);
  await client
    .ipex()
    .submitAdmit(signifyName, admit, sigs, aend, [recpAid]);
}

export const deleteNotification = async (id: string) => {
  const client = await getSignifyClient();
  return client.notifications().delete(id);
}

export const handleTunnelRequestNotifications = async () => {
  const tunnelRequestNotificationsList = await getUnhandledTunnelRequestNotifications();
  const tunnelAidNotifications = tunnelRequestNotificationsList.filter(notification => notification.exchange.exn.a.sid);
  if (!tunnelAidNotifications.length) {
    return;
  }

  for (const tunnelAidNotification of tunnelAidNotifications) {
    const tunnelAid = tunnelAidNotification.exchange.exn.a.sid;
    const idWalletAid = tunnelAidNotification.exchange.exn.i;
    const acdcNotifications = await getUnhandledGrantNotifications(idWalletAid);
    if (!acdcNotifications.length) {
      console.log(`AID ${idWalletAid} has not completed the ACDC disclosure yet.`);
      continue;
    }

    // @TODO - foconnor: For now, just get the latest disclosure from that wallet - this needs work long term.
    const latestGrant = acdcNotifications.reduce((latestObj, currentObj) => {
      const maxDateTime = latestObj.exchange.exn.a.dt;
      const currentDateTime = currentObj.exchange.exn.a.dt;
      return currentDateTime > maxDateTime ? currentObj : latestObj;
    });
    if (
      new Date(latestGrant.exchange.exn.a.dt).getTime() <
      new Date().getTime() - 60000
    ) {
      console.log(`Latest ACDC disclosure from ${tunnelAidNotification.exchange.exn.i} is too old`);
      continue;
    }
  
    const acdcSchema = latestGrant.exchange.exn.e.acdc.s;
    const session = new Session();
    if (acdcSchema === config.qviSchemaSaid) {
      session.role = "user";
      session.lei = latestGrant.exchange.exn.e.acdc.a.LEI;
    } else {
      continue;
    }
    session.aid = tunnelAid;
    const currentTime = new Date().getTime();
    const sessionDuration = 5 * 60000; //5 mins
    session.validUntil = new Date(currentTime + sessionDuration);
    const entityManager = dataSource.manager;
    await entityManager.save(session);
  
    /**admit and delete the notification */
    const exnData = latestGrant.exchange.exn;
    await admitIpex(latestGrant.notiSaid, config.signifyName, exnData.i);
    await deleteNotification(latestGrant.notiId);
    await deleteNotification(tunnelAidNotification.notiId);
  }
}