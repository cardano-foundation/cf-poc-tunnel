import React, { useState, useEffect } from "react"; // Add useEffect to imports
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
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"A" | "B">("A");


  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({});
  const [verificationResult, setVerificationResult] = useState<{
    A: string | null;
    B: string | null;
  }>({ A: null, B: null });

  useEffect(() => {
    const kelData = metadata && Object.keys(metadata).includes("KEL") ? JSON.parse(Buffer.from(metadata["KEL"], "hex").toString()) : undefined;
    const ephimeralSigData = metadata && Object.keys(metadata).includes("Signature") ? JSON.parse(Buffer.from(metadata["Signature"], "hex").toString()) : undefined;
    setFormData({
      A: { aid: ephimeralSigData?.aid, oobi: ephimeralSigData?.oobi, hash: ephimeralSigData?.hash, signature: ephimeralSigData?.signature },
      B: { aid: kelData?.aid, oobi: kelData?.oobi, hash: kelData?.hash, sequence: kelData?.sequence },
    })
  }, [metadata]);

  useEffect(() => {
    if (verificationResult.A || verificationResult.B) {
      const timer = setTimeout(() => {
        setVerificationResult({ A: null, B: null });
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [verificationResult]);

  if (!open) return null;

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
    setIsVerifying(true);
    try {
      const { aid, oobi, hash } = formData[tab];
      if (!aid || !oobi || !hash) {
        throw new Error("Fields are required");
      }

      if (window.cardano && window.cardano["idw_p2p"]) {
        const api = window.cardano["idw_p2p"];
        const enabledApi = await api.enable();
        try {
          if (activeTab === "A") {
            const verified = await enabledApi.experimental.verifySignature(
              formData[tab].aid,
              formData[tab].oobi,
              formData[tab].hash,
              formData[tab].signature,
              false
            );
            eventBus.publish("startIconAnimation", { iconType: "check" });
            if (verified.verified) {
              setVerificationResult((prev) => ({
                ...prev,
                [tab]: "Signature verification successful!",
              }));
              eventBus.publish("toast", {
                message: "Signature verified successfully!",
                type: "success",
                duration: 3000,
              });
            } else {
              setVerificationResult((prev) => ({
                ...prev,
                [tab]: "Signature verification failed!!",
              }));
              eventBus.publish("toast", {
                message: "Signature not verified!",
                type: "error",
                duration: 3000,
              });
            }
          } else {
            const verified = await enabledApi.experimental.verifyKeriInteraction(
              formData[tab].aid,
              formData[tab].oobi,
              formData[tab].hash,
              formData[tab].sequence,
              true
            );
            eventBus.publish("startIconAnimation", { iconType: "check" });
            if (verified.verified) {
              setVerificationResult((prev) => ({
                ...prev,
                [tab]: "Document verification successful!",
              }));
              eventBus.publish("toast", {
                message: "Document verified successfully!",
                type: "success",
                duration: 3000,
              });
            } else {
              setVerificationResult((prev) => ({
                ...prev,
                [tab]: "Document verification failed!",
              }));
              eventBus.publish("toast", {
                message: "Document verification failed!",
                type: "error",
                duration: 3000,
              });
            }
          }
        } catch (e) {
          if (typeof e === 'object' && e !== null && 'code' in e && 'info' in e) {
            setVerificationResult((prev) => ({
              ...prev,
              [tab] : "User declined to verify the document",
            }));
            eventBus.publish("toast", {
              message: "User declined to verify the document",
              type: "error",
              duration: 3000,
            });
          }
        }
      }
    } catch (error) {
      setVerificationResult((prev) => ({
        ...prev,
        [tab]: error instanceof Error ? error.message : "Verification failed",
      }));
      eventBus.publish("toast", {
        message: "Verification failed",
        type: "error",
        duration: 3000,
      });
    }
    finally {
      setIsVerifying(false);
    }
  };

  const renderInputWithCopy = (
    field: "aid" | "oobi" | "hash" | "sequence" | "signature",
    label: string,
    placeholder: string,
    type: string = "text",
    pattern?: string,
    inputMode?: "numeric" | "text"
  ) => {
    return <>
      <div className="flex flex-col mx-2">
      <label className="text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={formData[activeTab][field] || ""}
          onChange={(e) => handleInputChange(activeTab, field, e.target.value)}
          className="bg-white text-black border border-gray-300 rounded-md px-3 py-2 w-full pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={placeholder}
          pattern={pattern}
          inputMode={inputMode}
        />
        <div
          onClick={() => handleCopy(formData[activeTab][field])}
          className="absolute cursor-pointer right-2 top-1/2 bg-slate-100 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          title="Copy to clipboard"
        >
          <Copy size={14} />
        </div>
      </div>
    </div>
    </>
  };

  const renderTabContent = () => (
    <div className="space-y-4">
      {renderInputWithCopy("aid", "AID", "Enter AID...")}
      {renderInputWithCopy("oobi", "OOBI", "Enter OOBI...")}
      {renderInputWithCopy("hash", "Hash", "Enter hash...")}
      {activeTab === "B" ? (
        renderInputWithCopy("sequence", "Sequence", "Enter sequence...", "text", "[0-9]*", "numeric")
      ) : (
        renderInputWithCopy("signature", "Signature", "Enter signature...")
      )}
      <button
        onClick={() => handleVerify(activeTab)}
        disabled={isVerifying}
        className={`w-full py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-300 flex items-center justify-center
          ${isVerifying 
            ? 'bg-blue-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
      >
        {isVerifying ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Verifying...
          </>
        ) : (
          'Verify'
        )}
      </button>
      <div className="h-6">
        {verificationResult[activeTab] && (
          <div
            className={`text-center text-sm ${
              verificationResult[activeTab]?.includes("successful")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {verificationResult[activeTab]}
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
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;