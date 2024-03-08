import { v4 as uuidv4 } from "uuid";
import { ExtensionMessageInbound, ExtensionMessageOutbound, ExtensionMessageType } from "./types";

const COMMUNICATION_TIMEOUT = 10000;

const generateMessageId = (type: ExtensionMessageType) => {
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
      reject(new Error(`Timeout waiting for extension message:${COMMUNICATION_TIMEOUT/1000} seconds`));
    }, COMMUNICATION_TIMEOUT);
  });
};

export { sendMessageToExtension, listenForExtensionMessage, generateMessageId };
