window.addEventListener("message", (event) => {
  chrome.runtime.sendMessage(event.data, (response) => {
    if (response) {
      window.postMessage(response, "*");
    }
  });
});

export {};
