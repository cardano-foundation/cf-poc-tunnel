import { uid } from "uid";
import { Authenticater, b, Cipher, Matter, Cigar, Decrypter } from "signify-ts";
import { signifyApiInstance as signifyApi } from "@src/core/modules/signifyApi";
import {
  convertURLImageToBase64,
  failure,
  failureExt,
  serializeHeaders,
  success,
  successExt,
} from "@src/utils";
import { Logger } from "@src/utils/logger";
import { LEAD_CODES } from "@src/core/modules/signifyApi.types";
import {
  EssrBody,
  ExtensionMessage,
  ResponseData,
  ExtensionMessageType,
} from "@src/core/background/types";
import { Session } from "@src/ui/pages/popup/sessionList/sessionList";

export enum LocalStorageKeys {
  SESSIONS = "sessions",
  BRAN = "bran",
  WALLET_CONNECTION_IDW_AID = "walletConnectionIdwAid",
  WALLET_CONNECTION_TUNNEL_AID = "walletConnectionTunnelAid",
  WALLET_PONG_RECEIVED = "walletPongReceived",
}

export const IDW_COMMUNICATION_AID_NAME = "idw";

export const logger = new Logger();

const ENTERPRISE_SCHEMA_SAID = "EGjD1gCLi9ecZSZp9zevkgZGyEX_MbOdmhBFt4o0wvdb";

const signEncryptRequest = async (
  ourAidName: string,
  otherAidPrefix: string,
  path: string,
  method: string,
  body?: any,
): Promise<
  ResponseData<{
    signedHeaders: Headers;
    essrBody?: EssrBody;
  }>
> => {
  // @TODO - foconnor: Need a better short-hand way to return the result if it's not successful.
  const getAidResult = await signifyApi.getIdentifierByName(ourAidName);
  if (!getAidResult.success) {
    return getAidResult;
  }

  const ourAid = getAidResult.data;
  const getKeyManResult = await signifyApi.getKeyManager(ourAid);
  if (!getKeyManResult.success) {
    return getKeyManResult;
  }

  const authenticator = new Authenticater(
    getKeyManResult.data.signers[0],
    getKeyManResult.data.signers[0].verfer,
  );

  // For now we only sign the default Signify headers and not any extras.
  const headers = new Headers();
  headers.set("Signify-Resource", ourAid.prefix);
  await logger.addLog(
    `✅ Tunnel AID added to headers: ${JSON.stringify(
      {
        "Signify-Resource": ourAid.prefix,
      },
      null,
      2,
    )}`,
  );

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  headers.set("Signify-Timestamp", datetime);
  await logger.addLog(
    `✅ Timestamp added to headers: ${JSON.stringify(
      {
        "Signify-Timestamp": datetime,
      },
      null,
      2,
    )}`,
  );

  let signedHeaders;
  try {
    signedHeaders = authenticator.sign(headers, method, path);
    await logger.addLog(
      `✍️ Headers signed successfully by tunnel AID: ${ourAid.prefix}`,
    );
  } catch (e) {
    return {
      success: false,
      error: `Error while signing [${ourAidName}] headers ${JSON.stringify(
        headers,
      )}, method: ${method}, pathname: ${path}. Error: ${e}`,
    };
  }

  if (!body) {
    return success({ signedHeaders });
  }

  const getEncResult = await signifyApi.getRemoteEncrypter(otherAidPrefix);
  if (!getEncResult.success) {
    return getEncResult;
  }

  const toEncrypt: Uint8Array = Buffer.from(
    JSON.stringify({
      src: ourAid.prefix,
      data: body,
    }),
  );
  const cipher: Cipher = getEncResult.data.encrypt(
    null,
    new Matter({ raw: toEncrypt, code: LEAD_CODES.get(toEncrypt.length % 3) }),
  );

  // src, datetime are both already in the headers, and dest is already known by the receiver for this (src, dest) interaction.
  const essrBody: EssrBody = {
    sig: getKeyManResult.data.signers[0].sign(
      b(
        JSON.stringify({
          src: ourAid.prefix,
          dest: otherAidPrefix,
          datetime,
          cipher: cipher.qb64,
        }),
      ),
    ).qb64,
    cipher: cipher.qb64,
  };

  return success({ signedHeaders, essrBody });
};

