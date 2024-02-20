import { uid } from "uid";
import { SignifyApi } from "@src/core/modules/signifyApi";
import { convertURLImageToBase64, serializeHeaders } from "@src/utils";
import { Logger } from "@src/utils/logger";
import { Authenticater } from "signify-ts";
import { ResponseData } from "@src/core/modules/signifyApi.types";

const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;
const expirationTime = 1800000; // 30 min
const signifyApi: SignifyApi = new SignifyApi();
const logger = new Logger();

const checkSignify = async (): Promise<void> => {
  if (!signifyApi.started) {
    await signifyApi.start();
  }
};
const getCurrentTabDetails = async (): Promise<{
  hostname: string;
  port: string;
  pathname: string;
  favIconUrl: string;
}> => {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  const hostname = new URL(tab.url).hostname;
  const port = new URL(tab.url).port;
  const pathname = new URL(tab.url).pathname;
  const favIconUrl = tab.favIconUrl || "";

  return {
    hostname,
    port,
    pathname,
    favIconUrl,
  };
};

const signHeaders = async (
  path: string,
  method: string,
  headersToSign: any,
  aidName: string,
): Promise<ResponseData<Headers>> => {
  try {
    const ephemeralAID = await signifyApi.getIdentifierByName(aidName);

    if (ephemeralAID.success) {
      const signer = (await signifyApi.getSigner(ephemeralAID.data)).data;

      const authenticator = new Authenticater(
        signer.signers[0],
        signer.signers[0].verfer,
      );

      const headers = new Headers();
      Object.entries(headersToSign).forEach(([key, value]) => {
        headers.append(key, value);
      });

      headers.set("Signify-Resource", ephemeralAID.data.prefix);
      await logger.addLog(
        `✅ Ephemeral AID added to headers: ${JSON.stringify({
          "Signify-Resource": ephemeralAID.data.prefix,
        })}`,
      );

      const timestamp = new Date().toISOString().replace("Z", "000+00:00");
      headers.set("Signify-Timestamp", timestamp);
      await logger.addLog(
        `✅ Timestamp added to headers: ${JSON.stringify({
          "Signify-Timestamp": timestamp,
        })}`,
      );

      try {
        const signedHeaders = authenticator.sign(headers, method, path);

        await logger.addLog(
          `✍️ Headers signed successfully by ephemeral AID: ${ephemeralAID.data.prefix}`,
        );

        return {
          success: true,
          data: signedHeaders,
        };
      } catch (e) {
        return {
          success: false,
          error: `Error while signing.. headers: ${aidName}, method: ${method}, pathname: ${path}. Error: ${e}`,
        };
      }
    } else {
      return {
        success: false,
        error: `Error getting ephemeral AID with name: ${aidName}. Error: ${ephemeralAID.error}`,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: e,
    };
  }
};

const resolveClientOOBI = async (
  name: string,
): Promise<
  ResponseData<{
    success: boolean;
    data: string;
  }>
> => {
  try {
    const oobi = await signifyApi.getOOBI(name, "agent");

    if (oobi.success) {
      const oobiUrl = oobi.data.oobis[0];
      await fetch(`${SERVER_ENDPOINT}/resolve-oobi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oobiUrl,
        }),
      });
      return {
        success: true,
        data: {
          oobiUrl,
        },
      };
    } else {
      return {
        success: false,
        error: new Error("Error while getting the OOBI url"),
      };
    }
  } catch (e) {
    return {
      success: false,
      error: e,
    };
  }
};

const discloseEnterpriseACDC = async (
  aidPrefix: string,
  schemaSaid: string,
): Promise<
  ResponseData<{
    statusCode: number;
    success: boolean;
    data: null;
  }>
> => {
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
    return {
      success: true,
      data: await response.json(),
    };
  } catch (e) {
    return {
      success: false,
      error: e,
    };
  }
};

const waitForAcdcToAppear = async (retryTimes: number): Promise<any> => {
  let noty = (await signifyApi.getNotifications()).data;
  let tries = 0;
  while (!noty?.notes?.length) {
    if (tries > retryTimes) {
      throw new Error("not acdc");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    noty = (await signifyApi.getNotifications()).data;
    tries++;
  }
  return noty.notes;
};

const createSession = async (): Promise<ResponseData<any>> => {
  let { hostname, port, favIconUrl } = await getCurrentTabDetails();
  if (port.length) {
    hostname = `${hostname}:${port}`;
  }
  hostname = hostname.replace(":", "-");
  const logo = await convertURLImageToBase64(favIconUrl);

  try {
    let response = await fetch(`${SERVER_ENDPOINT}/oobi`, {
      method: "GET",
      redirect: "follow",
    });
    await logger.addLog(`✅ OOBI URL from ${SERVER_ENDPOINT}/oobi`);

    response = await response.json();
    const oobiUrl = response.oobis[0];
    await logger.addLog(`⏳ Resolving OOBI URL...`);

    const resolvedOOBI = await signifyApi.resolveOOBI(oobiUrl);

    if (resolvedOOBI.success) {
      await logger.addLog(`✅ Enterpise OOBI resolved successfully`);

      try {
        const aid = await signifyApi.createIdentifier(hostname);

        if (aid.success) {
          await logger.addLog(
            `✅ AID created successfully with name ${hostname}`,
          );

          const clientOobiResolved = await resolveClientOOBI(hostname);

          if (clientOobiResolved.success) {
            await logger.addLog(
              `✅ Client OOBI successfully resolved with URL: ${clientOobiResolved.data.oobiUrl}`,
            );

            const disclosedAcdc = await discloseEnterpriseACDC(
              aid.data.data.prefix,
              SignifyApi.ENTERPRISE_SCHEMA_SAID,
            );

            if (disclosedAcdc.success) {
              const creds = await waitForAcdcToAppear(140);

              await logger.addLog(`✅ Credentials: ${JSON.stringify(creds)}`);

              const newSession = {
                id: uid(24),
                tunnelAid: aid.data.data.prefix,
                expiryDate: "",
                name: hostname,
                logo,
                oobi: resolvedOOBI?.data,
                createdAt: Date.now(),
                acdc: creds[0],
              };

              const { sessions } = await chrome.storage.local.get(["sessions"]);
              const sessionsArray = sessions || [];
              sessionsArray.push(newSession);

              await chrome.storage.local.set({ sessions: sessionsArray });

              await logger.addLog(
                `🗃 New session stored in db: ${JSON.stringify(sessionsArray)}`,
              );
              return { success: true, data: newSession };
            } else {
              return {
                success: false,
                error: `Error while disclosing enterprise ACDC. Error: ${disclosedAcdc.error}`,
              };
            }
          } else {
            return {
              success: false,
              error: `Error while resolving client OOBI with name: ${hostname}. Error: ${clientOobiResolved.error}`,
            };
          }
        } else {
          return {
            success: false,
            error: `Error while creating AID with name: ${hostname}. Error: ${aid.error}`,
          };
        }
      } catch (e) {
        return {
          success: false,
          error: `Error trying to create an AID with name: ${hostname}`,
        };
      }
    } else {
      return {
        success: false,
        error: ` Error while resolving the OOBI URL from server: ${SERVER_ENDPOINT}/oobi`,
      };
    }
  } catch (e) {
    await logger.addLog(
      `❌ Error getting OOBI URL from server: ${SERVER_ENDPOINT}/oobi`,
    );
    return { success: false, type: "SESSION_CREATED" };
  }
};
chrome.runtime.onInstalled.addListener(async () => {
  await logger.addLog(`✅ Extension successfully installed!`);
  await checkSignify();
  await logger.addLog(`✅ Signify initialized successfully`);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  processMessage(request).then((response) => sendResponse(response));
  return true;
});

async function processMessage(message) {
  if (!message) return;

  switch (message.type) {
    case "CREATE_SESSION": {
      const session = await createSession();

      if (session.success) {
        await logger.addLog(`✅ Session created successfully`);
        return { type: "SESSION_CREATED", id: message.id, data: session };
      } else {
        await logger.addLog(`❌ ${session.error}`);
        return { type: "SESSION_CREATED", id: message.id, data: session };
      }
    }
    case "SIGN_HEADERS": {
      const pathname = message.data.path;
      const method = message.data.method;
      const headers = message.data.headers;

      let { hostname, port } = await getCurrentTabDetails();
      if (port.length) {
        hostname = `${hostname}:${port}`;
      }
      hostname = hostname.replace(":", "-");

      const signedHeaders = await signHeaders(
        pathname,
        method,
        headers,
        hostname,
      );

      if (signedHeaders.success) {
        await logger.addLog(
          `📤 Signed headers sent to the website. Headers: ${JSON.stringify(
            serializeHeaders(signedHeaders.data),
          )}`,
        );

        return {
          success: true,
          type: "SIGNED_HEADERS",
          id: message.id,
          data: {
            signedHeaders: serializeHeaders(signedHeaders.data),
          },
        };
      } else {
        await logger.addLog(
          `❌ Error while signing. Error: ${signedHeaders.error}`,
        );
        return { success: false, type: "SIGNED_HEADERS", id: message.id };
      }
    }
  }
}

export { expirationTime };
