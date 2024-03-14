import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./sessionList.scss";
import MobileConnectIcon from "../../../assets/mobile-connect-icon.svg";
import webLogo from "../../../assets/web.png";
import { LocalStorageKeys } from "@src/core/background";

interface Session {
  id: string;
  name: string;
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
  const [walletPongReceived, setWalletPongReceived] = useState(false);

  const handleNavigation = (
    option: string,
    p?: { state: { session: Session } },
  ) => {
    navigate(option, p);
  };

  useEffect(() => {
    chrome.storage.local.get([LocalStorageKeys.SESSIONS], function (result) {
      setSessions(result.sessions || []);
    });
    
    chrome.storage.local.get([LocalStorageKeys.WALLET_PONG_RECEIVED]).then((result) => {
      if (result[LocalStorageKeys.WALLET_PONG_RECEIVED] === true) {
        setWalletPongReceived(true);
      }
    });
  }, []);

  const handleConnect = () => {
    handleNavigation(`/connect`);
  };

  const handleInfo = (session: Session) => {
    handleNavigation(`/${session.id}`, { state: { session } });
  };

  return (
    <>
      {walletPongReceived ?
      <h2 className="centerText">Wallet connected</h2> :
      <>
        <div className="connectButtonContainer">
          <button className="iconButton" onClick={() => handleConnect()}>
            <img className="icon" src={MobileConnectIcon} width={30} />
            <span className="label">Connect with Wallet</span>
          </button>
        </div>
        <hr className="separator" />
      </>}
      {sessions.length > 0 ?
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
              </div>
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
      </ul> :
      <h2 className="centerText">No sessions yet</h2>}
    </>
  );
}

export { SessionList, Session };
