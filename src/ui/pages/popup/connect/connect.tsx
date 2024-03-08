import React, { useEffect, useState } from "react";
import "./connect.scss";
import { BackButton } from "@components/backButton";
import { QRCode } from "react-qrcode-logo";
import { failure, shortenText } from "@src/utils";
import {
  IDW_COMMUNICATION_AID_NAME,
  LOCAL_STORAGE_SESSIONS,
  logger,
  SERVER_ENDPOINT,
} from "@src/core/background";
import idwLogo from "@assets/idw.png";
import { Session } from "@pages/popup/sessionList/sessionList";
import { ExtensionMessageType } from "@src/core/background/types";

interface Comm {
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

  const handleLoginRequest = async () => {
    const walletConnectionAid = await chrome.storage.local.get(LOCAL_STORAGE_WALLET_CONNECTION);
    if (!walletConnectionAid) {
      return failure(new Error("Cannot request a log in as we are not connected to the identity wallet"));
    }
    
    const webDomain = "127.0.0.1";

    let response;
    try {
      response = await fetch(`${SERVER_ENDPOINT}/oobi`);
      await logger.addLog(`✅ Received OOBI URL from ${SERVER_ENDPOINT}/oobi`);
    } catch (e) {
      await logger.addLog(`❌ Error getting OOBI URL from server: ${SERVER_ENDPOINT}/oobi: ${e}`);
      return;
    }

    const serverOobiUrl = (await response.json()).oobis[0];

    const { sessions } = await chrome.storage.local.get([LOCAL_STORAGE_SESSIONS]);
    const aid = sessions.find((session: Session) => session.name === webDomain);

    if (!aid) {
      await logger.addLog(`❌ Error getting the AID by name: ${webDomain}`);
      return;
    }

    try {
      response = await fetch(`${SERVER_ENDPOINT}/acdc-requirements`);
      await logger.addLog(`✅ Received ACDC requirements from ${SERVER_ENDPOINT}/acdc-requirements`);
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
      filter: acdcRequirements.user
    }

    const loginRequestResult = await chrome.runtime.sendMessage({
      type: ExtensionMessageType.LOGIN_REQUEST,
      data: {
        recipient: walletConnectionAid[LOCAL_STORAGE_WALLET_CONNECTION],
        payload,
      }
    });

    if (!loginRequestResult.success) {
      await logger.addLog(`❌ Message sent to IDW failed: ${loginRequestResult.error}`);
      return;
    }
    await logger.addLog(`📩 Message successfully sent to IDW, message: ${JSON.stringify(payload)}`);
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
      console.error('Clipboard error: ', error);
    }
  }

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
      </div>
      <div className="resolve-section">
        <button
            className="resolve-button"
            onClick={() => handleLoginRequest()}
            disabled={isResolving}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export { Connect };
