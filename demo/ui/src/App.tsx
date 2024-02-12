// src/App.tsx
import React, { useEffect, useState } from "react";
import govLogo from "./assets/gov.png";
import "./App.scss";
import { createAxiosClient, ExtensionMessageType } from "./axiosClient";
import { sendMessageToExtension } from "./utils/extensionCommunication";

const App: React.FC = () => {
  const [sessionCreated, setSessionCreated] = useState(false);
  const [signedHeaders, setSignedHeaders] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin) {
        const message = event.data;
        switch (message?.type) {
          case ExtensionMessageType.SIGNED_HEADERS:
            setSignedHeaders(message.data.signedHeaders);
            break;
          case ExtensionMessageType.SESSION_CREATED:
            setSessionCreated(true);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleCreateSession = async () => {
    const enterpriseData = {};
    sendMessageToExtension(ExtensionMessageType.CREATE_SESSION, enterpriseData);
  };

  const handleFetch = async () => {
    try {
      const axiosClient = createAxiosClient("http://localhost:3001");
      const response = await axiosClient.get("/ping");
      console.log("Data:", response.data);
    } catch (error) {
      console.error("Error on fetch:", error);
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
              2. Sign Headers {Object.keys(signedHeaders).length ? "✅" : null}
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
