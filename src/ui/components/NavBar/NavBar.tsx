import React from 'react';
import {useNavigate} from 'react-router-dom';
import './Navbar.scss';
import Logo from '../../../../static/icons/32x.png';

import QrCodeIcon from '../../../../static/icons/qrcode-icon.svg';
import SettingsIcon from '../../../../static/icons/settings-icon.svg';
import LockIcon from '../../../../static/icons/lock-icon.svg';

const NavBar = () => {
    const navigate = useNavigate();

    const handleMenuClick = (option:string) => {
        navigate(option);
    };

    const handleSettingsClick = () => {
        const settingsUrl = `chrome-extension://${(chrome.runtime.id)}/options.html`;
        window.open(settingsUrl, '_blank');
    };

    return (
        <div className='navBar'>
            <img src={Logo}  alt="Logo" className='logo' />

            <div className='title'>Project Tunnel</div>

            <button className='iconButton' onClick={() => handleMenuClick('/connect')}>
                <img src={QrCodeIcon} alt="QR Code" width={24}/>
            </button>
            <button className='iconButton' onClick={() => handleSettingsClick()}>
                <img src={SettingsIcon} alt="Settings" width={24}/>
            </button>
            <button className='iconButton ' onClick={() => handleMenuClick('/lock')}>
                <img src={LockIcon} alt="Lock" width={24}/>
            </button>
        </div>
    );
};

export { NavBar };
