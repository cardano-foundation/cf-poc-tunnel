import React, { useState } from 'react';
import './Options.scss';
const Options = () => {
  const [endpoint, setEndpoint] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndpoint(e.target.value);
  };

  const saveEndpoint = () => {
    // save in local
  };

  const clearDatabase = () => {
    // Clear database
  };

  const viewLogs = () => {
    // Fetch and set logs
    setLogs(['Log 1', 'Log 2']);
  };

  return (
    <div className="optionsPage">
      <div className="section">
        <h2>Keria endpoint</h2>
        <input type="text" value={endpoint} onChange={handleEndpointChange} />
        <button onClick={saveEndpoint}>Save</button>
      </div>
      <div className="section">
        <h2>Local database</h2>
        <button onClick={clearDatabase}>Clear Database</button>
      </div>
      <div className="section">
        <h2>Check logs</h2>
        <button onClick={viewLogs}>View Logs</button>
        {logs.length ? (
          <div className="logs">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { Options };
