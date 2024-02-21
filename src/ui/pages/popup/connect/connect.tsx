import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "./connect.scss";
import { BackButton } from "@components/backButton";
import { QRCode } from "react-qrcode-logo";
import { shortenText } from "@src/utils";
import webLogo from "@assets/web.png";

function Connect() {
  const location = useLocation();
  const [session] = useState(location.state?.session);
  const [showSpinner, setShowSpinner] = useState(false);
  if (!session) {
    return <div>No session data available</div>;
  }

  const handleGenerateEaid = () => {
    if (showSpinner) return;

    setShowSpinner(true);

    chrome.runtime.sendMessage(
      {
        type: "SET_PRIVATE_KEY",
        data: {
          ...session,
        },
      },
      (response: { status: string; data: any }) => {
        setShowSpinner(false);
        // setSession(response.data);
        // setQrCodeValue(response.data.oobi);
      },
    );
  };

  return (
    <div className="sessionDetails">
      <BackButton />
      <div className="certificate">
        <h1>Connect with wallet</h1>
        <p className="connectDescription">
          In order to connect, scan the QR code with your identity wallet
        </p>
        <div>
          <div>
            <QRCode
              value={session.tunnelOobiUrl}
              size={192}
              fgColor={"black"}
              bgColor={"white"}
              qrStyle={"squares"}
              logoImage={session.logo?.length ? session.logo : webLogo}
              logoWidth={60}
              logoHeight={60}
              logoOpacity={1}
              quietZone={10}
            />
          </div>
          {showSpinner && (
            <div className="spinnerOverlay">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        <p>
          <strong>Name: </strong> {session.name.replace("-", ":")}
        </p>
        <p>
          <strong>Tunnel AID: </strong>
          {session.tunnelAid.length ? (
            shortenText(session.tunnelAid, 24)
          ) : (
            <span className="generateLabel" onClick={handleGenerateEaid}>
              Generate eAID
            </span>
          )}
        </p>
        <p>
          <strong>Tunnel OOBI: </strong>
          {shortenText(session.tunnelOobiUrl, 24)}
        </p>
      </div>
    </div>
  );
}

export { Connect };
