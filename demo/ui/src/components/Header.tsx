import React from "react";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  let navigate = useNavigate();

  return (
    <header className="text-white body-font shadow w-full fixed top-0 left-0 z-50 bg-black bg-opacity-60">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <div
          className="flex title-font font-medium items-center text-white mb-4 md:mb-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="ml-3 text-xl">Demo IIW</span>
        </div>
        <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          <a href="#" className="mr-5 text-white hover:text-gray-300">
            About
          </a>
          <a href="#" className="mr-5 text-white hover:text-gray-300">
            Demo
          </a>
          <a href="#" className="mr-5 text-white hover:text-gray-300">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};

export { Header };
