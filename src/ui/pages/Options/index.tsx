import ReactDOM from "react-dom/client";
import React from "react";
import {BrowserRouter} from "react-router-dom";
import {Options} from "./Options";

const index = ReactDOM.createRoot(
    document.getElementById('options') as HTMLElement
);

index.render(
    <React.StrictMode>
        <BrowserRouter basename="/options.html"><Options /></BrowserRouter>
        </React.StrictMode>
);