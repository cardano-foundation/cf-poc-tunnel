import { v4 as uuidv4 } from "uuid";

export interface ExtensionMessage {
  type: string;
  data: any;
}

const sendMessageToExtension = (type: string, data: any) => {
  const id = `${type}:${uuidv4()}`;
  const message = { id, type, data };
  console.log("sendMessageToExtension");
  console.log("message");
  console.log(message);
  window.postMessage(message, "*");
  return message;
};

const listenForExtensionMessage = <T>(type: string, expectedId: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent<ExtensionMessage>) => {
      console.log('event.data');
      console.log(event.data);
      if (event.data.id === expectedId && event.data.type === type) {
        console.log("event.data");
        console.log(event.data);
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

export { sendMessageToExtension, listenForExtensionMessage };
