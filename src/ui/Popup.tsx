import React from "react";
import {SessionList} from "./components/SessionList/SessionList";
import {NavBar} from "./components/NavBar/NavBar";

const Popup = () => {

    return (
        <div>
            <NavBar />
            <SessionList/>
        </div>
    );
}

export {
    Popup
}