import React, { useEffect, useState } from "react";
import "./connect.scss";
import { BackButton } from "@components/backButton";
import { QRCode } from "react-qrcode-logo";
import {failure, shortenText} from "@src/utils";
import {
  COMMUNICATION_AID, LOCAL_STORAGE_SESSIONS,
  LOCAL_STORAGE_WALLET_CONNECTIONS,
  logger, SERVER_ENDPOINT,
  signifyApi,
} from "@src/core/background";
import idwLogo from "@assets/idw.png";
import {Session} from "@pages/popup/sessionList/sessionList";

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

  const handleSendMessage = async () => {
    const { walletConnections } = await chrome.storage.local.get([
      LOCAL_STORAGE_WALLET_CONNECTIONS,
    ]);
    const ids = Object.keys(walletConnections);

    console.log('ids');
    console.log(ids);
    if (comm) {

      const currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

      if (!currentTab.url) return;
      const webDomain = (new URL(currentTab.url)).hostname;

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

      const aid = sessions.find((session:Session) => session.name === webDomain);

      if (!aid){
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

      const messageSent = await signifyApi.sendMessasge(comm.name, ids[0], payload);

      if (!messageSent.success){
        await logger.addLog(`❌ Message sent to IDW failed: ${messageSent.error}`);
        return;
      }

      await logger.addLog(`📩 Message successfully sent to IDW with AID ${ids[0]}, message: ${JSON.stringify(messageSent )}`);
    }

  }

  const handleResolveOObi = async () => {
    if (oobiUrl.length && oobiUrl.includes("oobi")) {
      setIsResolving(true);
      const resolveOobiResult = await signifyApi.resolveOOBI(oobiUrl);

      if (!resolveOobiResult.success) {
        await logger.addLog(`❌ Resolving wallet OOBI failed: ${oobiUrl}`);
        setIsResolving(false);
        return;
      }

      const { walletConnections } = await chrome.storage.local.get([
        LOCAL_STORAGE_WALLET_CONNECTIONS,
      ]);
      const walletConnectionsObj = walletConnections || {};

      walletConnectionsObj[resolveOobiResult.data.response.i] =
        resolveOobiResult.data;

      await chrome.storage.local.set({
        walletConnections: walletConnectionsObj,
      });

      await logger.addLog(`✅ Wallet OOBI resolved successfully: ${oobiUrl}`);

      setOobiUrl("");
      setIsResolving(false);
    }
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
            onClick={() => handleSendMessage()}
            disabled={isResolving}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export { Connect };
