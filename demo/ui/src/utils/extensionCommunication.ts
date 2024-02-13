import { v4 as uuidv4 } from "uuid";

export interface ExtensionMessage {
  type: string;
  data: any;
}

const generateMessageId = (type: string) => {
  return `${type}:${uuidv4()}`;
};
const sendMessageToExtension = (id: string, type: string, data: any) => {
  const message = { id, type, data };
  window.postMessage(message, "*");
  return message;
};

const listenForExtensionMessage = <T>(
  type: string,
  expectedId: string,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent<ExtensionMessage>) => {
      if (event.data?.id === expectedId && event.data?.type === type) {
        window.removeEventListener("message", handler);
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
