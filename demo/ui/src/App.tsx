import React, { useState } from "react";
import govLogo from "./assets/gov.png";
import "./App.scss";
import { createAxiosClient } from "./extension/axiosClient";
import {
  generateMessageId,
  listenForExtensionMessage,
  sendMessageToExtension,
} from "./extension/communication";
import {ExtensionMessageType, RolesType} from "./extension/types";
import { AxiosError } from "axios";
import {Header} from "./components/Header";
import {HeroSection} from "./components/HeroSection";

const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;

const App: React.FC = () => {
  const [sessionCreated, setSessionCreated] = useState(false);
  const [selectedRole] = useState(RolesType.User);
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
        serverEndpoint: SERVER_ENDPOINT,
      },
    });

    await extMessage;
    setSessionCreated(true);
  };

  const handleLogin = async () => {

    let response, acdcRequirements;
    try {
      response = await fetch(`${SERVER_ENDPOINT}/acdc-requirements`);
      acdcRequirements = await response.json();
    } catch (e) {
      console.error(e);
      return;
    }

    const messageId = generateMessageId(ExtensionMessageType.LOGIN_REQUEST);
    const extMessage = listenForExtensionMessage<Record<string, string>>(
        ExtensionMessageType.LOGIN_REQUEST_RESULT,
        messageId,
    );

    sendMessageToExtension({
      id: messageId,
      type: ExtensionMessageType.LOGIN_REQUEST,
      data: {
        serverEndpoint: SERVER_ENDPOINT,
        filter: acdcRequirements[selectedRole]
      },
    });

    await extMessage;
  }

  const handleFetch = async () => {
    const axiosClient = createAxiosClient();
    try {
      const response = await axiosClient.post(`${SERVER_ENDPOINT}/ping`, {
        dummy: "data",
      });
      setSignedHeaders(JSON.parse(JSON.stringify(response.headers)));
      setResponseBody(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          alert(err.response.data ?? "Not logged in!");
          return;
        }
      }
      throw err;
    }
    };

  return (
    <>
      <Header />
      <main>
        <HeroSection />
      </main>

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
              <button className="button" onClick={() => handleLogin()}>
                2. Login
              </button>
            </>
        ) : null}
        {sessionCreated ? (
          <>
            <button className="button" onClick={() => handleFetch()}>
              3. View LEI details {Object.keys(signedHeaders).length ? "✅" : null}
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
