import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import {ToastProvider} from "./components/Toast/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <ToastProvider>
          <App />
      </ToastProvider>
  </React.StrictMode>,
);
