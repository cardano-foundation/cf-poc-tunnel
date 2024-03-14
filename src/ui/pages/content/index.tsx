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
    id: generateMessageId(ExtensionMessageType.PAGE_ALREADY_VISITED_CHECK),
    type: ExtensionMessageType.PAGE_ALREADY_VISITED_CHECK,
    origin: window.location.href,
  },
  function (response) {
      if (response && response.type === ExtensionMessageType.PAGE_ALREADY_VISITED_RESULT){
          window.postMessage(response, "*");
      }
  },
);

export {};
