import React, { useEffect } from "react";
import "./App.scss";
import {
  generateMessageId,
  listenForExtensionMessage,
  sendMessageToExtension,
} from "./extension/communication";
import { ExtensionMessageType } from "./extension/types";
import { Header } from "./components/Header";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { Demo } from "./pages/Demo";
import { eventBus } from "./utils/EventBus";

const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;

const App: React.FC = () => {

  useEffect(() => {
    const handleMessage = (event:any) => {
      if (event.data && event.data.type === ExtensionMessageType.PAGE_ALREADY_VISITED_RESULT) {
        if (!event.data.data.sessionAlreadyCreated){
          handleCreateSession();
        } else {
          eventBus.publish("toast", {
            message: "Session already created, ignore",
            type: "success",
            duration: 3000,
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


  return (
    <>
      <div className="w-screen">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </div>
    </>
  );
};

export { App };
