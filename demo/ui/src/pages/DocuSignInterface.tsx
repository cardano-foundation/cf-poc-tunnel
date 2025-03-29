// DocuSignInterface.tsx
import React, { useState } from "react";
import {
  Signature,
  Check,
  ChevronDown,
  Github,
  CheckCircle2,
  Download
} from "lucide-react";
import DocumentModal from "../components/DocumentModal";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  PDFDocument,
  PDFName,
  PDFHexString,
  rgb,
  StandardFonts,
  degrees,
} from "pdf-lib";
import bwipjs from "bwip-js";
import { base64ToUint8Array, blake3Hash, calculatePdfHash } from "../utils/utils";
import PDFViewer from "../components/PDFViewer";
import saveAs from "file-saver";
import SignatureModal from "../components/SignatureModal";
import { eventBus } from "../utils/EventBus";
import WalletConnection from "../components/WalletConnection";
interface FieldType {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
}

interface PDFDoc {
  id: string;
  pdfDoc: PDFDocument;
  name: string;
  date: string;
  verified: boolean;
  size: string;
  type: string;
  pageCount: number;
  file: File;
  bytes: ArrayBuffer;
  fileUrl: string;
  hash: string;
  metadata?: Record<string, string>;
}

const DocuSignInterface: React.FC = () => {
  const [documents, setDocuments] = useState<PDFDoc[]>([]);
  const [showStandardFields, setShowStandardFields] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<PDFDoc | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const standardFields: FieldType[] = [
    {
      id: "signature",
      type: "signature",
      label: "Add Signature",
      icon: <Signature className="w-5 h-5" />,
      action: () => handleRunAction("signature"),
    },
    {
      id: "checkbox",
      type: "checkbox",
      label: "Verify",
      icon: <Check className="w-5 h-5" />,
      action: () => handleRunAction("verification"),
    },
    {
      id: "download",
      type: "download",
      label: "Download",
      icon: <Download className="w-5 h-5" />,
      action: () => handleRunAction("download"),
    },
  ];

  const addSignaturesToMetadata = async () => {
    const signatures = [
      { publicKey: "Public Key 1", signature: "Signature 1" },
      { publicKey: "Public Key 2", signature: "Signature 2" },
      { publicKey: "Public Key 3", signature: "Signature 3" },
      { publicKey: "Public Key 4", signature: "Signature 4" },
      { publicKey: "Public Key 5", signature: "Signature 5" },
    ];

    const jsonString = JSON.stringify(signatures);
    const buffer = Buffer.from(jsonString, "utf8");
    const signaturesHex = buffer.toString("hex");
    handleAddFieldMetadata("Signatures", signaturesHex);
  };

  const handleRunAction = async (action: string) => {
    switch (action) {
      case "signature": {
        if (!selectedDocument) {
          eventBus.publish("toast", {
            message: "No document selected!",
            type: "warning",
            duration: 3000,
          });
          return;
        }
        setShowSignatureModal(true);
        break;
      }
      case "verification": {
        eventBus.publish("toast", {
          message: "WIP!",
          type: "warning",
          duration: 3000,
        });
        break;
      }
      case "download": {
        handleDownload();
        break;
      }
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      try {
        const fileUrl = URL.createObjectURL(selectedFile);
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
        });

        const pageCount = pdfDoc.getPageCount();
        const hash = await calculatePdfHash(new Uint8Array(arrayBuffer));

        let newDocument: PDFDoc = {
          id: Date.now().toString(),
          pdfDoc,
          name: selectedFile.name,
          date: new Date().toISOString(),
          verified: false,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "PDF",
          pageCount,
          file: selectedFile,
          bytes: arrayBuffer,
          fileUrl,
          hash,
        };

        const catalog = pdfDoc.catalog;
        const metadataRef = catalog.get(catalog.context.obj("Metadata"));
        if (!metadataRef) {
          console.error("No metadata found in the PDF.");
        } else {
          const existingInfo = pdfDoc.context.lookup(
            pdfDoc.context.trailerInfo.Info
          );
          const entriesArray = Array.from(existingInfo.dict.entries());
          let metadata = {};
          entriesArray.map(([keyObj, valueObj], index) => {
            const value = existingInfo.lookup(keyObj).decodeText();
            metadata = {
              ...metadata,
              [keyObj.decodeText()]: value,
            };
          });
          pdfDoc.save();
          newDocument = {
            ...newDocument,
            metadata,
            verified: Object.keys(metadata).includes("Signatures"),
          };
        }
        setDocuments((prevDocs) => [...prevDocs, newDocument]);
        setSelectedDocument(newDocument);
        setSelectedPdfUrl(fileUrl);

        eventBus.publish("toast", {
          message: "PDF loaded successfully!",
          type: "success",
          duration: 3000,
        });
      } catch (error) {
        eventBus.publish("toast", {
          message: "Failed to load PDF!",
          type: "danger",
          duration: 3000,
        });
        console.error("Error loading PDF:", error);
      }
    } else {
      eventBus.publish("toast", {
        message: "Please select a valid PDF file!",
        type: "warning",
        duration: 3000,
      });
    }
  };

  const handleDownload = async () => {
    if (!selectedDocument) {
      eventBus.publish("toast", {
        message: "No document selected to download!",
        type: "warning",
        duration: 3000,
      });
      return;
    }
    try {
      const pdfBytes = await selectedDocument.pdfDoc.save();
      saveAs(
        new Blob([pdfBytes], { type: "application/pdf" }),
        "updated_document.pdf"
      );
      eventBus.publish("toast", {
        message: "Document downloaded successfully!",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      eventBus.publish("toast", {
        message: "Failed to download document!",
        type: "danger",
        duration: 3000,
      });
      console.error("Error downloading document:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, field: FieldType) => {
    e.dataTransfer.setData("field", JSON.stringify(field));
  };

  const handleDocumentClick = (doc: PDFDoc) => {
    setShowMetadataModal(true);
  };

  const handleDeleteDocument = (docu: PDFDoc) => {
    setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docu.id));
    if (selectedDocument?.id === docu.id) {
      setSelectedDocument(null);
      setSelectedPdfUrl(null);
    }
    eventBus.publish("toast", {
      message: `Document "${docu.name}" deleted!`,
      type: "success",
      duration: 3000,
    });
  };

  const closeModal = () => {
    setShowMetadataModal(false);
  };

  const closeSingatureModal = () => {
    setShowSignatureModal(false);
  };

  const handleDeleteFieldMetadata = async (key: string) => {
    try {
      if (selectedDocument?.bytes) {
        const pdfDoc = await PDFDocument.load(selectedDocument.bytes, {
          ignoreEncryption: true,
        });
        const existingInfo = pdfDoc.context.lookup(
          pdfDoc.context.trailerInfo.Info
        );

        const Key = PDFName.of(key);
        existingInfo.delete(Key);
        let updatedMetadata = { ...selectedDocument.metadata };
        Reflect.deleteProperty(updatedMetadata, key);
        const metadataStreamRef = pdfDoc.context.register(existingInfo);
        pdfDoc.catalog.set(PDFName.of("Metadata"), metadataStreamRef);

        const updatedBytes = await pdfDoc.save();
        const updatedHash = await calculatePdfHash(new Uint8Array(updatedBytes), updatedMetadata);

        const updatedDocument = {
          ...selectedDocument,
          bytes: updatedBytes,
          metadata: updatedMetadata,
          pdfDoc,
          hash: updatedHash,
        };

        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.id === selectedDocument.id ? updatedDocument : doc
          )
        );
        setSelectedDocument(updatedDocument);

        eventBus.publish("toast", {
          message: `Metadata "${key}" deleted successfully!`,
          type: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      eventBus.publish("toast", {
        message: "Failed to delete metadata!",
        type: "danger",
        duration: 3000,
      });
      console.error("Error deleting metadata:", error);
    }
  };

  const addVisualSignature = async (
    signatureBase64: string,
    name: string,
    title?: string
  ) => {
    try {
      if (!selectedDocument?.bytes) {
        eventBus.publish("toast", {
          message: "No document selected for signature!",
          type: "warning",
          duration: 3000,
        });
        return;
      }

      const pdfDoc = await PDFDocument.load(selectedDocument.bytes, {
        ignoreEncryption: true,
      });
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();

      const signatureImageBytes = base64ToUint8Array(signatureBase64);
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const primaryColor = rgb(0.1, 0.45, 0.75);
      const secondaryColor = rgb(0.05, 0.25, 0.5);
      const lightColor = rgb(0.95, 0.97, 1.0);
      const textColor = rgb(0.15, 0.2, 0.3);

      const signerInfo = {
        name: name,
        title: title || "",
        date: new Date().toLocaleDateString(),
        id: "ED63B5A810D3427JA762HAS5230W2J2",
      };

      const margin = 40;
      const blockWidth = width - margin * 2;
      const blockHeight = 180;
      const padding = 20;
      const cornerRadius = 6;

      const startX = margin;
      const startY = margin;

      lastPage.drawRectangle({
        x: startX,
        y: startY,
        width: blockWidth,
        height: blockHeight,
        color: lightColor,
        borderColor: primaryColor,
        borderWidth: 1.5,
        borderRadius: cornerRadius,
      });

      lastPage.drawRectangle({
        x: startX,
        y: startY + blockHeight - 8,
        width: blockWidth,
        height: 8,
        color: primaryColor,
        borderRadius: { topLeft: cornerRadius, topRight: cornerRadius },
      });

      const signatureAspectRatio = signatureImage.width / signatureImage.height;
      const signatureHeight = 60;
      const signatureWidth = signatureHeight * signatureAspectRatio;
      const signatureX = startX + (blockWidth - signatureWidth) / 2;
      const signatureY = startY + blockHeight - padding - signatureHeight - 20;

      lastPage.drawImage(signatureImage, {
        x: signatureX,
        y: signatureY,
        width: signatureWidth,
        height: signatureHeight,
      });

      let currentY = signatureY - 20;
      const nameWidth = helveticaBold.widthOfTextAtSize(signerInfo.name, 13);
      lastPage.drawText(signerInfo.name, {
        x: startX + (blockWidth - nameWidth) / 2,
        y: currentY,
        size: 13,
        font: helveticaBold,
        color: secondaryColor,
      });

      currentY -= 18;
      if (title && title.length > 0) {
        const titleWidth = helvetica.widthOfTextAtSize(signerInfo.title, 10);
        lastPage.drawText(signerInfo.title, {
          x: startX + (blockWidth - titleWidth) / 2,
          y: currentY,
          size: 10,
          font: helvetica,
          color: textColor,
          opacity: 0.85,
        });
        currentY -= 20;
      }

      const qrCodeBytes = await generateBarcode2D(signerInfo.id);
      const qrCode = await pdfDoc.embedPng(qrCodeBytes);
      const qrCodeHeight = 120;
      const qrCodeWidth = qrCodeHeight;

      lastPage.drawImage(qrCode, {
        x: startX + padding,
        y: startY + padding + 15,
        width: qrCodeWidth,
        height: qrCodeHeight,
        rotate: degrees(0),
      });

      const idText = `ID: ${signerInfo.id.substring(0, 14)}`;
      const idWidth = helvetica.widthOfTextAtSize(idText, 10);
      lastPage.drawText(idText, {
        x: startX + padding,
        y: startY + padding,
        size: 10,
        font: helvetica,
        color: textColor,
      });

      const dateText = `Date: ${signerInfo.date}`;
      const dateWidth = helvetica.widthOfTextAtSize(dateText, 10);
      lastPage.drawText(dateText, {
        x: startX + blockWidth - padding - dateWidth,
        y: startY + padding,
        size: 10,
        font: helvetica,
        color: textColor,
      });

      const brandingYCenter = startY + blockHeight / 2;
      lastPage.drawText("Signed by", {
        x: startX + blockWidth - padding - 110,
        y: brandingYCenter + 5,
        size: 9,
        font: helvetica,
        color: textColor,
        opacity: 0.7,
      });

      lastPage.drawText("Veridian Wallet", {
        x: startX + blockWidth - padding - 140,
        y: brandingYCenter - 10,
        size: 14,
        font: helveticaBold,
        color: primaryColor,
      });

      const updatedBytes = await pdfDoc.save();
      const updatedFileUrl = URL.createObjectURL(
        new Blob([updatedBytes], { type: "application/pdf" })
      );
      const updatedHash = await calculatePdfHash(new Uint8Array(updatedBytes), selectedDocument.metadata);
      const updatedDocument = {
        ...selectedDocument,
        bytes: updatedBytes,
        pdfDoc,
        fileUrl: updatedFileUrl,
        hash: updatedHash,
      };

      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === selectedDocument.id ? updatedDocument : doc
        )
      );
      setSelectedDocument(updatedDocument);

      eventBus.publish("toast", {
        message: "Signature added successfully!",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      eventBus.publish("toast", {
        message: "Failed to add signature!",
        type: "danger",
        duration: 3000,
      });
      console.error("Error adding visual signature:", error);
    }
  };

  const generateBarcode2D = async (
    data: string,
    type: "datamatrix" | "pdf417" = "datamatrix"
  ): Promise<Uint8Array> => {
    try {
      const canvas = document.createElement("canvas");
      await bwipjs.toCanvas(canvas, {
        bcid: type,
        text: data,
        scale: 10,
        height: 20,
        includetext: false,
        textxalign: "center",
      });

      const imageDataUrl = canvas.toDataURL("image/png");
      const base64Data = imageDataUrl.split(",")[1];
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);

      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }

      return bytes;
    } catch (error) {
      console.error("Error generating 2D barcode:", error);
      throw error;
    }
  };

  const handleAddFieldMetadata = async (key: string, value: string) => {
    try {
      if (!selectedDocument?.bytes) {
        eventBus.publish("toast", {
          message: "No document selected to edit metadata!",
          type: "warning",
          duration: 3000,
        });
        return;
      }

      const pdfDoc = await PDFDocument.load(selectedDocument.bytes, {
        ignoreEncryption: true,
      });
      const existingInfo = pdfDoc.context.lookup(
        pdfDoc.context.trailerInfo.Info
      );

      const Key = PDFName.of(key);
      existingInfo.set(Key, PDFHexString.fromText(value));
      const metadataStreamRef = pdfDoc.context.register(existingInfo);
      pdfDoc.catalog.set(PDFName.of("Metadata"), metadataStreamRef);

      const updatedBytes = await pdfDoc.save();
      let updatedMetadata = {
        ...selectedDocument.metadata,
        [key]: value,
      };
      const updatedHash = await calculatePdfHash(new Uint8Array(updatedBytes), updatedMetadata);

      const updatedDocument = {
        ...selectedDocument,
        bytes: updatedBytes,
        metadata: updatedMetadata,
        pdfDoc,
        hash: updatedHash,
      };

      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === selectedDocument.id ? updatedDocument : doc
        )
      );
      setSelectedDocument(updatedDocument);

      eventBus.publish("toast", {
        message: `Metadata "${key}" updated successfully!`,
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      eventBus.publish("toast", {
        message: "Failed to update metadata!",
        type: "danger",
        duration: 3000,
      });
      console.error("Error updating metadata:", error);
    }
  };

  const DocumentCard = ({ doc, handleDocumentClick, handleDeleteDocument }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        key={doc.id}
        className="relative flex-none w-48 bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-500 cursor-pointer shadow-sm transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <button
            onClick={() => handleDeleteDocument(doc)}
            className="absolute top-[-1px] left-[-1px] bg-red-600 text-white text-sm font-medium px-2 py-0 rounded shadow-md 
                   hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Delete
          </button>
        )}

        <div
          onClick={() => handleDocumentClick(doc)}
          className="absolute -top-2 -right-2 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded shadow-md 
                    scale-100 transition-transform duration-300 ease-in-out 
                    hover:bg-gray-300 hover:shadow-lg hover:scale-110"
        >
          Metadata
        </div>

        <div className="flex flex-col h-full mt-2">
          <div className="text-sm font-medium text-gray-900 truncate mb-1 mt-2">
            {doc.name}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {new Date(doc.date).toLocaleDateString()}
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-500">{doc.size}</span>
            <span className="text-xs px-2 py-1 mr-8 bg-gray-200 rounded-full text-gray-700">
              .{doc.type.toLowerCase()}
            </span>
          </div>
        </div>

        <div className="absolute bottom-1 right-2 group flex items-center">
          <CheckCircle2
            className={`w-5 h-5 ${doc.verified ? "text-blue-500" : "text-gray-200"}`}
          />
          <div
            className="absolute left-full ml-1 bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 opacity-0 scale-90 
                        transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:scale-100"
          >
            {doc.verified ? "Verified" : "Not verified"}
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentsList = () => (
    <div className="bg-white border-b border-gray-200 pb-4">
      <div className="px-6">
        <div style={{ width: "400px" }} className="overflow-x-auto whitespace-nowrap">
          <div className="flex space-x-4 mt-2">
            {documents.map((doc) => (
              <DocumentCard
                doc={doc}
                handleDocumentClick={() => handleDocumentClick(doc)}
                handleDeleteDocument={() => handleDeleteDocument(doc)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 pt-20">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 text-center">Veridian Docusign</h2>
          <p className="text-sm text-gray-500 mt-1 text-center">
            PDF signing tool using Keri Protocol
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => setShowStandardFields(!showStandardFields)}
              className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-md"
            >
              <span className="font-medium text-gray-800">Menu</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-800 transform transition-transform ${
                  showStandardFields ? "rotate-180" : ""
                }`}
              />
            </button>

            {showStandardFields && (
              <div className="mt-3 space-y-2">
                {standardFields.map((field) => (
                  <div
                    onClick={field.action}
                    key={field.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                    className="cursor-pointer flex items-center p-3 bg-white border border-gray-200 rounded-md cursor-move hover:bg-gray-50"
                  >
                    <div className="text-gray-600">{field.icon}</div>
                    <span className="ml-3 text-sm text-gray-800">
                      {field.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <WalletConnection
          walletId={walletId}
          setWalletId={setWalletId}
          showWalletMenu={showWalletMenu}
          setShowWalletMenu={setShowWalletMenu}
        />

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-800">Version a6nc8d</span>
            <span className="text-sm text-gray-800">
              <Github size={16} />
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {renderDocumentsList()}

        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          {!selectedDocument?.fileUrl ? (
            <div className="flex items-center justify-center h-full">
              <label className="flex flex-col items-center justify-center w-96 h-64 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <PDFViewer selectedPdfUrl={selectedDocument.fileUrl} />
          )}
        </div>
      </div>
      {selectedDocument && (
        <DocumentModal
          open={showMetadataModal}
          document={selectedDocument}
          addMetadataField={handleAddFieldMetadata}
          deleteMetadataField={(key) => handleDeleteFieldMetadata(key)}
          onClose={closeModal}
        />
      )}
      <SignatureModal
        open={showSignatureModal}
        onClose={() => closeSingatureModal()}
        addSignature={(signature, name, title) =>
          addVisualSignature(signature, name, title)
        }
      />
    </div>
  );
};

export default DocuSignInterface;