import React from "react";
import "./App.scss";
import { Header } from "./components/Header";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { Demo } from "./pages/Demo";
import { Profile } from "./pages/Profile";
import DocuSign from "./pages/DocuSign";

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
          <Route path="/DocuSign" element={<DocuSign />} />
        </Routes>
      </div>
    </>
  );
};

export { App };

if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export {};
