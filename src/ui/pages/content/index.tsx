window.addEventListener("message", (event) => {
  chrome.runtime.sendMessage(event.data, (response) => {
    window.postMessage(response, "*");
  });
});

export {};
