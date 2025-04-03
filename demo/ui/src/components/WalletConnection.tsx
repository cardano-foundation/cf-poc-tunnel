import React, { useState, useEffect, MouseEvent } from "react";
import { Wallet, Copy, Power, FilePen, EyeOff } from "lucide-react";
import { addressSlice } from "../utils/utils";
import { eventBus } from "../utils/EventBus";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import { QRCode } from "react-qrcode-logo";

// Interface definitions
interface IWalletInfoExtended {
  name: string;
  address: string;
  oobi: string;
}

interface WalletConnectionProps {
  walletId: string | null;
  docHash: string | undefined;
  setWalletId: (id: string | null) => void;
  showWalletMenu: boolean;
  setShowWalletMenu: (show: boolean) => void;
  addSignatureMetadata: (signature: string) => void;
}

interface CardanoWindow extends Window {
  cardano?: {
    [walletName: string]: {
      enable: () => Promise<CardanoApi>;
      experimental?: {
        getKeriIdentifier: () => Promise<KeriIdentifier>;
        signKeri: (address: string, payload: string) => Promise<any>;
        signInception: (address: string, payload: string) => Promise<any>;
      };
    };
  };
}

interface CardanoApi {
  enable: () => Promise<CardanoApi>;
  experimental: {
    getKeriIdentifier: () => Promise<KeriIdentifier>;
    signKeri: (address: string, payload: string) => Promise<any>;
    signInception: (address: string, payload: string) => Promise<any>;
  };
}

interface KeriIdentifier {
  id: string;
  oobi: string;
}

declare let window: CardanoWindow;

