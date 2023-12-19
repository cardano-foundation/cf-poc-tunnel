import React from 'react';
import {SessionList} from './components/SessionList/SessionList';
import {NavBar} from './components/NavBar/NavBar';
import {Routes, Route, useLocation} from "react-router-dom";

const Popup = () => {
    return (
        <div>
            <NavBar />
            <Routes>
                <Route path="/" element={<SessionList />} />
                <Route path="*" element={<div>Route not found</div>} />
            </Routes>
        </div>
    );
}

export {
    Popup
}