const verifyDecryptResponse = async (
  ourAidName: string,
  otherAidPrefix: string,
  path: string,
  method: string,
  headers: Headers,
  body?: any,
): Promise<ResponseData<any>> => {
  const reqAid = headers.get("Signify-Resource");
  if (!reqAid) {
    return failure(new Error("Response missing Signify-Resource header"));
  }
  if (reqAid !== otherAidPrefix) {
    return failure(new Error("Received response with a mismatched server AID"));
  }

  const reqDateTime = headers.get("Signify-Timestamp");
  if (!reqDateTime) {
    return failure(new Error("Response missing Signify-Timestamp header"));
  }

  const getReqVerferResult = await signifyApi.getRemoveVerfer(reqAid);
  if (!getReqVerferResult.success) {
    return getReqVerferResult;
  }

  const getAidResult = await signifyApi.getIdentifierByName(ourAidName);
  if (!getAidResult.success) {
    return getAidResult;
  }
  const getKeyManResult = await signifyApi.getKeyManager(getAidResult.data);
  if (!getKeyManResult.success) {
    return getKeyManResult;
  }

  const authenticator = new Authenticater(
    getKeyManResult.data.signers[0], // Not used here, we only need to verify so just inject our own.
    getReqVerferResult.data,
  );

  try {
    if (!authenticator.verify(headers, method, path.split("?")[0])) {
      return failure(new Error("Signify headers not in the correct format"));
    }
  } catch (error) {
    console.warn(error);
    // @TODO - foconnor: Catch this more specifically just in case.
    return failure(
      new Error("Signature header not valid for given Signify-Resource"),
    );
  }

  if (body) {
    if (!body.sig || !body.cipher) {
      return failure(
        new Error("Body must contain a valid ESSR ciphertext and signature"),
      );
    }

    const signature = new Cigar({ qb64: body.sig }); // @TODO - foconnor: Will crash if not valid CESR - handle.
    if (
      !getReqVerferResult.data.verify(
        signature.raw,
        JSON.stringify({
          src: reqAid,
          dest: getAidResult.data.prefix,
          datetime: reqDateTime,
          cipher: body.cipher,
        }),
      )
    ) {
      return failure(
        new Error("Signature of body is not valid for given Signify-Resource"),
      );
    }

    const cipher = new Cipher({ qb64: body.cipher }); // @TODO - foconnor: Same here.
    const decrypter: Decrypter = new Decrypter(
      {},
      getKeyManResult.data.signers[0].qb64b,
    );
    const decrypted = JSON.parse(
      Buffer.from(decrypter.decrypt(null, cipher).raw).toString(),
    );

    if (!(decrypted.src && decrypted.src === reqAid)) {
      return failure(
        new Error("Invalid src identifier in plaintext of cipher"),
      );
    }

    return success(decrypted.data);
  }

  return success(undefined);
};

const isTrustedDomain = (
  acdc: any,
  expectedDomain: string,
  expectedAid: string,
): boolean => {
  return acdc?.a?.i === expectedAid && acdc?.a?.domain === expectedDomain;
};

const getServerACDC = async (said: string): Promise<ResponseData<any>> => {
  try {
    const keriExchangeResult = await signifyApi.getExchangeMessage(said);

    if (keriExchangeResult.data.exn?.e?.acdc !== undefined) {
      return success({
        acdc: keriExchangeResult.data.exn.e.acdc,
      });
    } else {
      return failure(new Error(`ACDC with wrong format`));
    }
  } catch (e) {
    return failure(e);
  }
};

