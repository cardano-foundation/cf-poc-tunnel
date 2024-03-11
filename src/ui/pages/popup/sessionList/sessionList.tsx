import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Countdown } from "@components/countdown";
import "./sessionList.scss";
import MobileConnectIcon from "../../../assets/mobile-connect-icon.svg";
import webLogo from "../../../assets/web.png";
import { failure, isExpired } from "@src/utils";
import {
  LOCAL_STORAGE_SESSIONS,
  logger,
  SERVER_ENDPOINT,
} from "@src/core/background";
import { LOCAL_STORAGE_WALLET_CONNECTION } from "@pages/popup/connect/connect";
import { ExtensionMessageType } from "@src/core/background/types";

interface Session {
  id: string;
  name: string;
  expiryDate: string;
  loggedIn: boolean;
  logo: string;
  tunnelAid: string;
  serverAid: string;
  serverOobi: any;
  tunnelOobiUrl: string;
  createdAt: number;
  acdc: any;
}

function SessionList() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [walletConnectionAid, setWalletConnectionAid] = useState<string | undefined>(undefined);

  const handleNavigation = (
    option: string,
    p?: { state: { session: Session } },
  ) => {
    navigate(option, p);
  };

  useEffect(() => {
    chrome.storage.local.get([LOCAL_STORAGE_SESSIONS], function (result) {
      setSessions(result.sessions || []);
    });

    chrome.storage.local
      .get([LOCAL_STORAGE_WALLET_CONNECTION])
      .then((result) => {
        setWalletConnectionAid(result[LOCAL_STORAGE_WALLET_CONNECTION]);
      });
  }, []);

  const handleLoginRequest = async (webDomain: string) => {
    const walletConnectionAid = await chrome.storage.local.get(LOCAL_STORAGE_WALLET_CONNECTION);
    if (!walletConnectionAid) {
      return failure(new Error("Cannot request a log in as we are not connected to the identity wallet"));
    }
   
    let response;
    try {
      response = await fetch(`${SERVER_ENDPOINT}/oobi`);
      await logger.addLog(`✅ Received OOBI URL from ${SERVER_ENDPOINT}/oobi`);
    } catch (e) {
      await logger.addLog(`❌ Error getting OOBI URL from server: ${SERVER_ENDPOINT}/oobi: ${e}`);
      return;
    }
  
    const serverOobiUrl = (await response.json()).oobis[0];
  
    const { sessions } = await chrome.storage.local.get([LOCAL_STORAGE_SESSIONS]);
    const aid = sessions.find((session: Session) => session.name === webDomain);
  
    if (!aid) {
      await logger.addLog(`❌ Error getting the AID by name: ${webDomain}`);
      return;
    }
  
    try {
      response = await fetch(`${SERVER_ENDPOINT}/acdc-requirements`);
      await logger.addLog(`✅ Received ACDC requirements from ${SERVER_ENDPOINT}/acdc-requirements`);
    } catch (e) {
      return failure(
        new Error(
          `Error getting ACDC requirements from server: ${SERVER_ENDPOINT}/acdc-requirements: ${e}`,
        ),
      );
    }
  
    const acdcRequirements = await response.json();
    const payload = {
      serverEndpoint: SERVER_ENDPOINT,
      serverOobiUrl,
      logo: aid.logo,
      tunnelAid: aid.tunnelAid,
      filter: acdcRequirements.user
    }
  
    const loginRequestResult = await chrome.runtime.sendMessage({
      type: ExtensionMessageType.LOGIN_REQUEST,
      data: {
        recipient: walletConnectionAid[LOCAL_STORAGE_WALLET_CONNECTION],
        payload,
      }
    });
  
    if (!loginRequestResult.success) {
      await logger.addLog(`❌ Message sent to IDW failed: ${loginRequestResult.error}`);
      return;
    }
    await logger.addLog(`📩 Message successfully sent to IDW, message: ${JSON.stringify(payload)}`);
  }

  const handleConnect = () => {
    handleNavigation(`/connect`);
  };

  const handleInfo = (session: Session) => {
    handleNavigation(`/${session.id}`, { state: { session } });
  };

  if (!sessions.length) {
    return <h2>No sessions yet</h2>;
  }

  return (
    <>
      {!walletConnectionAid ? (
        <>
          <div className="connectButtonContainer">
            {/*@TODO: implement ping condition to check connection status*/}
            <button className="iconButton" onClick={() => handleConnect()}>
              <img className="icon" src={MobileConnectIcon} width={30} />
              <span className="label">Connect with Wallet</span>
            </button>
          </div>
          <hr className="separator" />
        </>
      ) : null}
      <ul className="list">
        {sessions.map((session) => {
          return (
            <li key={session.id} className="listItem">
              <div className="sessionName">
                <div className="sessionLogo">
                  <img
                    className={session.logo?.length ? "" : "smallIcon"}
                    src={session.logo?.length ? session.logo : webLogo}
                    width={32}
                  />
                </div>
                <div className="primaryText domainName">{session.name}</div>
                <div className="secondaryText">
                  {session.expiryDate && isExpired(session.expiryDate) ? (
                    <>Expired</>
                  ) : (
                    <Countdown expiryDate={session.expiryDate} />
                  )}
                </div>
              </div>
              {walletConnectionAid && !session.loggedIn ? (
                <button
                  className="iconButton"
                  onClick={() => handleLoginRequest(session.name)}
                >
                  <img className="icon" src={MobileConnectIcon} width={30} />
                  <span className="label">Login</span>
                </button>
              ) : null}
              <div className="buttonGroup">
                <span
                  onClick={() => handleInfo(session)}
                  className="infoButton"
                >
                  {" "}
                  →{" "}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export { SessionList, Session };
