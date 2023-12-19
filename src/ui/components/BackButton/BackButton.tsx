import React from "react";
import {useNavigate} from "react-router-dom";

const BackButton: React.FC = () => {
    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1);
    };

    return <div className="go-back-button" onClick={goBack}>← Back</div>
}

export {BackButton}