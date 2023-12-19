import React, {useState} from 'react';
import '../../../../styles/options.scss';

const Options = () => {
    const [endpoint, setEndpoint] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);

    const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndpoint(e.target.value);
    };

    const saveEndpoint = () => {
        // Save the endpoint logic
    };

    const clearDatabase = () => {
        // Clear database logic
    };

    const viewLogs = () => {
        // Fetch and set logs logic
        setLogs(['Log 1', 'Log 2']); // Example logs
    };

    return (
        <div className='settingsPage'>
            <div className='section'>
                <h2>Configure Endpoints</h2>
                <input
                    type="text"
                    value={endpoint}
                    onChange={handleEndpointChange}
                />
                <button onClick={saveEndpoint}>Save</button>
            </div>
            <div className='section'>
                <h2>Database Operations</h2>
                <button onClick={clearDatabase}>Clear Database</button>
            </div>
            <div className='section'>
                <h2>Logs</h2>
                <button onClick={viewLogs}>View Logs</button>
                <div className='logs'>
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export {
    Options
}