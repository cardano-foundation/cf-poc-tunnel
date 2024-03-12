import React, { useEffect, useState } from "react";
import "./connect.scss";
import { BackButton } from "@components/backButton";
import { QRCode } from "react-qrcode-logo";
import { shortenText } from "@src/utils";
import {
  IDW_COMMUNICATION_AID_NAME,
  logger,
} from "@src/core/background";
import idwLogo from "@assets/idw.png";
import { ExtensionMessageType } from "@src/core/background/types";

export interface Comm {
  id: string;
  name: string;
  tunnelAid: string;
  tunnelOobiUrl: string;
}

export const LOCAL_STORAGE_WALLET_CONNECTION = "walletConnectionAid";

function Connect() {
  const [comm, setComm] = useState<Comm | undefined>(undefined);
  const [showSpinner, setShowSpinner] = useState(true);
  const [oobiUrl, setOobiUrl] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    chrome.storage.local.get([IDW_COMMUNICATION_AID_NAME]).then((c) => {
      setComm(c.idw);
      setShowSpinner(false);
    });
  }, []);

  const openQRScanner = async () => {
    chrome.tabs.create({url: chrome.runtime.getURL("/src/ui/pages/qrscanner/index.html")})
  }

  const handleResolveOObi = async () => {
    setIsResolving(true);
    
    const resolveOobiResult = await chrome.runtime.sendMessage({
      type: ExtensionMessageType.RESOLVE_WALLET_OOBI,
      data: {
        url: oobiUrl,
      }
    });

    if (!resolveOobiResult.success) {
      await logger.addLog(`❌ Resolving wallet OOBI failed: ${oobiUrl}`);
      setIsResolving(false);
      return;
    }

    await chrome.storage.local.set({
      [LOCAL_STORAGE_WALLET_CONNECTION]: resolveOobiResult.data.response.i,
    });

    await logger.addLog(`✅ Wallet OOBI resolved successfully: ${oobiUrl}`);

    setOobiUrl("");
    setIsResolving(false);
  };

  const copyQrCode = async () => {
    try {
      if (!comm) return;
      await navigator.clipboard.writeText(comm?.tunnelOobiUrl);
    } catch (error) {
      console.error("Clipboard error: ", error);
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
            {!comm ? (
              <>
                <p>
                  Something went wrong during installation while generating the
                  communication OOBI
                </p>
              </>
            ) : (
              <div className="pointer" onClick={() => copyQrCode()}>
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
            )}
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
          {comm?.tunnelOobiUrl ? shortenText(comm?.tunnelOobiUrl, 24) : ""}
        </p>
      </div>
      <hr className="separator" />
      <div className="resolve-section">
        <input
          value={oobiUrl}
          type="text"
          className="resolve-input"
          placeholder="Insert OOBI URL"
          onChange={(e) => setOobiUrl(e.target.value)}
        />
        <button
            className="resolve-button"
            onClick={() => openQRScanner()}
        >
          QR Code
        </button>
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
