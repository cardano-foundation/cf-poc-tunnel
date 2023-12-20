import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Connect.scss';
import { BackButton } from '../../components/BackButton/BackButton';
import { QRCode } from 'react-qrcode-logo';
import Logo from '../../../../static/icons/img.png';

const Connect = () => {
  const location = useLocation();
  const [session, setSession] = useState(location.state?.session);
  const [isBlurred, setIsBlurred] = useState(true);
  if (!session) {
    return <div>No session data available</div>;
  }

  const handleGenerateEaid = () => {
    setIsBlurred(false);
    const s = { ...session };
    s.personalPubeid = 'XSLOM7D...54S0S4';
    setSession(s);
  };

  return (
    <div className="sessionDetails">
      <BackButton />
      <div className="certificate">
        <h1>Connect with wallet</h1>
        <div
          className={
            isBlurred ? 'blurEffectHover blurEffect' : 'blurEffectHover'
          }
        >
          {' '}
          <QRCode
            value={
              session.personalPubeid?.length
                ? session.personalPubeid
                : 'OOBI-connection'
            }
            size={192}
            fgColor={'black'}
            bgColor={'white'}
            qrStyle={'squares'}
            logoImage={Logo}
            logoWidth={60}
            logoHeight={60}
            logoOpacity={1}
            quietZone={10}
          />{' '}
        </div>

        <p>
          <strong>Portal: </strong> {session.name}
        </p>
        <p>
          <strong>Server Public eAID: </strong>
          {session.serverPubeid}
        </p>
        <p>
          <strong>Personal Public eAID: </strong>
          {session.personalPubeid.length ? (
            session.personalPubeid
          ) : (
            <span className="generateLabel" onClick={handleGenerateEaid}>
              Generate eAID
            </span>
          )}
        </p>
        <p>
          <strong>OOBI: </strong> {session.oobi}
        </p>
        <p>
          <strong>ACDC: </strong> {session.acdc}
        </p>
      </div>
    </div>
  );
};

export { Connect };
