import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SessionDetails.scss';
import { BackButton } from '../../components/BackButton/BackButton';
import MobileConnectIcon from '../../../../static/icons/mobile-connect-icon.svg';

const SessionDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = location.state?.session;
  if (!session) {
    return <div>No session data available</div>;
  }
  const handleLogin = () => {
    navigate(`/${session.id}/connect`, { state: { session } });
  };

  const deleteSession = () => {
    chrome.storage.local.get(['sessions'], function (result) {
      const ss = result.sessions.filter((s) => session.id !== s.id);

      chrome.storage.local.set({ sessions: ss }, function () {
        navigate(-1);
      });
    });
  };
  return (
    <div className="sessionDetails">
      <BackButton />
      <div className="certificate">
        <h1>
          {session.name} <span className="starIcon">★</span>
        </h1>
        <div className="session-info">
          <p>
            <strong>
              {session.expiryDate ? (
                <>Expiration:</>
              ) : (
                <>
                  <div className="loginLabel" onClick={handleLogin}>
                    <img src={MobileConnectIcon} width={20} /> Login with your
                    wallet{' '}
                  </div>
                </>
              )}
            </strong>{' '}
            {session.expiryDate}
          </p>
          <p>
            <strong>Server Public eAID:</strong> {session.serverPubeid}
          </p>
          <p>
            <strong>Personal Public eAID:</strong> {session.personalPubeid}
          </p>
          <p>
            <strong>OOBI: </strong>
            {session.oobi}
          </p>
          <p>
            <strong>Enterprise ACDC: </strong>
            {session.acdc}
          </p>
        </div>
        <button className="deleteButton" onClick={() => deleteSession()}>
          Delete
        </button>
      </div>
    </div>
  );
};

export { SessionDetails };
