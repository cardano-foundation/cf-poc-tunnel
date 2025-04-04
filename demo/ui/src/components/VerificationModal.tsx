import React, { useState } from "react";
import { X, Copy } from "lucide-react";
import { eventBus } from "../utils/EventBus";

interface Metadata {
  [key: string]: string | boolean;
}

interface VerificationModalProps {
  open: boolean;
  metadata?: Metadata;
  verify: (data: any) => void;
  onClose: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  open,
  metadata,
  verify,
  onClose,
}) => {
  if (!open) return null;

  const [activeTab, setActiveTab] = useState<"A" | "B">("A");

  const kelData = metadata && Object.keys(metadata).includes("KEL") ? JSON.parse(Buffer.from(metadata["KEL"], "hex").toString()) : undefined;
  const ephimeralSigData = metadata && Object.keys(metadata).includes("Signature") ? JSON.parse(Buffer.from(metadata["Signature"], "hex").toString()) : undefined;

  const [formData, setFormData] = useState({
    A: { aid: ephimeralSigData?.aid, oobi: ephimeralSigData?.oobi, hash: ephimeralSigData?.hash, signature: ephimeralSigData?.signature },
    B: { aid: kelData?.aid, oobi: kelData?.oobi, hash: kelData?.hash, sequence: kelData?.sequence },
  });
  const [verificationResult, setVerificationResult] = useState<{
    A: string | null;
    B: string | null;
  }>({ A: null, B: null });

  const handleInputChange = (
    tab: "A" | "B",
    field: "aid" | "oobi" | "hash" | "sequence" | "signature",
    value: string
  ) => {
    if (tab === "B" && field === "sequence") {
      if (value === "" || /^\d*$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            [field]: value,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          [field]: value,
        },
      }));
    }
  };

  const handleCopy = (text: string | undefined) => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        eventBus.publish("toast", {
            message: "Copied to clipboard!",
            type: "",
            duration: 2000,
        });
      });
    }
  };

  const handleVerify = async (tab: "A" | "B") => {
    try {
      const { aid, oobi, hash, sequence } = formData[tab];
      if (!aid || !oobi || !hash || (tab === "B" && !sequence)) {
        throw new Error("All fields are required");
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setVerificationResult((prev) => ({
        ...prev,
        [tab]: "Verification successful!",
      }));

      verify(formData[activeTab]);

    if (window.cardano && window.cardano["idw_p2p"]) {
        const api = window.cardano["idw_p2p"];
        const enabledApi = await api.enable();
        try {
            // TODO: verify
            console.log("enabledApi");
            console.log(enabledApi);
            /*
            const signedMessage = await enabledApi.experimental.signKeri(
            peerConnectWalletInfo.address,
            docHash
            );*/
            } catch (e) {
            // TODO
            console.log(e);
            }
        }
    } catch (error) {
      setVerificationResult((prev) => ({
        ...prev,
        [tab]: error instanceof Error ? error.message : "Verification failed",
      }));
    }
  };

  const renderInputWithCopy = (
    tab: "A" | "B",
    field: "aid" | "oobi" | "hash" | "sequence" | "signature",
    label: string,
    placeholder: string,
    type: string = "text",
    pattern?: string,
    inputMode?: "numeric" | "text"
  ) => (
    <div className="flex flex-col mx-2">
      <label className="text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={formData[tab][field] || ""}
          onChange={(e) => handleInputChange(tab, field, e.target.value)}
          className="bg-white text-black border border-gray-300 rounded-md px-3 py-2 w-full pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={placeholder}
          pattern={pattern}
          inputMode={inputMode}
        />
        <div
          onClick={() => handleCopy(formData[tab][field])}
          className="absolute cursor-pointer right-2 top-1/2 bg-slate-100 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          title="Copy to clipboard"
        >
          <Copy size={14} />
        </div>
      </div>
    </div>
  );

  const renderTabContent = (tab: "A" | "B") => (
    <div className="space-y-4">
      {renderInputWithCopy(tab, "aid", "AID", "Enter AID...")}
      {renderInputWithCopy(tab, "oobi", "OOBI", "Enter OOBI...")}
      {renderInputWithCopy(tab, "hash", "Hash", "Enter hash...")}
      {tab === "B" ? (
        renderInputWithCopy(tab, "sequence", "Sequence", "Enter sequence...", "text", "[0-9]*", "numeric")
      ) : (
        renderInputWithCopy(tab, "signature", "Signature", "Enter signature...")
      )}
      <button
        onClick={() => handleVerify(tab)}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
      >
        Verify
      </button>
      <div className="h-6">
        {verificationResult[tab] && (
          <div
            className={`text-center text-sm ${
              verificationResult[tab]?.includes("successful")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {verificationResult[tab]}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-[550px] h-[600px] relative shadow-lg transition-all duration-300 ease-in-out flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 bg-slate-500 text-gray-200 hover:text-gray-300 transition-colors duration-300 rounded-full p-1"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Verification Tool
        </h2>

        <div className="flex border-b mb-4">
          <div
            className={`flex-1 py-2 px-4 text-center cursor-pointer ${
              activeTab === "A"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 opacity-50"
            }`}
            onClick={() => setActiveTab("A")}
          >
            Ephimeral Signature
          </div>
          <div
            className={`flex-1 py-2 px-4 text-center cursor-pointer ${
              activeTab === "B"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 opacity-50"
            }`}
            onClick={() => setActiveTab("B")}
          >
            Interaction Event - KEL 
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "A" ? renderTabContent("A") : renderTabContent("B")}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;