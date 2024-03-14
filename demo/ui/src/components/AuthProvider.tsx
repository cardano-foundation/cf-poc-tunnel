import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { createAxiosClient } from "../extension/axiosClient";
import { AxiosError } from "axios";

export const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be use inside AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyLogin = async () => {
      const axiosClient = createAxiosClient();
      try {
        await axiosClient.post(`${SERVER_ENDPOINT}/ping`, {
          dummy: "data",
        });
        setIsLoggedIn(true);
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            setIsLoggedIn(false);
          }
        }
      }
    };

    verifyLogin();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth };
