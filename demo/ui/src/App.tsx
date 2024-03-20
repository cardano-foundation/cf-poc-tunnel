import React from "react";
import "./App.scss";
import { Header } from "./components/Header";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { Demo } from "./pages/Demo";
import { Profile } from "./pages/Profile";

const App: React.FC = () => {
  return (
    <>
      <div className="w-screen">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </>
  );
};

export { App };
