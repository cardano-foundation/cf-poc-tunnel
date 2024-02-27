import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./connect.scss";
import { BackButton } from "@components/backButton";
import { QRCode } from "react-qrcode-logo";
import { shortenText } from "@src/utils";
import webLogo from "@assets/web.png";
import { COMMUNICATION_AID } from "@src/core/background";
import idwLogo from "@assets/idw.png";

interface Comm {
  id: string;
  name: string;
  tunnelAid: string;
  tunnelOobiUrl: string;
}

function Connect() {
  const [comm, setComm] = useState<Comm | undefined>(undefined);
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    chrome.storage.local.get([COMMUNICATION_AID]).then((c) => {
      console.log("comm");
      console.log(c);
      setComm(c.idw);
      setShowSpinner(false);
    });
  },[]);

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
              value={comm?.tunnelOobiUrl}
              size={192}
              fgColor={"black"}
              bgColor={"white"}
              qrStyle={"squares"}
              logoImage={idwLogo}
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
          <strong>Name: </strong> {comm?.name.replace("-", ":")}
        </p>
        <p>
          <strong>Comm AID: </strong>
          {comm?.tunnelAid.length && shortenText(comm?.tunnelAid, 24)}
        </p>
        <p>
          <strong>Comm OOBI: </strong>
          {shortenText(comm?.tunnelOobiUrl, 24)}
        </p>
      </div>
    </div>
  );
}

export { Connect };
