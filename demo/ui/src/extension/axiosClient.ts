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
} from "./communication";
import { ExtensionMessageType, SignEncryptResponse } from "./types";

/**
 * Creates an Axios client configured with request and response interceptors.
 * @returns client A configured Axios instance.
 *
 * The client includes a request interceptor to verify response signatures and decrypt any cipher material.
 * It also includes a response interceptor to sign and/or encrypt the response.
 */
const createAxiosClient = (): AxiosInstance => {
  const client = axios.create();

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const messageId = generateMessageId(
        ExtensionMessageType.SIGN_ENCRYPT_REQ,
      );
      const extMessage = listenForExtensionMessage<SignEncryptResponse>(
        ExtensionMessageType.SIGN_ENCRPYT_REQ_RESULT,
        messageId,
      );

      sendMessageToExtension({
        id: messageId,
        type: ExtensionMessageType.SIGN_ENCRYPT_REQ,
        data: {
          url: config.baseURL ? `${config.baseURL}/${config.url}` : config.url,
          method: config.method?.toUpperCase(),
          body: config.data,
        },
      });

      const { signedHeaders, essrBody } = await extMessage;
      config.headers = {
        ...config.headers,
        ...JSON.parse(JSON.stringify(signedHeaders)),
      } as AxiosRequestHeaders;

      config.data = essrBody;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    async (response: AxiosResponse) => {
      const messageId = generateMessageId(
        ExtensionMessageType.VERIFY_DECRYPT_RESP,
      );
      // Will throw if it does not verify.
      const extMessage = listenForExtensionMessage<any>(
        ExtensionMessageType.VERIFY_DECRYPT_RESP_RESULT,
        messageId,
      );

      sendMessageToExtension({
        id: messageId,
        type: ExtensionMessageType.VERIFY_DECRYPT_RESP,
        data: {
          url: response.config.baseURL
            ? `${response.config.baseURL}/${response.config.url}`
            : response.config.url,
          method: response.config.method?.toUpperCase(),
          headers: response.headers,
          body: response.data,
        },
      });

      response.data = await extMessage;
      return response;
    },
    async (error) => {
      return Promise.reject(error);
    },
  );

  return client;
};

export { createAxiosClient };
