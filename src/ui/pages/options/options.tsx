import React, { useEffect, useState } from 'react';
import './Options.scss';
import { useAuth } from '@components/router/authProvider';
import { LogEntry, Logger } from '@src/utils/logger';

const Options = () => {
  const [endpoint, setEndpoint] = useState<string>('');
  const { isLoggedIn, isLoggedInFromStorage, logout, login } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const checkIsLogged = async () => {
    const isLogged = await isLoggedInFromStorage();
    if (!isLogged) logout();
    else await login();
  };

  useEffect(() => {
    const logger = new Logger();
    logger.getLogs().then((lgs) => {
      setLogs(lgs);
    });
  });

  useEffect(() => {
    window.addEventListener('mousemove', checkIsLogged);
    window.addEventListener('keydown', checkIsLogged);
    window.addEventListener('scroll', checkIsLogged);
    window.addEventListener('click', checkIsLogged);

    return () => {
      window.removeEventListener('mousemove', checkIsLogged);
      window.removeEventListener('keydown', checkIsLogged);
      window.removeEventListener('scroll', checkIsLogged);
      window.removeEventListener('click', checkIsLogged);
    };
  }, [isLoggedIn]);

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
    const logger = new Logger();
    logger.getLogs().then((lgs) => {
      setLogs(lgs);
    });
  };

  return (
    <div className="optionsPage">
      {isLoggedIn ? (
        <>
          <div className="section">
            <h2>Keria endpoint</h2>
            <input
              type="text"
              value={endpoint}
              onChange={handleEndpointChange}
            />
            <button onClick={saveEndpoint}>Save</button>
          </div>
          <div className="section">
            <h2>Whitelist</h2>
            <button onClick={clearDatabase}>Add Enterprise Server</button>
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
                  <div key={index}>{`[${(new Date(log.timestamp)).toLocaleString()}]: `}{log.message}</div>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="lockMessage">Please, login again</div>
        </>
      )}
    </div>
  );
};

export { Options };
