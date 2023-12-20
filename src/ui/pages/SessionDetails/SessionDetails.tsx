import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import './SessionDetails.scss';
import { BackButton } from '../../components/BackButton/BackButton';

const SessionDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = location.state?.session;
  if (!session) {
    return <div>No session data available</div>;
  }
  const deleteSession = () => {
    if (navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        console.log("Session deleted");
        navigate(-1)
      };

      navigator.serviceWorker.controller.postMessage({ type: 'DELETE_SESSION', sessionId: session.id }, [
        messageChannel.port2,
      ]);
    }
  };
  return (
    <div className="sessionDetails">
      <BackButton />
      <div className="certificate">
        <h1>{session.name}</h1>
        <div className="session-info">
          <p>
            <strong>
              {session.expiryDate ? (
                <>Expiration:</>
              ) : (
                <> Login with your wallet </>
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
        <button className="deleteButton" onClick={() => deleteSession()}>Delete</button>
      </div>
    </div>
  );
};

export { SessionDetails };
