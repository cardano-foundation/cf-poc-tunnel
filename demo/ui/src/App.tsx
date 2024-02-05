import React, {useEffect, useState} from 'react';
import govLogo from './assets/gov.png';
import './App.scss';

function sendMessageToExtension(type: string, data: any) {
  window.postMessage(
    {
      type: type,
      data,
    },
    '*',
  );
}

const App = () => {

  const [headersToSign, setHeadersToSign] = useState({
    'Content-Type': 'application/json',
    PUBLIC_AID: 'value',
  });
  const [signedHeaders, setSignedHeaders] = useState({});
  useEffect(() => {
    window.addEventListener('message', (e) => {
      const hostname = (new URL(e.origin)).hostname;
      if (hostname === window.location.hostname){
        const message = e.data;
        if (message !== null && message?.type === 'SIGNED_HEADERS'){
          setSignedHeaders(message.data.signedHeaders);
        }
      }
    });
  });

  const handleCreateSession = async () => {
    const enterpriseData = {};
    sendMessageToExtension('LOGIN_FROM_WEB', enterpriseData);
  };
  const handleFetch = async () => {
    const request = {
      data: {
        url: 'http://localhost:3001',
        headers: headersToSign,
        method: 'GET',
        query: '',
      },
    };
    sendMessageToExtension('HANDLE_FETCH', request);
  };
  return (
    <>
      <div>
        <img src={govLogo} className="logo" alt="Vite logo" />
      </div>
      <h1>Web app</h1>
      <div className="buttonsContainer">
        <button className="button" onClick={() => handleCreateSession()}>
          1. Init session
        </button>
        <div className='separator'/>
        <button className="button" onClick={() => handleFetch()}>
          2. Sign Headers
        </button>
      </div>
      <div>
        {Object.keys(signedHeaders).length ? <>
          <h3>Signed Headers</h3>
          <div className="jsonDisplay">
            <pre>{JSON.stringify(signedHeaders, null, 2)}</pre>
          </div>
        </> : null}
      </div>
    </>
  );
};

export { App };
