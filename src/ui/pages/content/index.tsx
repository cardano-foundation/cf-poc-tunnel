window.addEventListener('message', (event) => {
  console.log('event.data');
  console.log(event.data);
  chrome.runtime.sendMessage(event.data, (response) => {
    if (response === 'OK') {
      window.alert('Session request sent to the extension');
    }
  });
});

export {};
