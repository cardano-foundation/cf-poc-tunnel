window.addEventListener("message", (event) => {
  chrome.runtime.sendMessage(
    { ...event.data, origin: event.origin },
    (response) => {
      if (response) {
        window.postMessage(response, "*");
      }
    },
  );
});

export {};
