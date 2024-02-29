import React, { useEffect, useState } from "react";
import "./Options.scss";
import { useAuth } from "@components/router/authProvider";
import { LogEntry, Logger } from "@src/utils/logger";

const Options = () => {
  const [endpoint, setEndpoint] = useState<string>("");
  const { isLoggedIn, isLoggedInFromStorage, logout, login } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const checkIsLogged = async () => {
    const isLogged = await isLoggedInFromStorage();
    if (!isLogged) logout();
    else await login();
  };

  const updateLogs = async () => {
    const logger = new Logger();
    const getLogsResult = await logger.getLogs();
    if (!getLogsResult.success) {
      return getLogsResult;
    }

    const sortedLogs = getLogsResult.data.sort(
      (a, b) => b.timestamp - a.timestamp,
    );
    setLogs(sortedLogs);
  };

  useEffect(() => {
    updateLogs();
  });

  useEffect(() => {
    const intervalId = setInterval(updateLogs, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", checkIsLogged);
    window.addEventListener("keydown", checkIsLogged);
    window.addEventListener("scroll", checkIsLogged);
    window.addEventListener("click", checkIsLogged);

    return () => {
      window.removeEventListener("mousemove", checkIsLogged);
      window.removeEventListener("keydown", checkIsLogged);
      window.removeEventListener("scroll", checkIsLogged);
      window.removeEventListener("click", checkIsLogged);
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
    updateLogs();
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
            <h2>Local database</h2>
            <button onClick={clearDatabase}>Clear Database</button>
          </div>
          <div className="section">
            <h2>Check logs</h2>
            <button onClick={viewLogs}>View Logs</button>
            {logs.length ? (
              <div className="logs">
                {logs.map((log, index) => (
                  <div
                    style={{
                      backgroundColor: index % 2 === 0 ? "#f2f2f2" : "#e4e4e4",
                      color: log.error ? "#B20000" : "",
                      marginBottom: "5px",
                      padding: "10px",
                      maxWidth: "570px",
                      overflowX: "auto",
                    }}
                    key={index}
                  >
                    {`[${new Date(log.timestamp).toLocaleString()}]: `}
                    {log.message}
                  </div>
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