const WalletConnection: React.FC<WalletConnectionProps> = ({
  walletId,
  docHash,
  setWalletId,
  showWalletMenu,
  setShowWalletMenu,
  addSignatureMetadata
}) => {
  const [screen, setScreen] = useState<"initial" | "prompt" | "connected">("initial");
  const [peerConnectWalletInfo, setPeerConnectWalletInfo] = useState<IWalletInfoExtended>({
    name: "",
    address: "",
    oobi: "",
  });
  const [error, setError] = useState<string>("");
  const [showAcceptButton, setShowAcceptButton] = useState<boolean>(false);
  const [isQrBlurred, setIsQrBlurred] = useState<boolean>(true);

  const defaultWallet: IWalletInfoExtended = { name: "", address: "", oobi: "" };

  const {
    dAppConnect,
    meerkatAddress,
    initDappConnect,
    disconnect,
    connect,
  } = useCardano({
    limitNetwork: NetworkType.TESTNET,
  });

  console.log("meerkatAddress:", meerkatAddress);

  useEffect(() => {
    if (dAppConnect.current === null) {
      const verifyConnection = (
        walletInfo: IWalletInfoExtended,
        callback: (granted: boolean, autoconnect: boolean) => void
      ) => {
        console.log("verifyConnection111:", walletInfo);
        setPeerConnectWalletInfo(walletInfo);
        setShowAcceptButton(true);
        setScreen("prompt");
        setOnPeerConnectAccept(() => () => callback(true, true));
        setOnPeerConnectReject(() => () => callback(false, false));
      };

      const onApiInject = async (name: string) => {
        console.log("onApiInject111", name);
        const api = window.cardano && window.cardano[name];
        if (api) {
          const enabledApi = await api.enable();
          const keriIdentifier = await enabledApi.experimental.getKeriIdentifier();
          setPeerConnectWalletInfo({
            ...peerConnectWalletInfo,
            name,
            address: keriIdentifier.id,
            oobi: keriIdentifier.oobi,
          });
          setWalletId(keriIdentifier.id);
          setScreen("connected");
          setError("");
          eventBus.publish("toast", {
            message: "Wallet connected successfully!",
            type: "success",
            duration: 3000,
          });
        } else {
          setError(`Timeout while connecting P2P ${name} wallet`);
        }
      };

      const onApiEject = () => {
        console.log("onApiEject111");
        setPeerConnectWalletInfo(defaultWallet);
        setWalletId(null);
        setScreen("initial");
        setError("");
        setShowWalletMenu(false);
        eventBus.publish("toast", {
          message: "Wallet disconnected!",
          type: "info",
          duration: 3000,
        });
        disconnect();
      };

      const onP2PConnect = () => {
        console.log("onApiEject111");
      };

      initDappConnect(
        "KERI Wallet Connection",
        window.location.href,
        verifyConnection,
        onApiInject,
        onApiEject,
        ["wss://tracker.webtorrent.dev:443/announce", "wss://dev.btt.cf-identity-wallet.metadata.dev.cf-deployments.org"],
        onP2PConnect
      );
    }
  }, [dAppConnect, meerkatAddress, screen, walletId, setWalletId, setShowWalletMenu, disconnect, initDappConnect, peerConnectWalletInfo]);

  const [onPeerConnectAccept, setOnPeerConnectAccept] = useState<() => void>(() => () => {});
  const [onPeerConnectReject, setOnPeerConnectReject] = useState<() => void>(() => () => {});

  const handleAcceptConnection = () => {
    console.log("peerConnectWalletInfo:", peerConnectWalletInfo);
    if (peerConnectWalletInfo) {
      onPeerConnectAccept();
      connect(peerConnectWalletInfo.name).then(async () => {
        if (peerConnectWalletInfo.name === "idw_p2p") {
          const start = Date.now();
          const interval = 100;
          const timeout = 5000;

          const checkApi = setInterval(async () => {
            const api = window.cardano && window.cardano[peerConnectWalletInfo.name];
            if (api || Date.now() - start > timeout) {
              clearInterval(checkApi);
              if (api) {
                const enabledApi = await api.enable();
                const keriIdentifier = await enabledApi.experimental.getKeriIdentifier();
                setPeerConnectWalletInfo({
                  ...peerConnectWalletInfo,
                  address: keriIdentifier.id,
                  oobi: keriIdentifier.oobi,
                });
                setWalletId(keriIdentifier.id);
                setScreen("connected");
                setShowAcceptButton(false);
                setError("");
                eventBus.publish("toast", {
                  message: "Wallet connected successfully!",
                  type: "success",
                  duration: 3000,
                });
              } else {
                setError(`Timeout while connecting P2P ${peerConnectWalletInfo.name} wallet`);
                setScreen("initial");
              }
            }
          }, interval);
        } else {
          setError(`Wrong wallet: ${peerConnectWalletInfo.name}`);
        }
      });
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(meerkatAddress || "KERI-W123456789").then(() => {
      setScreen("prompt");
      eventBus.publish("toast", {
        message: "ID copied to clipboard!",
        type: "success",
        duration: 3000,
      });
    });
  };

  const handleDisconnect = () => {
    disconnect();
    setPeerConnectWalletInfo(defaultWallet);
    setWalletId(null);
    setShowWalletMenu(false);
    setScreen("initial");
    setError("");
    eventBus.publish("toast", {
      message: "Wallet disconnected!",
      type: "info",
      duration: 3000,
    });
  };

  const signMessageWithWallet = async () => {
    console.log("peerConnectWalletInfo11:", peerConnectWalletInfo);

    if (!docHash || !docHash.length){
      eventBus.publish("toast", {
        message: "Document hash missing",
        type: "error",
        duration: 3000,
      });
      return;
    }
    
    if (window.cardano && window.cardano["idw_p2p"]) {
      setError("");
      console.log("hey11");
      const api = window.cardano["idw_p2p"];
      const enabledApi = await api.enable();
      console.log("hey22");
      try {
        const signedMessage = await enabledApi.experimental.signKeri(
          peerConnectWalletInfo?.address,
          docHash
        );
        console.log("hey33");
        console.log("signedMessage:", signedMessage);
        addSignatureMetadata(signedMessage);
      } catch (e) {
        if (e instanceof Error && 'code' in e && 'info' in e) {
          eventBus.publish("toast", {
            message: (e.code === 2 ? "User declined to sign" : (e as any).info),
            type: "error",
            duration: 3000,
          });
        } else {
          eventBus.publish("toast", {
            message: "An unknown error occurred",
            type: "error",
            duration: 3000,
          });
          setError("An unknown error occurred");
        }
      }
    } else {
      eventBus.publish("toast", {
        message: "Wallet not connected",
        type: "warning",
        duration: 3000,
      });
    }
  };

  const handleCopyConnectedId = () => {
    if (walletId) {
      navigator.clipboard.writeText(walletId).then(() => {
        setShowWalletMenu(false);
        eventBus.publish("toast", {
          message: "Wallet ID copied!",
          type: "success",
          duration: 3000,
        });
      });
    }
  };

  const toggleWalletMenu = () => {
    setShowWalletMenu((prev) => !prev);
  };

  const renderScreen = () => {
    switch (screen) {
      case "initial":
        return (
          <div className="flex flex-col items-center space-y-2 w-full max-w-sm h-72">
            <h2 className="text-base font-semibold text-gray-800">Connect Wallet</h2>
            <p className="text-xs text-gray-600 text-center">
              Click to reveal QR code
            </p>
            <div
              onClick={() => setIsQrBlurred(!isQrBlurred)}
              className="cursor-pointer flex flex-col items-center flex-grow justify-center relative"
            >
              <div className="relative w-[170px] h-[170px]">
                <QRCode
                  value={meerkatAddress || "KERI-W123456789"}
                  size={150}
                  fgColor={"black"}
                  bgColor={"white"}
                  qrStyle={"squares"}
                  logoWidth={60}
                  logoHeight={60}
                  logoOpacity={1}
                  quietZone={10}
                />
                {isQrBlurred && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-gray-300/50 flex items-center justify-center transition-all duration-300">
                    <EyeOff 
                      size={40} 
                      className="text-gray-600 opacity-80" 
                      strokeWidth={2}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-700 font-mono mt-1 break-all text-center">
                {addressSlice(meerkatAddress || "KERI-W123456789", 6)}
              </span>
            </div>
            <button
              onClick={handleCopyId}
              className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              <Copy size={14} />
              <span>Copy ID</span>
            </button>
          </div>
        );

      case "prompt":
        return (
          <div className="flex flex-col items-center justify-end w-full max-w-sm h-72 space-y-2">
            <div className="flex flex-col items-center space-y-1">
              <h2 className="text-base font-semibold text-gray-800">Confirm Connection</h2>
              <p className="text-sm text-gray-600 text-center">
                Accept connection from wallet:{" "}
                <span className="font-mono">{peerConnectWalletInfo.name || "IDW"}</span>?
              </p>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
            <button
              onClick={handleAcceptConnection}
              className="w-full max-w-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
              disabled={!showAcceptButton}
            >
              Accept
            </button>
          </div>
        );

      case "connected":
        return (
          <div className="relative w-full max-w-sm">
            <button
              onClick={toggleWalletMenu}
              className="flex items-center justify-between w-full bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
            >
              <div className="flex items-center space-x-2">
                <Wallet size={14} className="text-blue-600" />
                <span className="font-medium">{addressSlice(walletId || "", 8)}</span>
              </div>
            </button>
            {showWalletMenu && (
              <div
                className="absolute bottom-full left-0 mb-1 w-full bg-gray-100 rounded-md shadow-lg z-10 text-sm"
                onMouseLeave={() => setShowWalletMenu(false)}
              >
                <button
                  onClick={() => signMessageWithWallet()}
                  className="flex items-center space-x-2 w-full text-left my-1 px-3 py-1.5 text-gray-700 bg-gray-200 transition-colors duration-200"
                >
                  <FilePen size={14} className="text-blue-600" />
                  <span>Sign Document</span>
                </button>
                <button
                  onClick={handleCopyConnectedId}
                  className="flex items-center space-x-2 w-full text-left my-1 px-3 py-1.5 text-gray-700 bg-gray-200 transition-colors duration-200"
                >
                  <Copy size={14} className="text-gray-600" />
                  <span>Copy ID</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center space-x-2 w-full text-left my-1 px-3 py-1.5 text-gray-700 bg-gray-200 transition-colors duration-200"
                >
                  <Power size={14} className="text-red-500" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white flex justify-center">
      {renderScreen()}
    </div>
  );
};

export default WalletConnection;