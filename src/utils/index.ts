import {
  ExtensionMessage,
  ExtensionMessageType,
  ResponseData,
} from "@src/core/background/types";
import { uid } from "uid";

type Header = {
  [key: string]: any;
};
const isExpired = (date: string): boolean => {
  const dateObj = new Date(date);
  const currentDate = new Date();
  return dateObj < currentDate;
};

const getCurrentDate = (additionalMillis = 0) => {
  const now = new Date(Date.now() + additionalMillis);
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  const min = now.getMinutes().toString().padStart(2, "0");
  const sec = now.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
};

const generateAID = async (): Promise<{ pubKey: string; privKey: string }> => {
  return {
    pubKey: uid(12),
    privKey: uid(12),
  };
};

const convertURLImageToBase64 = (url: string): Promise<string> => {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob();
    })
    .then((blob) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // @TODO - foconnor: Better handle typing issues later.
        // @ts-ignore
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    });
};

const shortenText = (text: string, maxLength = 10) => {
  if (!text) return;
  if (text.length > maxLength) {
    const half = Math.floor(maxLength / 2);
    return text.slice(0, half) + "..." + text.slice(-half);
  } else {
    return text;
  }
};

const serializeHeaders = (headers: Headers) => {
  const headersObj: Header = {};
  for (const [key, value] of headers.entries()) {
    headersObj[key] = value;
  }
  return headersObj;
};

const parseHeaders = (serializedHeaders: Header) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(serializedHeaders)) {
    headers.append(key, value);
  }
  return headers;
};

const success = <T>(data: T): ResponseData<T> => {
  return {
    success: true,
    data,
  };
};

const failure = <T>(error: unknown): ResponseData<T> => {
  return {
    success: false,
    error,
  };
};

const successExt = <T>(
  id: string,
  type: ExtensionMessageType,
  data: T,
): ExtensionMessage<T> => {
  return {
    success: true,
    id,
    type,
    data,
  };
};

const failureExt = <T>(
  id: string,
  type: ExtensionMessageType,
  error: unknown,
): ExtensionMessage<T> => {
  console.error(`Returning error from extension: ${error}`);
  return {
    success: false,
    id,
    type,
    error: error instanceof Error ? error.message : error,
  };
};

export {
  isExpired,
  getCurrentDate,
  generateAID,
  convertURLImageToBase64,
  shortenText,
  serializeHeaders,
  parseHeaders,
  success,
  failure,
  successExt,
  failureExt,
};
