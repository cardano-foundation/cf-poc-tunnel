import React from 'react';
import './SessionList.scss';
import { Countdown } from "../Countdown/Countdown";

interface Session {
    id: string;
    name: string;
    expiryDate: string;
}

const sessions: Session[] = [
    { id: '1', name: 'voting-app.org', expiryDate: '2024-04-05' },
    { id: '2', name: 'platform.gov', expiryDate: '2024-05-10' }
];

const SessionList: React.FC = () => {

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
