import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  let logoutTimer: NodeJS.Timeout | string | number | undefined;

  const latestActivity = () => {
    chrome.storage.local.set({ latestActivity: Date.now() });
  };

  useEffect(() => {
    chrome.storage.local.get(['isLoggedIn', 'latestActivity'], function (result) {
      const now = Date.now();
      const inactiveTime = now - (result.latestActivity || 0);
      setIsLoggedIn(result.isLoggedIn || false);
      setIsLoading(false);

      if (result.isLoggedIn && inactiveTime > 5000) {
        logout();
      }
    });
  }, []);

  const resetLogoutTimer = () => {
    clearTimeout(logoutTimer);
    latestActivity();
    if (isLoggedIn) {
      logoutTimer = setTimeout(() => {
        logout();
      }, 1800000); // 30 min, TODO: refactor to settings
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resetLogoutTimer);
    window.addEventListener('keydown', resetLogoutTimer);
    window.addEventListener('scroll', resetLogoutTimer);
    window.addEventListener('click', resetLogoutTimer);

    return () => {
      window.removeEventListener('mousemove', resetLogoutTimer);
      window.removeEventListener('keydown', resetLogoutTimer);
      window.removeEventListener('scroll', resetLogoutTimer);
      window.removeEventListener('click', resetLogoutTimer);
    };
  }, [isLoggedIn]);

  const login = async () => {
    chrome.storage.local.set({ isLoggedIn: true }).then(() => {
      setIsLoggedIn(true);
      resetLogoutTimer();
    });
  };

  const logout = () => {
    chrome.storage.local.set({ isLoggedIn: false }).then(() => {
      setIsLoggedIn(false);
      clearTimeout(logoutTimer);
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
