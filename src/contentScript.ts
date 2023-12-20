window.addEventListener('message', (event) => {
  if (event.data.type === 'LOGIN_FROM_WEB') {

    chrome.runtime.sendMessage(
        event.data,
      (response) => {
        if (response === 'OK'){
          // change icon
        }
      },
    );
  }
});

export {};
