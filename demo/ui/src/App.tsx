import React, { useEffect, useState } from "react";
import govLogo from "./assets/gov.png";
import "./App.scss";
import { createAxiosClient } from "./extension/axiosClient";
import {
  generateMessageId,
  listenForExtensionMessage,
  sendMessageToExtension,
} from "./extension/communication";
import { ExtensionMessageType } from "./extension/types";
import { AxiosError } from "axios";
import { Header } from "./components/Header";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { Demo } from "./pages/Demo";
import { eventBus } from "./utils/EventBus";

const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;

const App: React.FC = () => {
  const [sessionCreated, setSessionCreated] = useState(false);
  const [signedHeaders, setSignedHeaders] = useState<Record<string, string>>(
    {},
  );
  const [responseBody, setResponseBody] = useState<any>();

  useEffect(() => {
    const handleMessage = (event) => {
      console.log('event.data');
      console.log(event.data);
      if (event.data && event.data.type === ExtensionMessageType.PAGE_ALREADY_VISITED_RESULT) {
        if (event.data.success){
          eventBus.publish("toast", {
            message: typeof event.data?.data ? event.data.data : "Session created successfully",
            type: "success",
            duration: 3000,
          });
        } else {
          eventBus.publish("toast", {
            message: event.data.error,
            type: "danger",
            duration: 5000,
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleCreateSession = async () => {
    console.log("handleCreateSession");
    try {
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

      eventBus.publish("toast", {
        message: "Session created successfully",
        type: "success",
        duration: 3000,
      });
    } catch (e) {
      eventBus.publish("toast", {
        message: `Error creating a new session. ${JSON.stringify(e)}`,
        type: "danger",
        duration: 5000,
      });
    }
  };

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
      <div>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </div>

      <Header />

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
              3. View LEI details{" "}
              {Object.keys(signedHeaders).length ? "✅" : null}
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
