import { uid } from "uid";
import { Authenticater, b, Cipher, Matter, Cigar, Decrypter } from "signify-ts";
import { SignifyApi } from "@src/core/modules/signifyApi";
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
import { LOCAL_STORAGE_SESSIONS } from "@src/ui/pages/popup/sessionDetails/sessionDetails";

const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;
const signifyApi: SignifyApi = new SignifyApi();
const logger = new Logger();

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
    `✅ Tunnel AID added to headers: ${JSON.stringify({
      "Signify-Resource": ourAid.prefix,
    })}`,
  );

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  headers.set("Signify-Timestamp", datetime);
  await logger.addLog(
    `✅ Timestamp added to headers: ${JSON.stringify({
      "Signify-Timestamp": datetime,
    })}`,
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

  // For now this isn't full protection - we need to verify that the request is unique.
  // Follow up story will cover this.
  if (Date.now() - new Date(reqDateTime).getTime() > 1000) {
    return failure(new Error("Signify-Timestamp of response is too old"));
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

const acceptKeriAcdc = async (
  said: string,
  holderAidName: string,
): Promise<ResponseData<any>> => {
  try {
    const keriExchangeResult = await signifyApi.getKeriExchange(
        said
    );

    const admitIpexResult = await signifyApi.admitIpex(
        said,
        holderAidName,
        keriExchangeResult.data.exn.i
    );
    return success(admitIpexResult);
  } catch (e) {
    return failure(e);
  }
}

const discloseEnterpriseACDC = async (
  aidPrefix: string,
  schemaSaid: string,
): Promise<ResponseData<any>> => {
  try {
    const response = await fetch(`${SERVER_ENDPOINT}/disclosure-acdc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aidPrefix,
        schemaSaid,
      }),
    });
    return success(response.status === 200);
  } catch (e) {
    return failure(e);
  }
};

const waitForCredentialsToAppear = async (said: string, retryTimes: number) => {
  try {
    let credResult = await signifyApi.getCredentialBySaid(said);
    if (!credResult.success) {
      return failure(
          new Error(
              `Error trying to get the credentials from Keria`,
          ),
      );
    }
    let tries = 0;

    while (!credResult.data) {
      if (tries > retryTimes) {
        throw new Error("not credential");
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      credResult = await signifyApi.getCredentialBySaid(said);
      if (!credResult.success) {
        return failure(
            new Error(
                `Error trying to get the credentials from Keria`,
            )
        );
      }
      tries++;
    }
    return success(credResult.data);
  } catch (e) {
    return failure(e);
  }
}
const waitForNotificationsToAppear = async (retryTimes: number): Promise<ResponseData<any>> => {
  try {
    let noty = await signifyApi.getNotifications();
    if (!noty.success) {
      return failure(
          new Error(
              `Error trying to get the credentials from Keria`,
          ),
      );
    }
    let notes = noty.data.notes;
    let tries = 0;
    while (!notes?.length) {
      if (tries > retryTimes) {
        throw new Error("not acdc");
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      noty = await signifyApi.getNotifications();
      if (!noty.success) {
        return failure(
            new Error(
                `Error trying to get the credentials from Keria`,
            )
        );
      }
      notes = noty.data.notes;
      tries++;
    }
    return success(notes);
  } catch (e) {
    return failure(e);
  }
};

const createSession = async (): Promise<ResponseData<undefined>> => {
  // @TODO - foconnor: SERVER_ENDPOINT shouldn't be hardcoded.
  const urlF = new URL(SERVER_ENDPOINT);

  let response;
  try {
    response = await fetch(`${SERVER_ENDPOINT}/oobi`);
    await logger.addLog(`✅ Received OOBI URL from ${SERVER_ENDPOINT}/oobi`);
  } catch (e) {
    return failure(
      new Error(
        `Error getting OOBI URL from server: ${SERVER_ENDPOINT}/oobi: ${e}`,
      ),
    );
  }

  const oobiUrl = (await response.json()).oobis[0];
  await logger.addLog(`⏳ Resolving OOBI URL...`);

  const resolveOobiResult = await signifyApi.resolveOOBI(oobiUrl);
  if (!resolveOobiResult.success) {
    return failure(
      new Error(
        `Error resolving OOBI URL ${oobiUrl}: ${resolveOobiResult.error}`,
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

  await logger.addLog(`✅ AID created successfully with name ${urlF.hostname}`);

  try {
    await fetch(`${SERVER_ENDPOINT}/resolve-oobi`, {
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
    `✅ Server has resolved our OOBI for identifier ${urlF.hostname}`,
  );

  const disclosedAcdcResult = await discloseEnterpriseACDC(
    createIdentifierResult.data.serder.ked.i,
    SignifyApi.ENTERPRISE_SCHEMA_SAID,
  );

  if (!disclosedAcdcResult.success) {
    return failure(
      new Error(
        `Error disclosing server ACDC with tunnel prefix ${createIdentifierResult.data.serder.ked.i}
        and server schema ${SignifyApi.ENTERPRISE_SCHEMA_SAID}. Error: ${disclosedAcdcResult.error}`,
      ),
    );
  }

  await logger.addLog(
      `✅ Server has disclosed the ACDC for the identifier ${createIdentifierResult.data.serder.ked.i}
      and schema ${SignifyApi.ENTERPRISE_SCHEMA_SAID}`,
  );

  const notificationsResult = await waitForNotificationsToAppear(140);

  if (!notificationsResult.success) {
    return failure(
        new Error(
            `Error getting notifications from Keria`,
        ),
    );
  }

  await logger.addLog(
      `✅ Notifications received from Keria ${JSON.stringify(notificationsResult.data)}`,
  );

  const acceptedKeriAcdc = await acceptKeriAcdc(notificationsResult.data[0].a.d, urlF.hostname);

  if (!acceptedKeriAcdc.success) {
    return failure(
        new Error(
            `Error getting credentials from Keria`,
        ),
    );
  }

  const credsResult = await waitForCredentialsToAppear(notificationsResult.data[0].a.d, 140);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const newSession: Session = {
    id: uid(24),
    tunnelAid: createIdentifierResult.data.serder.ked.i,
    serverAid: oobiUrl.split("/oobi/")[1].split("/")[0], // todo get from oobiresult
    expiryDate: "",
    name: urlF.hostname,
    logo: tab.favIconUrl ? await convertURLImageToBase64(tab.favIconUrl) : "",
    serverOobi: resolveOobiResult.data,
    tunnelOobiUrl: getOobiResult.data.oobis[0],
    createdAt: Date.now(),
    credentials: notificationsResult.data
  };

  const { sessions } = await chrome.storage.local.get([LOCAL_STORAGE_SESSIONS]);
  const sessionsArray = sessions || [];
  sessionsArray.push(newSession);
  await chrome.storage.local.set({ sessions: sessionsArray });

  await logger.addLog(
    `🗃 New session stored in db: ${JSON.stringify(newSession)}`,
  );

  return success(undefined);
};

chrome.runtime.onInstalled.addListener(async () => {
  await logger.addLog(`✅ Extension successfully installed!`);
  if (!signifyApi.started) {
    await signifyApi.start();
  }
  await logger.addLog(`✅ Signify initialized successfully`);
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
      const { url } = message.data;

      const urlF = new URL(url);
      const { sessions } = await chrome.storage.local.get([
        LOCAL_STORAGE_SESSIONS,
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

      const createSessionResult = await createSession();
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
        LOCAL_STORAGE_SESSIONS,
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
        )} // Body: ${JSON.stringify(encryptSignResult.data.essrBody)}`,
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
        LOCAL_STORAGE_SESSIONS,
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
  }
}
