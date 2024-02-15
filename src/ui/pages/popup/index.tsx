import React from "react";
import "./popup.scss";
import { BrowserRouter } from "react-router-dom";

import { createRoot } from "react-dom/client";
import { Popup } from "@pages/popup/popup";

function render() {
  const rootContainer = document.querySelector("#popup");
  if (!rootContainer) throw new Error("Can't find Popup root element");
  const root = createRoot(rootContainer);
  root.render(
    <BrowserRouter basename="/src/ui/pages/popup/index.html">
      <Popup />
    </BrowserRouter>,
  );
}

render();
