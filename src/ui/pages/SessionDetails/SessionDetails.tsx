import React from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import './SessionDetails.scss';
import {BackButton} from "../../components/BackButton/BackButton";

const SessionDetails = () => {
    const location = useLocation();
    const session = location.state?.session;
    if (!session) {
        return <div>No session data available</div>;
    }

    return (
        <div className="sessionDetails">
            <BackButton />
            <div className="certificate">
                <h1>{session.name}</h1>
                <div className="session-info">
                    <p><strong>Expiration:</strong> {session.expiryDate}</p>
                    <p><strong>Server Public eAID:</strong> JJBD4S...9S23</p>
                    <p><strong>Personal Public eAID:</strong> KO7G10D4S...1JS5</p>
                </div>
                <button
                    className='deleteButton'
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export {SessionDetails};
