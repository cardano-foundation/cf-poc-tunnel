export interface EssrBody {
  sig: string;
  cipher: JSONValue;
}

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
  [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> {}

export type ResponseData<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };

// These should be in a common types package.
export enum ExtensionMessageType {
  SIGN_ENCRYPT_REQ = "SIGN_ENCRYPT_REQ",
  SIGN_ENCRPYT_REQ_RESULT = "SIGN_ENCRYPT_REQ_RESULT",
  VERIFY_DECRYPT_RESP = "VERIFY_DECRYPT_RESP",
  VERIFY_DECRYPT_RESP_RESULT = "VERIFY_DECRYPT_RESP_RESULT",
  CREATE_SESSION = "CREATE_SESSION",
  CREATE_SESSION_RESULT = "CREATE_SESSION_RESULT",
  GENERIC_ERROR = "ERROR_STREAM"
}

export type ExtensionMessage<T> = ResponseData<T> & {
  id: string;
  type: ExtensionMessageType;
};
