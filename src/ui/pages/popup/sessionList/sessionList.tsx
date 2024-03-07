import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Countdown } from "@components/countdown";
import "./sessionList.scss";
import MobileConnectIcon from "../../../assets/mobile-connect-icon.svg";
import webLogo from "../../../assets/web.png";
import { failure, isExpired } from "@src/utils";
import {
  COMMUNICATION_AID,
  LOCAL_STORAGE_SESSIONS,
  LOCAL_STORAGE_WALLET_CONNECTIONS,
  logger,
  SERVER_ENDPOINT,
  signifyApi,
} from "@src/core/background";
import { Comm } from "@pages/popup/connect/connect";

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
  const [walletConnect, setWalletConnect] = useState(undefined);

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
      .get([LOCAL_STORAGE_WALLET_CONNECTIONS])
      .then((result) => {
        setWalletConnect(result.walletConnections);
      });
  }, []);

  console.log("walletConnect");
  console.log(walletConnect);

  const handleLogin = async (session: Session) => {
    // Lets login
    const comm: Comm | undefined = (
      await chrome.storage.local.get([COMMUNICATION_AID])
    ).idw;

    console.log("handleLogin");
    console.log(comm);
    if (!comm) return;

    const { walletConnections } = await chrome.storage.local.get([
      LOCAL_STORAGE_WALLET_CONNECTIONS,
    ]);

    if (!walletConnections) return;

    const ids = Object.keys(walletConnections);

    const currentTab = (
      await chrome.tabs.query({ active: true, currentWindow: true })
    )[0];

    if (!currentTab.url) return;

    let response;
    try {
      response = await fetch(`${SERVER_ENDPOINT}/oobi`);
      await logger.addLog(`✅ Received OOBI URL from ${SERVER_ENDPOINT}/oobi`);
    } catch (e) {
      await logger.addLog(
        `❌ Error getting OOBI URL from server: ${SERVER_ENDPOINT}/oobi: ${e}`,
      );
      return;
    }

    const serverOobiUrl = (await response.json()).oobis[0];

    const { sessions } = await chrome.storage.local.get([
      LOCAL_STORAGE_SESSIONS,
    ]);

    const aid = sessions.find((s: Session) => s.name === session.name);

    if (!aid) {
      await logger.addLog(`❌ Error getting the AID by name: ${session.name}`);
      return;
    }

    try {
      response = await fetch(`${SERVER_ENDPOINT}/acdc-requirements`);
      await logger.addLog(
        `✅ Received ACDC requirements from ${SERVER_ENDPOINT}/acdc-requirements`,
      );
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
      filter: acdcRequirements.user,
    };

    const messageSent = await signifyApi.sendMessasge(
      comm.name,
      ids[0],
      payload,
    );

    if (!messageSent.success) {
      await logger.addLog(
        `❌ Message sent to IDW failed: ${messageSent.error}`,
      );
      return;
    }

    await logger.addLog(
      `📩 Login message successfully sent to IDW with AID ${
        ids[0]
      }, message: ${JSON.stringify(messageSent)}`,
    );

    for (const s of sessions) {
      if (s.name === session.name) {
        s.loggedIn = true;
        break;
      }
    }

    await chrome.storage.local.set({ sessions });
    setSessions(sessions);
  };

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
      {!walletConnect ? (
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
              {walletConnect && !session.loggedIn ? (
                <button
                  className="iconButton"
                  onClick={() => handleLogin(session)}
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
