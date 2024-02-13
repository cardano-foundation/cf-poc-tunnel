import axios, {
  AxiosInstance,
  AxiosRequestHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  generateMessageId,
  listenForExtensionMessage,
  sendMessageToExtension,
} from "./utils/extensionCommunication";

enum ExtensionMessageType {
  SIGN_HEADERS = "SIGN_HEADERS",
  VERIFY_HEADERS = "VERIFY_HEADERS",
  HEADERS_VERIFIED = "HEADERS_VERIFIED",
  SIGNED_HEADERS = "SIGNED_HEADERS",
  CREATE_SESSION = "CREATE_SESSION",
  SESSION_CREATED = "SESSION_CREATED",
}

/**
 * Creates an Axios client configured with request and response interceptors.
 * @param apiURL The base URL for HTTP requests.
 * @returns client A configured Axios instance.
 *
 * The client includes a request interceptor to add signed headers to every request
 * by communicating with an extension. It also includes a response interceptor
 * to verify response headers with the extension, ensuring they meet
 * the expected security criteria.
 */
const createAxiosClient = (apiURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL: apiURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const serializedHeaders = {};
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          serializedHeaders[key] = value;
        });
      }

      const messageId = generateMessageId(ExtensionMessageType.SIGN_HEADERS);

      const extMessage = listenForExtensionMessage<Record<string, string>>(
        ExtensionMessageType.SIGNED_HEADERS,
        messageId,
      );

      sendMessageToExtension(messageId, ExtensionMessageType.SIGN_HEADERS, {
        headers: serializedHeaders,
        baseURL: config.baseURL,
        path: config.url,
        method: config.method,
      });

      const { signedHeaders } = await extMessage;
      config.headers = {
        ...config.headers,
        ...signedHeaders,
      } as AxiosRequestHeaders;

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    async (response: AxiosResponse) => {
      const messageId = generateMessageId(ExtensionMessageType.SIGN_HEADERS);

      const extMessage = listenForExtensionMessage<boolean>(
        ExtensionMessageType.HEADERS_VERIFIED,
        messageId,
      );

      sendMessageToExtension(messageId, ExtensionMessageType.VERIFY_HEADERS, {
        headers: response.headers,
      });

      const verificationResult = await extMessage;

      if (!verificationResult) {
        throw new Error("Response headers verification failed.");
      }

      return response;
    },
    async (error) => {
      return Promise.reject(error);
    },
  );

  return client;
};

export { createAxiosClient, ExtensionMessageType };
