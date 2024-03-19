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
import { eventBus } from "../utils/EventBus";

export const SERVER_ENDPOINT = import.meta.env.VITE_SERVER_ENDPOINT;

interface AuthContextType {
  isLoggedIn: boolean;
  isSessionCreated: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setIsSessionCreated: (loggedIn: boolean) => void;
  user: UserProps | undefined;
  verifyLogin: () => void;
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

interface UserProps {
  username: string;
  aid: string;
  validUntil: string;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSessionCreated, setIsSessionCreated] = useState(false);
  const [user, setUser] = useState<UserProps | undefined>(undefined);
  const navigate = useNavigate();

  const verifyLogin = async () => {
    console.info("Check login..");
    const axiosClient = createAxiosClient();
    try {
      const result = await axiosClient.post(`${SERVER_ENDPOINT}/ping`, {
        dummy: "data",
      });
      setUser({
        username: result.data.username,
        aid: result.data.aid,
        validUntil: result.data.validUntil,
      });
      setIsLoggedIn(true);
      eventBus.publish("toast", {
        message: `Login successfully`,
        type: "success",
        duration: 3000,
      });

    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          setIsLoggedIn(false);
          navigate("/login");
        }
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      await verifyLogin();
    };
    init();
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isSessionCreated,
        user,
        setIsLoggedIn,
        setIsSessionCreated,
        verifyLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth, AuthProvider };
