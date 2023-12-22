import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(['isLoggedIn'], function (result) {
      setIsLoggedIn(result.isLoggedIn || false);
      setIsLoading(false);
    });
  }, []);

  const login = async () => {
    chrome.storage.local
      .set({ isLoggedIn: true })
      .then(() => setIsLoggedIn(true));
  };

  const logout = () => {
    chrome.storage.local
      .set({ isLoggedIn: false })
      .then(() => setIsLoggedIn(false));
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
