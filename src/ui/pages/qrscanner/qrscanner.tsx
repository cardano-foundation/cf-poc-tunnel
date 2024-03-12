import React, { useEffect, useState } from "react";
import "./qrscanner.scss";
import { useAuth } from "@components/router/authProvider";
import {Html5QrcodeScanner} from "html5-qrcode";
import {LOCAL_STORAGE_WALLET_CONNECTIONS, logger} from "@src/core/background";
import {signifyApiInstance} from "@src/core/modules/signifyApi";
import {LOCAL_STORAGE_WALLET_CONNECTION} from "@pages/popup/connect/connect";

enum ContentType {
  SCANNER = "scanner",
  RESOLVING = "resolving",
  RESOLVED = "resolved",
}

const Qrscanner = () => {
  const { isLoggedIn, isLoggedInFromStorage, logout, login } = useAuth();
  const [restartCamera, setRestartCamera] = useState(false);
  const [contentType, setContentType] = useState<ContentType>(ContentType.SCANNER);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 250
      },
      fps: 5,
    }, false);

    const success = (result:string) => {
      scanner.clear();
      handleResolveOObi(result);
    }
    const error = (err:any) => {
      console.warn(err);
    }
    scanner.render(success, error);

  }, [isLoggedIn, restartCamera]);

  const restartScanner = async () => {
    setRestartCamera(!restartCamera);
    setContentType(ContentType.SCANNER)
  }
  const checkIsLogged = async () => {
    const isLogged = await isLoggedInFromStorage();
    if (!isLogged) logout();
    else await login();
  };

  useEffect(() => {
    window.addEventListener("mousemove", checkIsLogged);
    window.addEventListener("keydown", checkIsLogged);
    window.addEventListener("scroll", checkIsLogged);
    window.addEventListener("click", checkIsLogged);

    return () => {
      window.removeEventListener("mousemove", checkIsLogged);
      window.removeEventListener("keydown", checkIsLogged);
      window.removeEventListener("scroll", checkIsLogged);
      window.removeEventListener("click", checkIsLogged);
    };
  }, [isLoggedIn]);

  const renderContent = () => {
    switch (contentType) {
      case ContentType.SCANNER:
        return {
          component: <div id="reader"/>,
          title: "Scan your wallet QR Code"
        }
      case ContentType.RESOLVING:
        return {
          component:  <></>,
          title: "Resolving wallet OOBI"
        }
      case ContentType.RESOLVED:
        return {
          component:  <>
            <button
              className="resolve-button"
              onClick={() => window.close()}
          >
              Close
          </button>
            <button
              className="resolve-button"
              onClick={() => restartScanner()}
          >
            Scan QR Code again
          </button>
          </>,
          title: "The wallet OOBI was resolved successfully"
        }
    }
  }
  const handleResolveOObi = async (oobi: string) => {
    if (oobi.length && oobi.includes("oobi")) {
      setContentType(ContentType.RESOLVING);
      const resolveOobiResult = await signifyApiInstance.resolveOOBI(oobi);

      if (!resolveOobiResult.success) {
        await logger.addLog(`❌ Resolving wallet OOBI failed: ${oobi}`);
        return;
      }

      const { walletConnections } = await chrome.storage.local.get([
        LOCAL_STORAGE_WALLET_CONNECTIONS,
      ]);
      const walletConnectionsObj = walletConnections || {};

      walletConnectionsObj[resolveOobiResult.data.response.i] =
          resolveOobiResult.data;

      await chrome.storage.local.set({
        [LOCAL_STORAGE_WALLET_CONNECTION]: walletConnectionsObj,
      });

      await logger.addLog(`✅ Wallet OOBI resolved successfully: ${oobi}`);

      setContentType(ContentType.RESOLVED);
    }
  };

  const content = renderContent();

  return (
    <div className="scannerPage">
      {isLoggedIn ? (
        <>
          <div className="section">
            <h2 className="">{content?.title}  </h2>
            {
              content?.component
            }
          </div>
        </>
      ) : (
        <>
          <div className="lockMessage">Please, login again</div>
        </>
      )}
    </div>
  );
};

export { Qrscanner };
