import React, { useState } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import "./qrCodeReader.scss";

const QrCodeReader = () => {
  const [data, setData] = useState<string>("No QR code detected");
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const handleScan = (data: string | null) => {
    if (data) {
      setData(data);
      console.log(`QR Code detected: ${data}`);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError("Failed to access the camera. Please check device permissions.");
    setIsCameraActive(false);
  };

  return (
    <div>
      {isCameraActive ? (
        <QrScanner onError={handleError} onDecode={handleScan} />
      ) : (
        <p>{error || "Camera access is not active."}</p>
      )}
      <p>{data}</p>
    </div>
  );
};

export { QrCodeReader };
