import React from 'react';
import { Button, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import {Countdown} from "../Countdown/Countdown";

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
        <List>
            {sessions.map((session) => (
                <ListItem key={session.id}>
                    <ListItemText
                        primary={session.name}
                        secondary={<Countdown expiryDate={session.expiryDate} />}
                        sx={{
                            '& .MuiListItemText-primary': { color: 'white' },
                            '& .MuiListItemText-secondary': { color: '#a9abb1', cursor: 'pointer' }
                        }}
                    />
                    <ListItemSecondaryAction>
                        <Button variant="contained" onClick={() => handleDelete(session.id)}>Delete</Button>
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
        </List>
    );
};

export {SessionList};