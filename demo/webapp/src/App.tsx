import React from 'react';
import govLogo from './assets/gov.png';
import './App.css';

function sendMessageToExtension(data) {
    window.postMessage({
        type: "FROM_PAGE",
        text: data
    }, "*");
}

const App = () => {

    const handleLogin = async () => {
        sendMessageToExtension("Hey, extension!");
    }
    return (
        <>
      <div>
          <img src={govLogo} className="logo" alt="Vite logo" />
      </div>
      <h1>Web app</h1>
      <div className="card">
        <button className="login-button" onClick={() => handleLogin()}>
          <span>
              Login
          </span>
        </button>
      </div>
    </>
    )
}

export {App}
