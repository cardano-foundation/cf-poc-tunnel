import { uid } from 'uid';

const mockSessions = [
  {
    id: '1',
    name: 'voting-app.org',
    expiryDate: '2024-04-05',
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
    expiryDate: '2024-06-10',
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

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension successfully installed!');
  chrome.storage.local.set({ sessions: mockSessions }, function() {
    // mock data added
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SESSIONS') {
    chrome.storage.local.get(['sessions'], function(result) {
      sendResponse(result.sessions);
    });

  } else if (message.sessionId && message.type === 'DELETE_SESSION') {
    chrome.storage.local.get(['sessions'], function(result) {
      const ss = result.sessions.filter((session) => message.sessionId !== session.id);
      chrome.storage.local.set({ sessions: ss }, function() {
        sendResponse({ status: 'OK' });
      });
    });
    sendResponse({ status: 'OK' });
  } else if (message.data && message.type === 'LOGIN_FROM_WEB') {
    chrome.storage.local.get(['sessions'], function(result) {
      const newSession = {
        ...message.data,
        id: uid(24),
        personalPubeid: '',
        expiryDate: '',
      };
      const ss = [newSession, ...result.sessions];

      chrome.storage.local.set({ sessions: ss }, function() {
        sendResponse({ status: 'OK' });
      });
    });
  }

  return true;
});

export {};
