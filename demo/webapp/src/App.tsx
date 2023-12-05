import React from 'react';
import govLogo from './assets/gov.png';
import './App.css';

const App = () => {

    const handleLogin = () => {

    }
    return (
    <>
      <div>
          <img src={govLogo} className="logo" alt="Vite logo" />
      </div>
      <h1>platform.gov</h1>
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
