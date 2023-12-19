import React from 'react';
import './Navbar.scss';
import Logo from '../../../../static/icons/32x.png';

import QrCodeIcon from '../../../../static/icons/qrcode-icon.svg';
import SettingsIcon from '../../../../static/icons/settings-icon.svg';
import LockIcon from '../../../../static/icons/lock-icon.svg';

const NavBar = () => {
    return (
        <div className='navBar'>
            <img src={Logo}  alt="Logo" className='logo' />

            <div className='title'>Project Tunnel</div>

            <button className='iconButton'>
                <img src={QrCodeIcon} alt="QR Code" width={24}/>
            </button>
            <button className='iconButton'>
                <img src={SettingsIcon} alt="Settings" width={24}/>
            </button>
            <button className='iconButton'>
                <img src={LockIcon} alt="Lock" width={24}/>
            </button>
        </div>
    );
};

export { NavBar };