const triggerServerToDiscloseACDC = async (
  aidPrefix: string,
  schemaSaid: string,
  serverEndpoint: string,
): Promise<ResponseData<void>> => {
  try {
    await fetch(`${serverEndpoint}/disclosure-acdc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aidPrefix,
        schemaSaid,
      }),
    });
    return success(undefined);
  } catch (e) {
    return failure(e);
  }
};

const waitForGrantToAppear = async (
  retryTimes: number,
): Promise<ResponseData<any>> => {
  try {
    let notes = [];
    let tries = 0;
    while (notes.length === 0) {
      if (tries > retryTimes) {
        throw new Error("Grant is not appearing");
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const fetchGrantsResult = await signifyApi.getUnreadIpexGrants();
      if (!fetchGrantsResult.success) {
        return failure(
          new Error(`Error trying to get the notifications from Keria`),
        );
      }
      notes = fetchGrantsResult.data.notes;
      tries++;
    }
    return success(notes);
  } catch (e) {
    return failure(e);
  }
};

const createSession = async (
  serverEndpoint: string,
): Promise<ResponseData<undefined>> => {
  const urlF = new URL(serverEndpoint);

  let response;
  try {
    response = await fetch(`${serverEndpoint}/oobi`);
    await logger.addLog(`✅ Received OOBI URL from ${serverEndpoint}/oobi`);
  } catch (e) {
    return failure(
      new Error(
        `Error getting OOBI URL from server: ${serverEndpoint}/oobi - trace ${e}`,
      ),
    );
  }

  const serverOobiUrl = (await response.json()).oobis[0];
  await logger.addLog(`⏳ Resolving OOBI URL...`);

  const resolveOobiResult = await signifyApi.resolveOOBI(serverOobiUrl);
  if (!resolveOobiResult.success) {
    return failure(
      new Error(
        `Error resolving server OOBI URL ${serverOobiUrl}: ${resolveOobiResult.error}`,
      ),
    );
  }
  await logger.addLog(`✅ OOBI resolved successfully`);

  const createIdentifierResult = await signifyApi.createIdentifier(
    urlF.hostname,
  );
  if (!createIdentifierResult.success) {
    return failure(
      new Error(
        `Error trying to create an AID with name ${urlF.hostname}: ${createIdentifierResult.error}`,
      ),
    );
  }

  const getOobiResult = await signifyApi.createOOBI(urlF.hostname);
  if (!getOobiResult.success) {
    return failure(
      new Error(
        `Error getting OOBI for identifier with name ${urlF.hostname}: ${getOobiResult.error}`,
      ),
    );
  }

  await logger.addLog(
    `✅ AID ${createIdentifierResult.data.serder.ked.i} created successfully for domain ${urlF.hostname}`,
  );

  try {
    await fetch(`${serverEndpoint}/resolve-oobi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oobiUrl: getOobiResult.data.oobis[0] }),
    });
  } catch (e) {
    return failure(
      new Error(`Error triggering server to resolve tunnel OOBI: ${e}`),
    );
  }

  await logger.addLog(
    `✅ Server has resolved the OOBI for domain ${urlF.hostname}`,
  );

  const disclosedAcdcResult = await triggerServerToDiscloseACDC(
    createIdentifierResult.data.serder.ked.i,
    ENTERPRISE_SCHEMA_SAID,
    serverEndpoint,
  );

  if (!disclosedAcdcResult.success) {
    return failure(
      new Error(
        `Error trigger server to disclose ACDC ${createIdentifierResult.data.serder.ked.i}
        and server schema ${ENTERPRISE_SCHEMA_SAID}. Error: ${disclosedAcdcResult.error}`,
      ),
    );
  }

  await logger.addLog(
    `✅ Server has disclosed the ACDC for the identifier ${createIdentifierResult.data.serder.ked.i}
      and schema ${ENTERPRISE_SCHEMA_SAID}`,
  );

  const notificationsResult = await waitForGrantToAppear(140);

  if (!notificationsResult.success) {
    return failure(new Error(`Error getting notifications from Keria`));
  }

  await logger.addLog(
    `✅ Notifications received from Keria: ${JSON.stringify(
      notificationsResult.data,
      null,
      2,
    )}`,
  );

  const said = notificationsResult.data[0].a.d;
  const notei = notificationsResult.data[0].i;
  const acdcResponse = await getServerACDC(said);

  if (!acdcResponse.success) {
    return failure(new Error(`Error getting ACDC from Keria`));
  }

  await logger.addLog(
    `✅ ACDC received from Keria: ${JSON.stringify(
      acdcResponse.data,
      null,
      2,
    )}`,
  );

  const acdc = acdcResponse.data.acdc;
  const serverAid = resolveOobiResult.data.response.i;

  const isTrusted = isTrustedDomain(
    acdc,
    new URL(serverEndpoint).hostname,
    serverAid,
  );

  await logger.addLog(
    `${isTrusted ? "✅" : "❌"}🌐 Domain is ${
      isTrusted ? "" : "not"
    } fully trusted: ${serverEndpoint}`,
  );

  const makedAsRead = await signifyApi.markNotificationAsRead(notei);

  if (!makedAsRead.success) {
    return failure(new Error(`Error marking notification as read ${notei}`));
  }

  const issuerAid = acdcResponse.data.acdc.a.i;

  if (isTrusted) {
    const admitIpexResult = await signifyApi.admitIpex(
      said,
      urlF.hostname,
      issuerAid,
    );

    if (!admitIpexResult.success) {
      return failure(new Error(`Error trying to admit ipex with said ${said}`));
    }
  }

  const tabs = await chrome.tabs.query({});
  const tab = tabs.find(t => t.url && new URL(t.url).hostname === urlF.hostname);

  if (!tab) {
    return failure(new Error(`Error trying to process demo tab: ${tab}`));
  }

  const newSession: Session = {
    id: uid(24),
    tunnelAid: createIdentifierResult.data.serder.ked.i,
    serverAid,
    loggedIn: false,
    name: urlF.hostname,
    logo: tab?.favIconUrl
      ? await convertURLImageToBase64(tab?.favIconUrl)
      : "",
    serverOobi: resolveOobiResult.data,
    tunnelOobiUrl: getOobiResult.data.oobis[0],
    createdAt: Date.now(),
    acdc: {
      isTrusted,
      ...acdc,
    },
  };

  const { sessions } = await chrome.storage.local.get([LocalStorageKeys.SESSIONS]);
  const sessionsArray = sessions || [];
  sessionsArray.push(newSession);
  await chrome.storage.local.set({ [LocalStorageKeys.SESSIONS]: sessionsArray });

  await logger.addLog(
    `🗃 New session stored in db: ${JSON.stringify(newSession, null, 2)}`,
  );

  return success(undefined);
};

