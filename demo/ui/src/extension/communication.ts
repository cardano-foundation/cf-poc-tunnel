import { v4 as uuidv4 } from "uuid";
import { ExtensionMessageInbound, ExtensionMessageOutbound } from "./types";

const generateMessageId = (type: string) => {
  return `${type}:${uuidv4()}`;
};

const sendMessageToExtension = <T>(
  message: ExtensionMessageOutbound<T>,
): void => {
  window.postMessage(message, "*");
};

const listenForExtensionMessage = <T>(
  type: string,
  expectedId: string,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent<ExtensionMessageInbound<T>>) => {
      if (event.data.id === expectedId && event.data.type === type) {
        window.removeEventListener("message", handler);
        if (!event.data.success) {
          console.error(
            `Received an unsuccessful error message: ${JSON.stringify(
              event.data,
            )}`,
          );
          reject(event.data.error);
          return;
        }
        resolve(event.data.data as T);
      }
    };
    window.addEventListener("message", handler);
    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Timeout waiting for extension message"));
    }, 5000);
  });
};

export { sendMessageToExtension, listenForExtensionMessage, generateMessageId };
