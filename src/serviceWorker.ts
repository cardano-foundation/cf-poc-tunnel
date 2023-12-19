const sessions = [
  { id: '1', name: 'voting-app.org', expiryDate: '2024-04-05' },
  { id: '2', name: 'platform.gov', expiryDate: '2024-05-10' },
  { id: '3', name: 'platform2.gov', expiryDate: '2024-06-10' },
  { id: '4', name: 'platform3.gov', expiryDate: '2024-07-10' },
  { id: '5', name: 'platform4.gov', expiryDate: '2024-09-10' },
];

chrome.runtime.onInstalled.addListener(async () => {
  // Here goes everything you want to execute after extension initialization
  console.log('Extension successfully installed!');
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_SESSIONS') {
    event.ports[0].postMessage(sessions);
  }
});

export {};