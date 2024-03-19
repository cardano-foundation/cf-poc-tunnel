import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  logout: () => void;
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
  const location = useLocation();

  const verifyLogin = async () => {
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
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userData", JSON.stringify(result.data));
      eventBus.publish("toast", {
        message: `Login successfully`,
        type: "success",
        duration: 3000,
      });

      if (location.pathname === "/login") {
        navigate("/demo");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          eventBus.publish("toast", {
            message: `Session expired, please, login again`,
            type: "danger",
            duration: 5000,
          });
          logout();
        }
      }
    }
  };

  useEffect(() => {
    const storedIsLoggedIn = sessionStorage.getItem("isLoggedIn");
    const storedUserData = sessionStorage.getItem("userData");

    if (storedIsLoggedIn && storedUserData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUserData));
    } else {
      verifyLogin();
    }
  }, [navigate]);

  const logout = () => {
    setIsLoggedIn(false);
    setUser(undefined);
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userData");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isSessionCreated,
        user,
        setIsLoggedIn,
        setIsSessionCreated,
        verifyLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth, AuthProvider };
