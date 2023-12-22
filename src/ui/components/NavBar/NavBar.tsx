import React from 'react';
import './Navbar.scss';

import TunnelIcon from '../../../../static/icons/tunnel-icon.svg';
import SettingsIcon from '../../../../static/icons/settings-icon.svg';
import LockIcon from '../../../../static/icons/lock-icon.svg';
import { useAuth } from '../../Router/AuthProvider';

const NavBar = () => {
  const { logout, isLoggedIn } = useAuth();

  const handleSettingsClick = () => {
    const settingsUrl = `chrome-extension://${chrome.runtime.id}/options.html`;
    window.open(settingsUrl, '_blank');
  };

  return (
    <div className="navBar">
      <img src={TunnelIcon} alt="Logo" className="logo" width={24} />

      <div className="title">Tunnel</div>
      {isLoggedIn ? (
        <>
          <button className="iconButton" onClick={() => handleSettingsClick()}>
            <img src={SettingsIcon} alt="Settings" width={24} />
          </button>
          <button className="iconButton " onClick={() => logout()}>
            <img src={LockIcon} alt="Lock" width={24} />
          </button>
        </>
      ) : null}
    </div>
  );
};

export { NavBar };
