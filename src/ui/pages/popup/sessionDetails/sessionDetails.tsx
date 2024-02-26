import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./sessionDetails.scss";
import { BackButton } from "@components/backButton";
import MobileConnectIcon from "@assets/mobile-connect-icon.svg";
import { shortenText } from "@src/utils";
import { Session } from "../sessionList/sessionList";

function SessionDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = location.state?.session;
  if (!session) {
    return <div>No session data available</div>;
  }
  const handleLogin = () => {
    navigate(`/${session.id}/connect`, { state: { session } });
  };

  const deleteSession = () => {
    chrome.storage.local.get(["sessions"], function (result) {
      const ss = result.sessions.filter((s: Session) => session.id !== s.id);

      chrome.storage.local.set({ sessions: ss }, function () {
        navigate(-1);
      });
    });
  };

  return (
    <div className="sessionDetails">
      <BackButton />
      <div className="certificate">
        <h1>
          {session.name} <span className="starIcon">★</span>
        </h1>
        <div className="session-info">
          <p>
            <strong>
              {session.expiryDate ? (
                <>Expiration:</>
              ) : (
                <>
                  <div className="loginLabel" onClick={handleLogin}>
                    <img src={MobileConnectIcon} width={20} /> Login with your
                    wallet{" "}
                  </div>
                </>
              )}
            </strong>{" "}
            {session.expiryDate}
          </p>
          <p>
            <strong>Server AID:</strong> {shortenText(session.serverAid, 24)}
          </p>
          <p>
            <strong>Tunnel AID:</strong> {shortenText(session.tunnelAid, 24)}
          </p>
          <p>
            <strong>Server OOBI: </strong>
            {shortenText(session.serverOobi?.metadata?.oobi, 24)}
            {session.serverOobi?.done ? " ✅" : ""}
          </p>
          <p>
            <strong>Tunnel OOBI:</strong>{" "}
            {shortenText(session.tunnelOobiUrl, 24)}
          </p>
          <p>
            <strong>Created at:</strong>{" "}
            {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>
        <button className="deleteButton" onClick={() => deleteSession()}>
          Delete
        </button>
      </div>
    </div>
  );
}

export { SessionDetails };
