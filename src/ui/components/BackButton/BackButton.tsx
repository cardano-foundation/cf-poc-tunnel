import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.scss';

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="goBackButton">
      <span onClick={goBack}>← Back</span>
    </div>
  );
};

export { BackButton };
