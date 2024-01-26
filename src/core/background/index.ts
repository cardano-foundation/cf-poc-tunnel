import { uid } from 'uid';
import { SignifyApi } from '@src/core/modules/signifyApi';
import { extractHostname, isExpired } from '@src/utils';
import { Logger } from '@src/utils/logger';

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
  if (!signifyApi.started) await signifyApi.start();
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
  logger.addLog(
      `✅ Extension successfully installed!`,
  );
  chrome.storage.local.set({
    sessions: mockSessions,
  });
  checkSignify();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // checkSignify();
  arePKsWiped().then((areWiped) => {
    switch (message.type) {
      case 'LOGIN_FROM_WEB':
        chrome.storage.local.get(['sessions'], function (sessions) {

          getCurrentTab().then((tab) => {
            const hostname = extractHostname(tab.url);

            logger.addLog(
              `⏳ Hostname ${hostname} is trying to create a new session`,
            );

            fetch('http://localhost:3001/oobi', {
              method: 'GET',
              redirect: 'follow',
            })
              .then((response) => response.json())
              .then((result) => {
                const oobiUrl = result.oobis[0];
                logger.addLog(`⏳ Resolving OOBI URL: ${oobiUrl}`).then(() => {
                  signifyApi.resolveOOBI(oobiUrl).then((response) => {
                    logger.addLog(`✅ OOBI URL resolved successfully`);
                    const newSession = {
                      id: uid(24),
                      personalPubeid: '',
                      expiryDate: '',
                      name: hostname,
                      icon: tab.favIconUrl,
                      oobi: response,
                    };

                    const ss = [newSession, ...sessions.sessions];

                    setTimeout(() => {
                      chrome.storage.local.set({ sessions: ss }, function () {
                        logger.addLog(
                            `✅ New session stored in db: ${JSON.stringify(ss)}`,
                        );
                        sendResponse({ status: 'OK' });
                      });
                    }, 2000);
                  });
                });
              })
              .catch((error) => {
                logger.addLog(`❌ Error on Resolving OOBI: ${error}`);
              });
          });
        });
        break;
      case 'SET_PRIVATE_KEY': {
        console.log('lets create a AID');
        console.log('message.data');
        console.log(message.data);
        const name = `${message.data.name}`;
        console.log('key:', name);
        try {
          signifyApi.createIdentifier(name).then((aid) => {
            console.log('aid');
            console.log(aid);
            logger.addLog(
              `✅ AID created with name ${name}: ${JSON.stringify(aid)}`,
            );
            signifyApi
              .getSigner(aid)
              .then((signer) => console.log('signer', signer));
            sendResponse({ status: 'OK', data: aid });
          });
        } catch (e) {
          logger.addLog(`❌ Error on AID creation with name ${name}: ${e}`);
        }
        if (areWiped) {
          handleWipedPks();
        }
        break;
      }
      case 'DELETE_PRIVATE_KEY':
        delete privateKeys[message.data.pubKey];
        break;
    }
  });
  return true;
});

export { expirationTime };
