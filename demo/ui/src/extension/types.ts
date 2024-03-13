enum ExtensionMessageType {
  SIGN_ENCRYPT_REQ = "SIGN_ENCRYPT_REQ",
  SIGN_ENCRPYT_REQ_RESULT = "SIGN_ENCRYPT_REQ_RESULT",
  VERIFY_DECRYPT_RESP = "VERIFY_DECRYPT_RESP",
  VERIFY_DECRYPT_RESP_RESULT = "VERIFY_DECRYPT_RESP_RESULT",
  CREATE_SESSION = "CREATE_SESSION",
  CREATE_SESSION_RESULT = "CREATE_SESSION_RESULT",
  LOGIN_REQUEST = "LOGIN_REQUEST",
  LOGIN_REQUEST_RESULT = "LOGIN_REQUEST_RESULT",
}

interface ExtensionMessageOutbound<T> {
  id: string;
  type: ExtensionMessageType;
  data: T;
}

type ExtensionMessageInbound<T> = (
  | { success: true; data: T }
  | { success: false; error: unknown }
) & { id: string; type: ExtensionMessageType };

interface SignEncryptResponse {
  signedHeaders: Headers;
  essrBody?: any; // We just pass this directly though, so doesn't need strict typing.
}

export type {
  ExtensionMessageInbound,
  ExtensionMessageOutbound,
  SignEncryptResponse,
};
export { ExtensionMessageType };
