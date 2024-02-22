import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Countdown } from "@components/countdown";
import "./sessionList.scss";
import MobileConnectIcon from "../../../assets/mobile-connect-icon.svg";
import webLogo from "../../../assets/web.png";
import { isExpired } from "@src/utils";
import { LOCAL_STORAGE_SESSIONS } from "../sessionDetails/sessionDetails";

interface Session {
  id: string;
  name: string;
  expiryDate: string;
  logo: string;
  tunnelAid: string;
  serverAid: string;
  serverOobi: any;
  tunnelOobiUrl: any;
  createdAt: number;
  acdc: any;
}

function SessionList() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);

  const handleNavigation = (
    option: string,
    p: { state: { session: Session } },
  ) => {
    navigate(option, p);
  };

  useEffect(() => {
    chrome.storage.local.get([LOCAL_STORAGE_SESSIONS], function (result) {
      setSessions(result.sessions || []);
    });
  }, []);

  const handleConnect = (session: Session) => {
    handleNavigation(`/${session.id}/connect`, { state: { session } });
  };

  const handleInfo = (session: Session) => {
    handleNavigation(`/${session.id}`, { state: { session } });
  };

  if (!sessions.length) {
    return <h2>No sessions yet</h2>;
  }

  return (
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
            {!session.expiryDate || session.expiryDate === "" ? (
              <button
                className="iconButton"
                onClick={() => handleConnect(session)}
              >
                <img className="icon" src={MobileConnectIcon} width={30} />
                <span className="label">Login</span>
              </button>
            ) : null}
            <div className="buttonGroup">
              <span onClick={() => handleInfo(session)} className="infoButton">
                {" "}
                →{" "}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export { SessionList, Session };
