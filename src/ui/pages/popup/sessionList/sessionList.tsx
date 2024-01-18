import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Countdown } from '@components/countdown';
import './sessionList.scss';
import MobileConnectIcon from '../../../assets/mobile-connect-icon.svg';
import { isExpired } from '@src/utils';

interface Session {
  id: string;
  name: string;
  expiryDate: string;
}

export default function SessionList() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);

  const handleNavigation = (
    option: string,
    p: { state: { session: Session } },
  ) => {
    navigate(option, p);
  };

  useEffect(() => {
    chrome.storage.local.get(['sessions'], function (result) {
      setSessions(result.sessions);
    });
  }, []);

  const handleConnect = (session: Session) => {
    handleNavigation(`/${session.id}/connect`, { state: { session } });
  };

  const handleInfo = (session: Session) => {
    handleNavigation(`/${session.id}`, { state: { session } });
  };

  return (
    <ul className="list">
      {sessions.map((session) => {
        return (
          <li key={session.id} className="listItem">
            <div className="sessionName">
              <div className="primaryText">{session.name}</div>
              <div className="secondaryText">
                {session.expiryDate && isExpired(session.expiryDate) ? (
                  <>Expired</>
                ) : (
                  <Countdown expiryDate={session.expiryDate} />
                )}
              </div>
            </div>
            {!session.expiryDate || session.expiryDate === 0 ? (
              <button
                className="iconButton"
                onClick={() => handleConnect(session)}
              >
                <img className="icon" src={MobileConnectIcon} width={30} />
                <span className="label">Login</span>
              </button>
            ) : null}
            <div className="buttonGroup">
              <span onClick={() => handleInfo(session)} className="infoButton">
                {' '}
                →{' '}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
