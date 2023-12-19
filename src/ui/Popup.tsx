import React from 'react';
import {SessionList} from './components/SessionList/SessionList';
import {NavBar} from './components/NavBar/NavBar';
import {Routes, Route, useLocation} from "react-router-dom";

const Popup = () => {
    const location = useLocation();

    console.log(location);
    console.log('Ruta actual:', location.pathname);

    return (
        <div>
            <NavBar />
            <Routes>
                <Route path="/" element={<SessionList />} />
                <Route path="*" element={<div>Ruta no encontrada</div>} />
            </Routes>
        </div>
    );
}

export {
    Popup
}