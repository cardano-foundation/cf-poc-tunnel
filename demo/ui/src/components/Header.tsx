import React from "react";
import { useNavigate } from "react-router-dom";
import iiwLogo from "../assets/iiw-dog-logo.png";
import cardanoLogo from "../assets/cardano.png";
import profileImage from "../assets/profile.png";
import { useAuth } from "./AuthProvider";

const Header: React.FC = () => {
  let navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  return (
    <header className="text-white body-font shadow w-full fixed top-0 left-0 z-50 bg-black bg-opacity-60">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <div
          className="flex title-font font-medium items-center text-white mb-4 md:mb-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={iiwLogo} alt="Logo" className="w-12 mr-2" />
          <span className="text-xl">Demo IIW</span>
          <span className="ml-2 pt-2 text-sm text-white opacity-55">
            by Cardano Foundation
          </span>
          <img
            src={cardanoLogo}
            alt="Cardano Foundation Logo"
            className="h-6 ml-2 opacity-55"
          />
        </div>
        <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          <a
            href="#"
            className="mr-5 text-white hover:text-gray-300 cursor-pointer"
          >
            About
          </a>
          <a
            onClick={() => navigate("/demo")}
            className="mr-5 text-white hover:text-gray-300 cursor-pointer"
          >
            Demo
          </a>
          {isLoggedIn ? (
            <>
              <div className="flex items-center mr-5 cursor-pointer">
                <span
                  onClick={() => navigate("/profile")}
                  className="text-white hover:text-gray-300"
                >
                  {user?.username}
                </span>
                <img
                  onClick={() => navigate("/profile")}
                  src={profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full ml-2"
                />
              </div>
            </>
          ) : (
            <a
              onClick={() => navigate("/login")}
              className="mr-5 text-white hover:text-gray-300 cursor-pointer"
            >
              Login
            </a>
          )}
        </nav>
      </div>
    </header>
  );
};

export { Header };
