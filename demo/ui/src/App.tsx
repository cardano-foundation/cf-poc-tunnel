import React from 'react';
import govLogo from './assets/gov.png';
import './App.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendMessageToExtension(data: any) {
  window.postMessage(
    {
      type: 'LOGIN_FROM_WEB',
      data,
    },
    '*',
  );
}

const App = () => {
  const handleLogin = async () => {
    const enterpriseData = {};
    sendMessageToExtension(enterpriseData);
  };
  return (
    <>
      <div>
        <img src={govLogo} className="logo" alt="Vite logo" />
      </div>
      <h1>Web app</h1>
      <div className="card">
        <button className="login-button" onClick={() => handleLogin()}>
          <span>Login</span>
        </button>
      </div>
    </>
  );
};

export { App };
