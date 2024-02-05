import { uid } from 'uid';
import { SignifyApi } from '@src/core/modules/signifyApi';
import {convertURLImageToBase64, isExpired, serializeHeaders} from '@src/utils';
import { Logger } from '@src/utils/logger';

const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;
const expirationTime = 1800000; // 30 min
const privateKeys: { [pubKey: string]: any } = {};
const signifyApi: SignifyApi = new SignifyApi();
const logger = new Logger();

const mockSessions = [
  {
    id: '1',
    name: 'voting-app.org',
    expiryDate: '2014-04-05',
    serverPubeid: 'JJBD4S...9S23',
    personalPubeid: 'KO7G10D4S...1JS5',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '2',
    name: 'webapp.com',
    expiryDate: '',
    serverPubeid: 'JJBD4S...9S23',
    personalPubeid: '',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '3',
    name: 'platform2.gov',
    expiryDate: '2015-06-10',
    serverPubeid: 'JJBD4S...9S23',
    personalPubeid: 'KO7G10D4S...1JS5',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '4',
    name: 'platform3.gov',
    serverPubeid: 'JJBD4S...9S23',
    personalPubeid: 'KO7G10D4S...1JS5',
    expiryDate: '2019-07-10',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '5',
    name: 'platform4.gov',
    expiryDate: '',
    serverPubeid: 'JJBD4S...9S23',
    personalPubeid: '',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
];

const checkSignify = async (): Promise<void> => {
  if (!signifyApi.started) {
    await signifyApi.start();
  }
};

const arePKsWiped = async (): Promise<boolean> => {
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['sessions'], function (data) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    if (!result.sessions) {
      return true;
    }

    return !result.sessions
      .filter(
        (session) =>
          session.expiryDate.length && !isExpired(session.expiryDate),
      )
      .every((session) => {
        return Object.keys(privateKeys).includes(session.personalPubeid);
      });
  } catch (error) {
    console.error('Error checking memory:', error);
    return true;
  }
};

const handleWipedPks = async (): Promise<void> => {
  // Start process to get the private keys from the mobile
  chrome.storage.local.get(['sessions'], function (result) {
    const activeSessions = result.sessions.filter((session) => {
      if (!session.expiryDate || session.expiryDate.length === 0) return false;
      return !isExpired(session.expiryDate);
    });
    // TODO: ask to Keria to get all activeSessions (privKeys)
  });
};

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.runtime.onInstalled.addListener(async () => {
  await logger.addLog(`✅ Extension successfully installed!`);
  await chrome.storage.local.set({
    sessions: mockSessions,
  });

  await checkSignify();
  await logger.addLog(`✅ Signify initialized successfully`);
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  processMessage(request).then((response)=> sendResponse(response));
  return true;
});

async function processMessage(message) {

  switch (message.type) {
    case 'LOGIN_FROM_WEB': {
      const sessions = await chrome.storage.local.get(['sessions']);

      const tab = await getCurrentTab();
      let hostname = new URL(tab.url).hostname;
      const port = new URL(tab.url).port;
      if (port.length) {
        hostname = `${hostname}:${port}`;
      }
      hostname = hostname.replace(':','-');
      const logo = await convertURLImageToBase64(tab.favIconUrl);

      await logger.addLog(
          `⏳ Hostname ${hostname} is trying to create a new session`,
      );

      try {
        let response = await fetch(`${SERVER_ENDPOINT}/oobi`, {
          method: 'GET',
          redirect: 'follow',
        });
        await logger.addLog(`✅ OOBI URL from ${SERVER_ENDPOINT}/oobi`);

        response = await response.json();
        const oobiUrl = response.oobis[0];
        await logger.addLog(`⏳ Resolving OOBI URL...`);

        const resolvedOOBI = await signifyApi.resolveOOBI(oobiUrl);

        await logger.addLog(`✅ OOBI resolved successfully`);

        if (resolvedOOBI.success) {
          try {
            await signifyApi.createIdentifier(hostname);
            await logger.addLog(
                `✅ AID created successfully with name ${hostname}`,
            );

            const newSession = {
              id: uid(24),
              personalPubeid: '',
              expiryDate: '',
              name: hostname,
              logo,
              icon: tab.favIconUrl,
              oobi: resolvedOOBI?.data,
            };

            const ss = [newSession, ...sessions.sessions];

            await chrome.storage.local.set({ sessions: ss });

            await logger.addLog(
                `✅ New session stored in db: ${JSON.stringify(ss)}`,
            );
            return { success: true }
          } catch (e) {
            await logger.addLog(
                `❌ Error trying to create an AID with name: ${hostname}`,
            );
            return { success: false }
          }
        } else {
          await logger.addLog(
              `❌ Error while resolving the OOBI URL from server: ${SERVER_ENDPOINT}/oobi`,
          );
          return { success: false }
        }
      } catch (e) {
        await logger.addLog(
            `❌ Error getting OOBI URL from server: ${SERVER_ENDPOINT}/oobi`,
        );
        return { success: false }
      }
    }
    case 'HANDLE_FETCH': {
      try {
        const dataToSign = message.data;
        const authn = await signifyApi.getAuthn();
        if (authn.success) {
          const url = dataToSign.data.url;
          const method = dataToSign.data.method;
          const headers = new Headers(dataToSign.data.headers);
          const tab = await getCurrentTab();
          let hostname = new URL(tab.url).hostname;
          const port = new URL(tab.url).port;
          if (port.length) {
            hostname = `${hostname}:${port}`;
          }
          hostname = hostname.replace(':','-');

          const ephemeralAID = await signifyApi.getIdentifierByName(hostname);;

          if (ephemeralAID.success) {
            headers.set('signify-resource', ephemeralAID.data.prefix);

            await logger.addLog(
                `✅ Ephemeral AID added to headers: ${ephemeralAID.data.prefix}`,
            );

            try {
              const signedHeaders = authn.data?.sign(
                  headers,
                  method,
                  new URL(url).pathname,
              );

              await logger.addLog(
                  `✅ Headers signed successfully: ${ephemeralAID.data.prefix}`,
              );

              if (signedHeaders) {
                const serializedHeaders = serializeHeaders(signedHeaders);

                await logger.addLog(
                    `✅ Signed headers sent to the content script. Headers: ${JSON.stringify(serializedHeaders)}`,
                );
                return { success: true, data: {signedHeaders: serializedHeaders}}
              }
            } catch (e) {
              await logger.addLog(
                  `❌ Error while signing.. headers: ${hostname}, method: ${method}, pathname: ${
                      new URL(url).pathname
                  }. Error: ${e}`,
              );
              return { success: false };
            }
          } else {
            await logger.addLog(
                `❌ Error getting ephemeral AID with name: ${hostname}. Error: ${ephemeralAID.error}`,
            );
            return { success: false };
          }
        } else {
          await logger.addLog(`❌ Error getting authn from signifyClient`);
          return { success: false };
        }
      } catch (e) {
        await logger.addLog(
            `❌ Error getting Authenticater from signifyApi. Error: ${e}`,
        );
        return { success: false };
      }
    }
  }
}

export { expirationTime };
