import React from "react";
import { useLocation } from "react-router-dom";
import "./sessionDetails.scss";
import { BackButton } from "@components/backButton";
import { shortenText } from "@src/utils";

function SessionDetails() {
  const location = useLocation();
  const session = location.state?.session;

  if (!session) {
    return <div>No session data available</div>;
  }

  return (
    <div className="sessionDetails">
      <BackButton />
      <div className="certificate">
        <h1>
          {session.name} <span className="starIcon">★</span>
        </h1>
        <div className="session-info">
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
      </div>
    </div>
  );
}

export { SessionDetails };
