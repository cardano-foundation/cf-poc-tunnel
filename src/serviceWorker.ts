import { uid } from 'uid';

let sessions = [
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
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('message');
  console.log(message);
  if (message.type === 'GET_SESSIONS') {
    sendResponse(sessions);
  } else if (message.sessionId && message.type === 'DELETE_SESSION') {
    sessions = sessions.filter((session) => message.sessionId !== session.id);
    sendResponse({ status: 'OK' });
  } else if (message.data && message.type === 'LOGIN_FROM_WEB') {
    const newSession = {
      ...message.data,
      id: uid(24),
      personalPubeid: '',
      expiryDate: '',
    };
    sessions = [newSession, ...sessions];

    sendResponse({ status: 'OK' });
  }

  return true;
});

export {};
