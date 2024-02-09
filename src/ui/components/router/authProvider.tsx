import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => void;
  isLoggedInFromStorage: () => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}
const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  let logoutTimer: NodeJS.Timeout | string | number | undefined;

  const latestActivity = () => {
    chrome.storage.local.set({ latestActivity: Date.now() });
  };

  useEffect(() => {
    chrome.storage.local.get(
      ["isLoggedIn", "latestActivity"],
      function (result) {
        const now = Date.now();
        const inactiveTime = now - (result.latestActivity || 0);
        setIsLoggedIn(result.isLoggedIn || false);
        setIsLoading(false);

        if (result.isLoggedIn && inactiveTime > 1800000) {
          logout();
        }
      },
    );
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
    window.addEventListener("mousemove", resetLogoutTimer);
    window.addEventListener("keydown", resetLogoutTimer);
    window.addEventListener("scroll", resetLogoutTimer);
    window.addEventListener("click", resetLogoutTimer);

    return () => {
      window.removeEventListener("mousemove", resetLogoutTimer);
      window.removeEventListener("keydown", resetLogoutTimer);
      window.removeEventListener("scroll", resetLogoutTimer);
      window.removeEventListener("click", resetLogoutTimer);
    };
  }, [isLoggedIn]);

  const isLoggedInFromStorage = async (): Promise<boolean> => {
    const result = await chrome.storage.local.get(["isLoggedIn"]);
    return result.isLoggedIn;
  };
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
    <AuthContext.Provider
      value={{ isLoggedIn, login, logout, isLoggedInFromStorage }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
