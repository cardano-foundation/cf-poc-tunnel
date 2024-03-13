import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@components/router/authProvider";
import {QRScanner} from "@pages/qrscanner/qrscanner";

function render() {
  const qrScannerContainer = document.querySelector("#qrscanner");
  if (!qrScannerContainer) throw new Error("Can't find Qrscanner root element");
  const root = createRoot(qrScannerContainer);
  root.render(
    <BrowserRouter>
      <AuthProvider>
        <QRScanner />
      </AuthProvider>
    </BrowserRouter>,
  );
}

render();
