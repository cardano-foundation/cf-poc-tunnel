import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SERVER_ENDPOINT, useAuth } from "../components/AuthProvider";
import profileImage from "../assets/profile.png";
import { createAxiosClient } from "../extension/axiosClient";
import { AxiosError } from "axios";
import { eventBus } from "../utils/EventBus";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const handleLogout = async () => {
    const axiosClient = createAxiosClient();
    try {
      await axiosClient.post(`${SERVER_ENDPOINT}/logout`, {
        dummy: "data",
      });
      logout();
      eventBus.publish("toast", {
        message: `Logout successfully`,
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        eventBus.publish("toast", {
          message: `Logout failed`,
          type: "danger",
          duration: 5000,
        });
      }
      throw err;
    }
  };

  return (
    <div className="relative h-screen flex items-center justify-center text-center bg-locker bg-cover bg-no-repeat">
      <div className="hero-content z-10 p-8 md:p-12 bg-black bg-opacity-80 rounded-lg">
        <h2 className="font-bold break-normal text-white text-3xl md:text-4xl mb-4">
          Profile
        </h2>
        <div className="flex flex-col justify-center items-center text-white">
          <div className="p-6 max-w-2xl rounded-lg shadow-md">
            <div className="flex justify-center mb-6">
              <img
                src={profileImage}
                alt="Profile"
                className="rounded-full w-64 h-64 border-4 border-gray-700"
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="text-left">
                <p>
                  <span className="font-semibold">Username:</span>{" "}
                  {user?.username}
                </p>
                <p>
                  <span className="font-semibold">Valid Until:</span>{" "}
                  {new Date(user?.validUntil || "").toLocaleString([], {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>{" "}
              </div>
              <div className="text-left">
                <p className="break-words">
                  <span className="font-semibold">AID:</span> {user?.aid}
                </p>
              </div>
            </div>
            <button
              className="mt-6 px-6 py-2 text-white font-bold bg-red-600 hover:bg-red-700 rounded"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Profile };
