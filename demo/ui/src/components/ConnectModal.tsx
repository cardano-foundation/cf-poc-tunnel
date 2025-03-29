import QRCode from "qrcode";
import { X } from "lucide-react";
import React, { useState, useEffect } from "react";

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({
  open,
  onClose
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // QR Code content string
  const qrContent = "https://walletconnect.example.com/connect?key=xyz123";

  // Generate QR code when modal opens
  useEffect(() => {
    if (open) {
      QRCode.toDataURL(qrContent)
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
        });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Connect Veridian Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="p-6 flex flex-col items-center">
          {qrCodeUrl && (
            <img 
              src={qrCodeUrl} 
              alt="Wallet Connect QR Code" 
              className="w-48 h-48 mb-4"
            />
          )}
          <p className="text-gray-600 text-center">
            Scan this QR code with your mobile wallet app to connect securely. 
            The code contains a unique connection link that will pair your wallet 
            with this application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;