chrome.runtime.onInstalled.addListener(async () => {
  await logger.addLog(`✅ Extension successfully installed!`);
  await signifyApi.start();
  await logger.addLog(`✅ Signify initialized successfully`);

  const createIdentifierResult = await signifyApi.createIdentifier(
    IDW_COMMUNICATION_AID_NAME,
  );
  if (!createIdentifierResult.success) {
    await logger.addLog(
      `❌ Error trying to create an AID to communicate with IDW: ${createIdentifierResult.error} - trace: ${createIdentifierResult.error}`,
    );
    new Error(
      `Error trying to create an AID to communicate with IDW: ${createIdentifierResult.error} - trace: ${createIdentifierResult.error}`,
    );
    return;
  }

  const getOobiResult = await signifyApi.createOOBI(IDW_COMMUNICATION_AID_NAME);
  if (!getOobiResult.success) {
    await logger.addLog(
      `Error trying to create an OOBI URL for the IDW to connect: ${createIdentifierResult.data.serder.ked.i} - trace: ${getOobiResult.error}`,
    );
    new Error(
      `Error trying to create an OOBI URL for the IDW to connect: ${createIdentifierResult.data.serder.ked.i} - trace: ${getOobiResult.error}`,
    );
    return;
  }

  const commAid = {
    id: uid(24),
    tunnelAid: createIdentifierResult.data.serder.ked.i,
    name: IDW_COMMUNICATION_AID_NAME,
    tunnelOobiUrl: getOobiResult.data.oobis[0],
  };

  await chrome.storage.local.set({ [LocalStorageKeys.WALLET_CONNECTION_TUNNEL_AID]: commAid });

  await logger.addLog(
    `✅ AID and OOBI created for IDW communication: ${getOobiResult.data.oobis[0]}`,
  );
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  processMessage(request)
    .then((response) => response && sendResponse(response))
    .catch(console.error);
  return true;
});

