import React, { useState } from "react";
import idwLogo from "../assets/idw.png";
import { eventBus } from "../utils/EventBus";
import {
  generateMessageId,
  listenForExtensionMessage,
  sendMessageToExtension,
} from "../extension/communication";
import { ExtensionMessageType } from "../extension/types";
import {SERVER_ENDPOINT, useAuth} from "../components/AuthProvider";

const LoginPage: React.FC = () => {
  const { setIsLoggedIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");

  const handleLogin = async () => {
    if (!selectedRole.length)
      eventBus.publish("toast", {
        message: "Please, select a role before login",
        type: "danger",
        duration: 3000,
      });

    let response, acdcRequirements;
    try {
      response = await fetch(`${SERVER_ENDPOINT}/acdc-requirements`);
      acdcRequirements = await response.json();
    } catch (e) {
      eventBus.publish("toast", {
        message: `Fetching ACDC requirements failed. ${JSON.stringify(e)}`,
        type: "danger",
        duration: 5000,
      });
      setIsLoggedIn(false);
      return;
    }

    try {
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
          filter: acdcRequirements[selectedRole],
        },
      });

      await extMessage;

      eventBus.publish("toast", {
        message: `Login successfully`,
        type: "success",
        duration: 3000,
      });
      setIsLoggedIn(true);
    } catch (e) {
      eventBus.publish("toast", {
        message: `Error: ${JSON.stringify(e)}`,
        type: "danger",
        duration: 5000,
      });
      setIsLoggedIn(false);
    }
  };

  return (
    <div className="relative h-screen flex items-center justify-center text-center bg-lobby bg-cover bg-no-repeat">
      <div className="hero-content z-10 max-w-lg w-full p-8 bg-black bg-opacity-80 rounded-lg shadow-md">
        <h1 className="font-bold text-white text-3xl md:text-4xl mb-6">
          Access with Your Digital Identity
        </h1>
        <div className="space-y-6">
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value.toLowerCase())}
              className="appearance-none w-full p-3 pl-4 pr-8 rounded-md bg-gray-800 text-white"
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="user">User</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M5.516 7.548c.436-.446 1.043-.481 1.576 0l2.908 2.83 2.908-2.83c.533-.481 1.141-.446 1.576 0 .436.445.408 1.197 0 1.642l-3.74 3.625c-.436.446-1.141.481-1.576 0l-3.74-3.625c-.408-.445-.436-1.196 0-1.642z" />
              </svg>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogin}
            disabled={!selectedRole.length}
            style={{
              backgroundImage:
                "linear-gradient(94.29deg, #92ffc0 20.19%, #00a5e6 119.98%)",
            }}
            className="w-full py-3 px-4 text-black rounded-md focus:ring-4 focus:ring-blue-300 focus:outline-none transition duration-150 ease-in-out flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Login with ID Wallet
            <img src={idwLogo} alt="Wallet Logo" className="ml-2 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
