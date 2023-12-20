const sessions = [
  {
    id: '1',
    name: 'voting-app.org',
    expiryDate: '2024-04-05',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '2',
    name: 'webapp.com',
    expiryDate: '',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '3',
    name: 'platform2.gov',
    expiryDate: '2024-06-10',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '4',
    name: 'platform3.gov',
    expiryDate: '2019-07-10',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
  {
    id: '5',
    name: 'platform4.gov',
    expiryDate: '',
    oobi: 'http://ac2in...1JS5',
    acdc: 'ACac2in...1JS5DC',
  },
];

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension successfully installed!');
});

self.addEventListener('message', (event) => {
  console.log('event message');
  console.log(event.data.type);
  if (event.data && event.data.type === 'GET_SESSIONS') {
    event.ports[0].postMessage(sessions);
  }
});

export {};
