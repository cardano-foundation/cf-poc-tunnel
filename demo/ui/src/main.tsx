import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { App } from "./App";
import "./index.css";
import { ToastProvider } from "./components/Toast/ToastProvider";
import { AuthProvider } from "./components/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Router>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </Router>,
);
