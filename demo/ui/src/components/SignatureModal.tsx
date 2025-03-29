import React, { useState } from "react";
import { X } from "lucide-react";
import SignaturePad from "./SignaturePad";

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  addSignature: (signatureUrl: string, name: string, title?: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  open,
  addSignature,
  onClose,
}) => {
  console.log("SignatureModal open", open);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [visualSignatureBase64, setVisualSignatureBase64] = useState("");
  if (!open) return null;

  const handleUpdateVisualSignature = (signatureUrl: string) => {
    console.log("handleUpdateVisualSignature222", signatureUrl);
    setVisualSignatureBase64(signatureUrl);
  }
  const handleAddSingature = () => {
    if (!name) {
      alert("Please enter both the name and the position");
      return;
    }
    addSignature(visualSignatureBase64, name, title);
    onClose();
    setName("");
    setTitle("");
  };

  return (
    <>

          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={onClose}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-[700px] max-h-[90vh] overflow-auto relative shadow-lg transition-all duration-300 ease-in-out"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 bg-slate-500 text-gray-200 hover:text-gray-300 transition-colors duration-300 rounded-full p-1"
                onClick={onClose}
              >
                <X size={24} />
              </button>

              {/* Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full p-3 bg-white text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your position or title"
                className="w-full p-3 bg-white text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Signature</h3>
            <div className="border border-gray-200 rounded-md p-1 bg-gray-50">
            <SignaturePad
              updateVisualSignature={(signatureUrl: string) =>
                handleUpdateVisualSignature(signatureUrl)
              }
            />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={() => handleAddSingature()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Confirm
          </button>
        </div>

              </div>
            </div>
   
    </>
  );
};

export default SignatureModal;
