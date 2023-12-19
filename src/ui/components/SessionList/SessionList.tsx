import React, {useEffect, useState} from 'react';
import './SessionList.scss';
import { Countdown } from "../Countdown/Countdown";

interface Session {
    id: string;
    name: string;
    expiryDate: string;
}

const SessionList: React.FC = () => {
    const [sessions, setSessions] = useState([]);

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


    const handleDelete = (id: string) => {
        console.log('Delete session:', id);
    };

    return (
        <ul className='list'>
            {sessions.map((session) => (
                <li key={session.id} className='listItem'>
                    <div>
                        <div className='primaryText'>{session.name}</div>
                        <div className='secondaryText'>
                            <Countdown expiryDate={session.expiryDate} />
                        </div>
                    </div>
                    <button
                        className='deleteButton'
                        onClick={() => handleDelete(session.id)}
                    >
                        Delete
                    </button>
                </li>
            ))}
        </ul>
    );
};

export { SessionList };
