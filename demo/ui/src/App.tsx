import React, { useState } from "react";
import govLogo from "./assets/gov.png";
import "./App.scss";
import { createAxiosClient } from "./extension/axiosClient";
import {
  generateMessageId,
  listenForExtensionMessage,
  sendMessageToExtension,
} from "./extension/communication";
import { ExtensionMessageType } from "./extension/types";

const BACKEND_URL = "http://localhost:3001";

const App: React.FC = () => {
  const [sessionCreated, setSessionCreated] = useState(false);
  const [signedHeaders, setSignedHeaders] = useState<Record<string, string>>(
    {},
  );
  const [responseBody, setResponseBody] = useState<any>();

  const handleCreateSession = async () => {
    const messageId = generateMessageId(ExtensionMessageType.CREATE_SESSION);
    const extMessage = listenForExtensionMessage<Record<string, string>>(
      ExtensionMessageType.CREATE_SESSION_RESULT,
      messageId,
    );

    sendMessageToExtension({
      id: messageId,
      type: ExtensionMessageType.CREATE_SESSION,
      data: {
        url: BACKEND_URL,
      },
    });

    await extMessage;
    setSessionCreated(true);
  };

  const handleFetch = async () => {
    const axiosClient = createAxiosClient();
    const response = await axiosClient.post(`${BACKEND_URL}/ping`, {
      dummy: "data",
    });
    setSignedHeaders(JSON.parse(JSON.stringify(response.headers)));
    setResponseBody(response.data);
  };

  return (
    <>
      <div>
        <img src={govLogo} className="logo" alt="Vite logo" />
      </div>
      <h1>Web app</h1>
      <div className="buttonsContainer">
        <button className="button" onClick={() => handleCreateSession()}>
          1. Init session {sessionCreated ? "✅" : null}
        </button>
        {sessionCreated ? (
          <>
            <button className="button" onClick={() => handleFetch()}>
              2. Call backend {Object.keys(signedHeaders).length ? "✅" : null}
            </button>
          </>
        ) : null}
      </div>
      {sessionCreated ? (
        <>
          {" "}
          <div>
            {Object.keys(signedHeaders).length ? (
              <>
                <h3>Signed Headers</h3>
                <div className="jsonDisplay">
                  <pre>{JSON.stringify(signedHeaders, null, 2)}</pre>
                </div>
              </>
            ) : null}
          </div>{" "}
          <div>
            {responseBody && (
              <>
                <h3>Decrypted response body</h3>
                <div className="jsonDisplay">
                  <pre>{JSON.stringify(responseBody, null, 2)}</pre>
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </>
  );
};

export { App };