function getReturnMessageType(
  inbound: ExtensionMessageType,
): ExtensionMessageType {
  switch (inbound) {
    case ExtensionMessageType.CREATE_SESSION:
      return ExtensionMessageType.CREATE_SESSION_RESULT;
    case ExtensionMessageType.SIGN_ENCRYPT_REQ:
      return ExtensionMessageType.SIGN_ENCRPYT_REQ_RESULT;
    case ExtensionMessageType.VERIFY_DECRYPT_RESP:
      return ExtensionMessageType.VERIFY_DECRYPT_RESP_RESULT;
    case ExtensionMessageType.RESOLVE_WALLET_OOBI:
      return ExtensionMessageType.RESOLVE_WALLET_OOBI_RESULT;
    case ExtensionMessageType.LOGIN_REQUEST:
      return ExtensionMessageType.LOGIN_REQUEST_RESULT;
    default:
      return ExtensionMessageType.GENERIC_ERROR;
  }
}

async function processMessage(
  message: any,
): Promise<ExtensionMessage<any> | undefined> {

  // @TODO - foconnor: Need better handling of message.data to avoid crashing.
  switch (message.type) {
    case ExtensionMessageType.CREATE_SESSION: {
      const { origin } = message;
      const { serverEndpoint } = message.data;

      // TODO: the demo is restricted to one backend per domain
      if (new URL(origin).hostname !== new URL(serverEndpoint).hostname) {
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          "The web hostname and the server hostname does not match",
        );
      }

      const urlF = new URL(origin);
      const { sessions } = await chrome.storage.local.get([
        LocalStorageKeys.SESSIONS,
      ]);
      if (
        sessions &&
        sessions.find((session: Session) => session.name === urlF.hostname)
      ) {
        return successExt(
          message.id,
          getReturnMessageType(message.type),
          "Session previously created before, ignoring.",
        );
      }

      const createSessionResult = await createSession(serverEndpoint);
      if (createSessionResult.success) {
        await logger.addLog(`✅ Session created successfully`);
        return successExt(
          message.id,
          getReturnMessageType(message.type),
          createSessionResult.data,
        );
      } else {
        await logger.addLog(`❌ ${createSessionResult.error}`);
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          createSessionResult.error,
        );
      }
    }
    case ExtensionMessageType.SIGN_ENCRYPT_REQ: {
      const { url, method, body } = message.data;

      const urlF = new URL(url);
      const { sessions } = await chrome.storage.local.get([
        LocalStorageKeys.SESSIONS,
      ]);
      if (!sessions) {
        return failureExt(
          message.id,
          ExtensionMessageType.SIGN_ENCRPYT_REQ_RESULT,
          new Error(`Session not found for host ${urlF.hostname}`),
        );
      }
      const session: Session = sessions.find(
        (session: Session) => session.name === urlF.hostname,
      );
      if (!session) {
        // @TODO - foconnor: Here we should call connect with that hostname - allows us to call other hosts than the one the UI is hosted on.
        return failureExt(
          message.id,
          ExtensionMessageType.SIGN_ENCRPYT_REQ_RESULT,
          new Error(`Session not found for host ${urlF.hostname}`),
        );
      }

      // @TODO - foconnor: Using one AID per domain/hostname means a UI can call other domains and expose
      // the AID you use to talk to those. Ignore for now, especially since:
      //   1) Tunnel is ephemeral
      //   2) Identity wallet <-> Tunnel uses a different AID.
      const encryptSignResult = await signEncryptRequest(
        urlF.hostname,
        session.serverAid,
        urlF.pathname,
        method,
        body,
      );

      if (!encryptSignResult.success) {
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          new Error(
            `❌ Error while signing. Error: ${encryptSignResult.error}`,
          ),
        );
      }

      await logger.addLog(
        `📤 Request signed and encrypted. Headers: ${JSON.stringify(
          serializeHeaders(encryptSignResult.data.signedHeaders),
          null,
          2,
        )} // Body: ${JSON.stringify(
          encryptSignResult.data.essrBody,
          null,
          2,
        )}`,
      );

      return successExt(message.id, getReturnMessageType(message.type), {
        ...encryptSignResult.data,
        signedHeaders: serializeHeaders(encryptSignResult.data.signedHeaders),
      });
    }
    case ExtensionMessageType.VERIFY_DECRYPT_RESP: {
      const { url, method, headers, body } = message.data;

      // We don't trust requests for other domains until they show ACDC etc.
      const urlF = new URL(url);
      const { sessions } = await chrome.storage.local.get([
        LocalStorageKeys.SESSIONS,
      ]);
      if (!sessions) {
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          new Error(`Session not found for host ${urlF.hostname}`),
        );
      }
      const session: Session = sessions.find(
        (session: Session) => session.name === urlF.hostname,
      );
      if (!session) {
        // @TODO - foconnor: Here we should call connect with that hostname - allows us to call other hosts than the one the UI is hosted on.
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          new Error(`Session not found for host ${urlF.hostname}`),
        );
      }

      const verifyDecryptResult = await verifyDecryptResponse(
        urlF.hostname,
        session.serverAid,
        urlF.pathname,
        method,
        new Headers(headers),
        body,
      );
      if (!verifyDecryptResult.success) {
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          verifyDecryptResult.error,
        );
      }

      return successExt(
        message.id,
        getReturnMessageType(message.type),
        verifyDecryptResult.data,
      );
    }
    case ExtensionMessageType.RESOLVE_WALLET_OOBI: {
      // @TODO - foconnor: Should only be accepted from the extension UI!!!
      const { url } = message.data;

      const resolveOobiResult = await signifyApi.resolveOOBI(url);
      if (!resolveOobiResult.success) {
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          resolveOobiResult.error,
        );
      }

      const sendPingResult = await signifyApi.sendPing(IDW_COMMUNICATION_AID_NAME, resolveOobiResult.data.response.i, async () => {
        await chrome.storage.local.set({
          [LocalStorageKeys.WALLET_PONG_RECEIVED]: true,
        });


        // @TODO - foconnor: Instant feedback.
        // await chrome.runtime.sendMessage({
        //   type: ExtensionMessageType.WALLET_PONG_RECEIVED,
        //   data: {}
        // });
      });

      if (!sendPingResult.success) {
        await logger.addLog(`❌ Ping message failed to ${resolveOobiResult.data.response.i}`);
        return failureExt(
          message.id,
          getReturnMessageType(message.type),
          sendPingResult.error,
        );
      }

      await logger.addLog(`✅ Ping message sent to ${resolveOobiResult.data.response.i}`);

      return successExt(
        message.id,
        getReturnMessageType(message.type),
        resolveOobiResult.data,
      );
    }
    case ExtensionMessageType.LOGIN_REQUEST: {
      const { origin, data } = message;
      const { filter, serverEndpoint } = data;

      // TODO: the demo is restricted to one backend per domain
      if (new URL(origin).hostname !== new URL(serverEndpoint).hostname) {
        return failureExt(
            message.id,
            getReturnMessageType(message.type),
            "The web hostname and the server hostname does not match",
        );
      }

      const walletConnectionAid = await chrome.storage.local.get(LocalStorageKeys.WALLET_CONNECTION_IDW_AID);
      if (!walletConnectionAid || !Object.keys(walletConnectionAid).length) {
        return failureExt(
            message.id,
            getReturnMessageType(message.type),
            "Cannot request a log in as we are not connected to the identity wallet",
        );
      }

      const webDomain = new URL(origin).hostname;
      const { sessions } = await chrome.storage.local.get([LocalStorageKeys.SESSIONS]);
      const session: Session = sessions.find((session: Session) => session.name === webDomain);

      if (!session) {
        await logger.addLog(`❌ Error getting the session by name: ${webDomain}`);
        return failureExt(
            message.id,
            getReturnMessageType(message.type),
            `Error getting the session by name: ${webDomain}`,
        );
      }

      const payload = {
        serverEndpoint,
        serverOobiUrl: session.serverOobi.metadata.oobi,
        logo: session.logo,
        tunnelAid: session.tunnelAid,
        filter
      };
      const recipient = walletConnectionAid[LocalStorageKeys.WALLET_CONNECTION_IDW_AID];

      const sendMsgResult = await signifyApi.sendTunnelRequest(IDW_COMMUNICATION_AID_NAME, recipient, payload);
      if (!sendMsgResult.success) {
        await logger.addLog(`❌ Message sent to IDW failed: ${sendMsgResult.error}`);
        return failureExt(
            message.id,
            getReturnMessageType(message.type),
            sendMsgResult.error,
        );
      }

      await logger.addLog(`📩 Message successfully sent from to IDW, message: ${JSON.stringify(sendMsgResult.data)}`);

      return successExt(
          message.id,
          getReturnMessageType(message.type),
          sendMsgResult.data,
      );
    }
  }
}
