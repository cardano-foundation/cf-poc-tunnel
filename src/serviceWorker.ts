const sessions = [
  { id: '1', name: 'voting-app.org', expiryDate: '2024-04-05' },
  { id: '2', name: 'platform.gov', expiryDate: '2024-05-10' }
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