import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import { Countdown } from "../Countdown/Countdown";
import './SessionList.scss';
import MobileConnectIcon from '../../../../static/icons/mobile-connect-icon.svg';

interface Session {
    id: string;
    name: string;
    expiryDate: string;
}

const SessionList: React.FC = () => {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);

    const handleNavigation = (option: string, p: { state: { session: Session } }) => {
        navigate(option, p);
    };

    useEffect(() => {
        if (navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = event => {
                setSessions(event.data as Session[])
            };

            navigator.serviceWorker.controller.postMessage(
                { type: 'GET_SESSIONS' },
                [messageChannel.port2]
            );
        }
    }, []);

    const handleConnect = (session: Session) => {
        handleNavigation(`/${session.id}/connect`, { state: { session }})
    };

    const handleInfo = (session: Session) => {
        handleNavigation(`/${session.id}`, { state: { session }})
    };

    return (
        <ul className='list'>
            {sessions.map((session) => (
                <li key={session.id} className='listItem'>
                    <div className='sessionName'>
                        <div className='primaryText'>{session.name}</div>
                        <div className='secondaryText'>
                            <Countdown expiryDate={session.expiryDate} />
                        </div>
                    </div>
                    <button className="iconButton"
                            onClick={() => handleConnect(session)}
                    >
                        <img className='icon' src={MobileConnectIcon} width={30} />
                        <span className="label">Connect</span>
                    </button>

                    <div className='buttonGroup'>
                        <span  onClick={() => handleInfo(session)} className='infoButton'> → </span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export { SessionList };
