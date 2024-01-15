import { uid } from 'uid';
import {SignifyApi} from "../../../core/modules/signifyApi";
import {isExpired} from "../../utils";

const expirationTime = 1800000; // 30 min
const privateKeys: { [pubKey: string]: string } = {};
const signifyApi:SignifyApi = new SignifyApi();

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
    console.log("checkSignify...")
    if (!signifyApi.started) await signifyApi.start();
}

const arePKWiped = async (): Promise<boolean> => {
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

const handleWipedMemory = async (): Promise<void> => {
    // Start process to get the private keys from the mobile
    chrome.storage.local.get(['sessions'], function (result) {
        const activeSessions = result.sessions.filter((session) => {
            if (!session.expiryDate || session.expiryDate.length === 0) return false;
            return !isExpired(session.expiryDate);
        });
        // TODO: ask to Keria to get all activeSessions (privKeys)
    });
};

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension successfully installed!');
    chrome.storage.local.set({
        sessions: mockSessions,
    });
    checkSignify();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    arePKWiped().then((areWiped) => {
        switch (message.type) {
            case 'LOGIN_FROM_WEB':
                if (areWiped) {
                    handleWipedMemory(); // TODO: handle properly handleWipedMemory
                }
                chrome.storage.local.get(['sessions'], function (result) {
                    const newSession = {
                        ...message.data,
                        id: uid(24),
                        personalPubeid: '',
                        expiryDate: '',
                    };

                    const ss = [newSession, ...result.sessions];

                    chrome.storage.local.set({ sessions: ss }, function () {
                        // privateKeys[aid.pubKey] = aid.privKey;
                        sendResponse({ status: 'OK' });
                    });
                });
                break;
            case 'SET_PRIVATE_KEY':
                privateKeys[message.data.pubKey] = message.data.privKey;
                if (areWiped) {
                    handleWipedMemory();
                }
                sendResponse({ status: 'OK' });
                break;
            case 'DELETE_PRIVATE_KEY':
                // TODO
                break;
        }
    });

    return true;
});

export { expirationTime };
