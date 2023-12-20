import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.scss';

import TunnelIcon from '../../../../static/icons/tunnel-icon.svg';
import SettingsIcon from '../../../../static/icons/settings-icon.svg';
import LockIcon from '../../../../static/icons/lock-icon.svg';

const NavBar = () => {
  const navigate = useNavigate();

  const handleNavigation = (option: string) => {
    navigate(option);
  };

  const handleSettingsClick = () => {
    const settingsUrl = `chrome-extension://${chrome.runtime.id}/options.html`;
    window.open(settingsUrl, '_blank');
  };

  return (
    <div className="navBar">
      <img src={TunnelIcon} alt="Logo" className="logo" width={24} />

      <div className="title">Tunnel</div>

      <button className="iconButton" onClick={() => handleSettingsClick()}>
        <img src={SettingsIcon} alt="Settings" width={24} />
      </button>
      <button className="iconButton " onClick={() => handleNavigation('/lock')}>
        <img src={LockIcon} alt="Lock" width={24} />
      </button>
    </div>
  );
};

export { NavBar };
