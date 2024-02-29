import React, { useEffect, useState } from "react";
import "./connect.scss";
import { BackButton } from "@components/backButton";
import { QRCode } from "react-qrcode-logo";
import { failure, shortenText } from "@src/utils";
import {
  COMMUNICATION_AID,
  LOCAL_STORAGE_WALLET_CONNECTIONS,
  logger,
  signifyApi,
} from "@src/core/background";
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
  const [oobiUrl, setOobiUrl] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    chrome.storage.local.get([COMMUNICATION_AID]).then((c) => {
      setComm(c.idw);
      setShowSpinner(false);
    });
  }, []);

  const handleResolveOObi = async () => {
    if (oobiUrl.length && oobiUrl.includes("oobi")) {
      setIsResolving(true);
      const resolveOobiResult = await signifyApi.resolveOOBI(oobiUrl);

      if (!resolveOobiResult.success) {
        return failure(
          new Error(
            `Error resolving server OOBI URL ${oobiUrl}: ${resolveOobiResult.error}`,
          ),
        );
      }
      await logger.addLog(`✅ Wallet OOBI resolved successfully: ${oobiUrl}`);

      const { walletConnections } = await chrome.storage.local.get([
        LOCAL_STORAGE_WALLET_CONNECTIONS,
      ]);
      const walletConnectionsObj = walletConnections || {};
      walletConnectionsObj[resolveOobiResult.data.response.i] =
        resolveOobiResult.data;

      await chrome.storage.local.set({
        walletConnections: walletConnectionsObj,
      });

      setOobiUrl("");
      setIsResolving(false);
    }
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
      <hr className="separator" />
      <div className="resolve-section">
        <input
          type="text"
          className="resolve-input"
          placeholder="Insert OOBI URL"
          onChange={(e) => setOobiUrl(e.target.value)}
        />
        <button
          className="resolve-button"
          onClick={() => handleResolveOObi()}
          disabled={isResolving}
        >
          {isResolving ? <div className="spinner-button"></div> : "Resolve"}
        </button>
      </div>
    </div>
  );
}

export { Connect };
