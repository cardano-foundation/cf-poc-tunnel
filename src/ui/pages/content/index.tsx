import { generateMessageId } from "../../../../demo/ui/src/extension/communication";
import { ExtensionMessageType } from "../../../../demo/ui/src/extension/types";

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

chrome.runtime.sendMessage(
  {
    id: generateMessageId(ExtensionMessageType.PAGE_ALREADY_VISITED_CEHCK),
    type: ExtensionMessageType.PAGE_ALREADY_VISITED_CEHCK,
    origin: window.location.href,
  },
  function (response) {
      if (response) {
          window.postMessage(response, "*");
      }
  },
);

export {};
