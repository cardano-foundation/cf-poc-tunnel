import React from 'react';
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
  const handleCreateSession = async () => {
    console.log('hey handleCreateSession');
    const enterpriseData = {};
    sendMessageToExtension('LOGIN_FROM_WEB', enterpriseData);
  };
  const handleFetch = async () => {
    console.log('hey handleFetch');
    const headers = {
      'Content-Type': 'application/json',
      PUBLIC_AID: 'value',
    };

    const request = {
      data: {
        url: 'http://localhost:3001',
        headers,
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
          Init session
        </button>
        <button className="button" onClick={() => handleFetch()}>
          Fetch
        </button>
      </div>
    </>
  );
};

export { App };
