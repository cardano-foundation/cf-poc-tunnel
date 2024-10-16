import React, { useEffect, useState } from "react";
import "./connect.scss";
import { BackButton } from "@components/backButton";
import { QRCode } from "react-qrcode-logo";
import { shortenText } from "@src/utils";
import {
  LocalStorageKeys,
  logger,
} from "@src/core/background";
import idwLogo from "@assets/idw.png";
import { ExtensionMessageType } from "@src/core/background/types";
import { useNavigate } from "react-router";

export interface Comm {
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
  const navigate = useNavigate();

  useEffect(() => {
    chrome.storage.local.get([LocalStorageKeys.WALLET_CONNECTION_TUNNEL_AID]).then((c) => {
      setComm(c[LocalStorageKeys.WALLET_CONNECTION_TUNNEL_AID]);
      setShowSpinner(false);
    });

    // Shouldn't happen but just in case.
    chrome.storage.local.get([LocalStorageKeys.WALLET_PONG_RECEIVED]).then((result) => {
      if (result[LocalStorageKeys.WALLET_PONG_RECEIVED] === true) {
        navigate(-1);
      }
    });
  }, []);

  const openQRScanner = async () => {
    chrome.tabs.create({url: chrome.runtime.getURL("/src/ui/pages/qrscanner/index.html")})
  }

  const handleResolveOObi = async () => {
    setIsResolving(true);

    // @TODO - foconnor: Instant feedback.
    // chrome.runtime.onMessage.addListener((message, _, __) => {
    // });
    
    const resolveOobiResult = await chrome.runtime.sendMessage({
      type: ExtensionMessageType.RESOLVE_WALLET_OOBI,
      data: {
        url: oobiUrl,
      }
    });

    if (!resolveOobiResult.success) {
      await logger.addLog(`❌ Resolving wallet OOBI failed: ${oobiUrl} - trace: ${resolveOobiResult.error}`);
      setIsResolving(false);
      return;
    }

    await chrome.storage.local.set({
      [LocalStorageKeys.WALLET_CONNECTION_IDW_AID]: resolveOobiResult.data.response.i,
    });

    await logger.addLog(`✅ Wallet OOBI resolved successfully: ${oobiUrl}`);

    setOobiUrl("");
    setIsResolving(false);
  };

  const copyQrCode = async () => {
    try {
      if (!comm) return;
      await navigator.clipboard.writeText(comm.tunnelOobiUrl);
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
          onClick={() => handleResolveOObi()}
          disabled={isResolving}
        >
          {isResolving ? <div className="spinner-button"></div> : "Resolve"}
        </button>
        <button
            className="qrcode-button"
            onClick={() => openQRScanner()}
        >
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <rect x="4" y="4" width="6" height="6" rx="1" />
            <line x1="7" y1="17" x2="7" y2="17.01" />
            <rect x="14" y="4" width="6" height="6" rx="1" />
            <line x1="7" y1="7" x2="7" y2="7.01" />
            <rect x="4" y="14" width="6" height="6" rx="1" />
            <line x1="17" y1="7" x2="17" y2="7.01" />
            <line x1="14" y1="14" x2="17" y2="14" />
            <line x1="20" y1="14" x2="20" y2="14.01" />
            <line x1="14" y1="14" x2="14" y2="17" />
            <line x1="14" y1="20" x2="17" y2="20" />
            <line x1="17" y1="17" x2="20" y2="17" />
            <line x1="20" y1="17" x2="20" y2="20" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { Connect };
