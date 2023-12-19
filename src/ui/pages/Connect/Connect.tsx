import React from 'react';
import {useLocation} from "react-router-dom";
import './Connect.scss';
import {BackButton} from "../../components/BackButton/BackButton";

const Connect = () => {
    const location = useLocation();
    const session = location.state?.session;
    if (!session) {
        return <div>No session data available</div>;
    }

    return (
        <div className="sessionDetails">
            <BackButton />
            <div className="certificate">
                <h1>Connect</h1>
            </div>
        </div>
    );
};

export {Connect};
