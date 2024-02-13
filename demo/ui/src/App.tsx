// src/App.tsx
import React, { useEffect, useState } from "react";
import govLogo from "./assets/gov.png";
import "./App.scss";
import { createAxiosClient, ExtensionMessageType } from "./axiosClient";
import {listenForExtensionMessage, sendMessageToExtension} from "./utils/extensionCommunication";

const App: React.FC = () => {
  const [sessionCreated, setSessionCreated] = useState(false);
  const [signedHeaders, setSignedHeaders] = useState<Record<string, string>>(
    {},
  );

  const handleCreateSession = async () => {
    const enterpriseData = {};
    const message = sendMessageToExtension(
        ExtensionMessageType.CREATE_SESSION,
        enterpriseData,
    );
    const {success} = await listenForExtensionMessage<Record<string, string>>(
        ExtensionMessageType.SESSION_CREATED,
        message.id,
    );

    if (success) {
      setSessionCreated(true);
    }
  };


  const handleFetch = async () => {
    try {
      const axiosClient = createAxiosClient("http://localhost:3001");
      const response = await axiosClient.get("/ping");
      console.log("Data:", response.data);
    } catch (error) {
      const serializedHeads = {};
      if (error.config.headers) {
        Object.entries(error.config.headers).forEach(([key, value]) => {
          serializedHeads[key] = value;
        });
        setSignedHeaders(serializedHeads);
      }
    }
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
        </>
      ) : null}
    </>
  );
};

export { App };
