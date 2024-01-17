window.addEventListener('message', (event) => {
  if (event.data.type === 'LOGIN_FROM_WEB') {
    chrome.runtime.sendMessage(event.data, (response) => {
      if (response === 'OK') {
        console.log("Session request sent to the extension");
      }
    });
  }
});

export {};
