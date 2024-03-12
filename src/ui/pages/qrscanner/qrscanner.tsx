import React, { useEffect, useState } from "react";
import "./qrscanner.scss";
import { useAuth } from "@components/router/authProvider";
import {Html5QrcodeScanner} from "html5-qrcode";
import {LOCAL_STORAGE_WALLET_CONNECTIONS, logger} from "@src/core/background";
import {signifyApiInstance} from "@src/core/modules/signifyApi";

const Qrscanner = () => {
  const [scanResult, setScanResult] = useState<string>("");
  const { isLoggedIn, isLoggedInFromStorage, logout, login } = useAuth();
  const [isResolving, setIsResolving] = useState(false);

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
      setScanResult(result);
      handleResolveOObi(result);
    }
    const error = (err:any) => {
      console.warn(err);
    }

    scanner.render(success, error);

  }, [isLoggedIn]);

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

  const handleResolveOObi = async (oobi: string) => {
    if (oobi.length && oobi.includes("oobi")) {
      setIsResolving(true);
      const resolveOobiResult = await signifyApiInstance.resolveOOBI(oobi);

      if (!resolveOobiResult.success) {
        await logger.addLog(`❌ Resolving wallet OOBI failed: ${oobi}`);
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

      await logger.addLog(`✅ Wallet OOBI resolved successfully: ${oobi}`);

      setIsResolving(false);
    }
  };

  return (
    <div className="scannerPage">
      {isLoggedIn ? (
        <>
          <div className="section">
            <h2 className=""> Scan your wallet QR Code </h2>
            {
              scanResult ? <>
                <p>{scanResult}</p>
              </> : <>
                <div id="reader"/>
              </>
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
