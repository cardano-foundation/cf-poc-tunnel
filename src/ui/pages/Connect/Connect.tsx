import React from 'react';
import {useLocation} from "react-router-dom";
import './Connect.scss';
import {BackButton} from "../../components/BackButton/BackButton";
import {QRCode} from "react-qrcode-logo";

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
                <h1>Connect with wallet</h1>
                <QRCode
                    value={'OOBI-connection'}
                    size={250}
                    fgColor={"black"}
                    bgColor={"white"}
                    qrStyle={"squares"}
                    logoImage={""} // Optional
                    logoWidth={60}
                    logoHeight={60}
                    logoOpacity={1}
                    quietZone={10}
                />
                <p><strong>Portal: </strong> {session.name}</p>
                <p><strong>Server Public eAID:</strong> JJBD4S...9S23</p>
                <p><strong>Personal Public eAID:</strong> KO7G10D4S...1JS5</p>
            </div>
        </div>
    );
};

export {Connect};
