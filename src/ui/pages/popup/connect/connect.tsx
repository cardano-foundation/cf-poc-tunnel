import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './connect.scss';
import { BackButton } from '@components/backButton';
import { QRCode } from 'react-qrcode-logo';
import Logo from '../../../assets/img.png';
import { generateAID, getCurrentDate } from '@src/ui/utils';
import { expirationTime } from '@src/core/background';

export default function Connect() {
  const location = useLocation();
  const [session, setSession] = useState(location.state?.session);
  const [qrCodeValue, setQrCodeValue] = useState('***');
  const [isBlurred, setIsBlurred] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  if (!session) {
    return <div>No session data available</div>;
  }

  const handleGenerateEaid = () => {
    if (showSpinner) return;

    setShowSpinner(true);

    generateAID().then((aid) => {
      chrome.storage.local.get(['sessions'], function (result) {
        let se = { ...session };
        const updatedSessions = result.sessions.map((s) => {
          if (s.id === se.id) {
            s.personalPubeid = aid.pubKey;
            s.expiryDate = getCurrentDate(expirationTime);
            se = s;
          }
          return s;
        });

        chrome.storage.local.set({ sessions: updatedSessions }, function () {
          chrome.runtime.sendMessage(
            {
              type: 'SET_PRIVATE_KEY',
              data: {
                pubKey: aid.pubKey,
                privKey: aid.privKey,
              },
            },
            () => {
              setShowSpinner(false);
              setSession(se);
              setQrCodeValue(`${aid.pubKey}:${aid.privKey}`);
              setIsBlurred(false);
            },
          );
        });
      });
    });
  };

  return (
    <div className="sessionDetails">
      <BackButton />
      <div className="certificate">
        <h1>Connect with wallet</h1>
        <p className="connectDescription">
          In order to connect, scan the QR code with your identity wallet
        </p>
        <div>
          <div
            className={
              isBlurred ? 'blurEffectHover blurEffect' : 'blurEffectHover'
            }
          >
            {' '}
            <QRCode
              value={qrCodeValue}
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
          {showSpinner && (
            <div className="spinnerOverlay">
              <div className="spinner"></div>
            </div>
          )}
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
}
