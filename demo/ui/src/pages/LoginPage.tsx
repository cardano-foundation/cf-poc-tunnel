import React, {useEffect, useState} from "react";
import idwLogo from "../assets/idw.png";
import { eventBus } from "../utils/EventBus";
import {
  generateMessageId,
  listenForExtensionMessage,
  sendMessageToExtension,
} from "../extension/communication";
import { ExtensionMessageType } from "../extension/types";
import { SERVER_ENDPOINT, useAuth } from "../components/AuthProvider";
import {createAxiosClient} from "../extension/axiosClient";
import {AxiosError} from "axios";
import {useNavigate} from "react-router-dom";

const LoginPage: React.FC = () => {
  const { setIsLoggedIn, setUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [checkingLogin, setCheckingLogin] = useState<boolean>(false);
  const [counter, setCounter] = useState<number>(15);

  const navigate = useNavigate();

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

      await checkLogin();
    } catch (e) {
      eventBus.publish("toast", {
        message: `Error: ${JSON.stringify(e)}`,
        type: "danger",
        duration: 5000,
      });
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (checkingLogin) {
      setCounter(15);
      intervalId = setInterval(() => {
        setCounter((prevCounter) => {
          if (prevCounter > 1) {
            return prevCounter - 1;
          } else {
            clearInterval(intervalId);
            setCheckingLogin(false);
            return 0;
          }
        });
      }, 1000) as ReturnType<typeof setInterval>;
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [checkingLogin]);

  const checkLogin = async () => {
    setCheckingLogin(true);
    setCounter(12);
    const axiosClient = createAxiosClient();
    const maxAttempts = 12;
    const interval = 1000;
    let attempts = 0;

    const wait = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
      try {
        const result = await axiosClient.post(`${SERVER_ENDPOINT}/ping`, {
          dummy: "data",
        });

        setUser({
          username: result.data.username,
          aid: result.data.aid,
          validUntil: result.data.validUntil,
        });

        setIsLoggedIn(true);
        setCheckingLogin(false);
        eventBus.publish("toast", {
          message: `Login successfully`,
          type: "success",
          duration: 3000,
        });
        navigate("/demo");
        break;
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 401) {
          await wait(interval);
        } else {
          console.error("Error trying to verify login response:", err);
          break;
        }
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      eventBus.publish("toast", {
        message: `Login timeout, please try again`,
        type: "danger",
        duration: 5000,
      });
      setCheckingLogin(false);
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
            onClick={() => handleLogin()}
            disabled={!selectedRole.length || checkingLogin}
            style={{
              backgroundImage:
                "linear-gradient(94.29deg, #92ffc0 20.19%, #00a5e6 119.98%)",
            }}
            className="w-full py-3 px-4 text-black rounded-md focus:ring-4 focus:ring-blue-300 focus:outline-none transition duration-150 ease-in-out flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >

            {checkingLogin ? <>Waiting for IDW to accept login</> : <>Login with ID Wallet</>}
            {checkingLogin ? (
               <>
                 <div className="ml-2 flex items-center justify-center relative">
                   <div className="w-8 h-8 flex items-center justify-center">
                     <div className="absolute border-4 border-t-transparent border-white rounded-full animate-spin h-full w-full"></div>
                     <span className="z-10 text-white text-xs relative">{counter}</span>
                   </div>
                 </div>
               </>
            ) : (
                <img src={idwLogo} alt="Wallet Logo" className="ml-2 w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
