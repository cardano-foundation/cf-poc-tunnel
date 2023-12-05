import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../styles/popup.scss';
import {Popup} from "./Popup";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
