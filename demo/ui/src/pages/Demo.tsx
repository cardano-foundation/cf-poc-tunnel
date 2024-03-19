import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAxiosClient } from "../extension/axiosClient";
import { AxiosError } from "axios";
import { SERVER_ENDPOINT, useAuth } from "../components/AuthProvider";

interface ContentItem {
  name: string;
  date: string;
  size: string;
  type: "txt";
  icon: string;
}

const contents: ContentItem[] = [
  {
    name: "Plain Text",
    date: "2022-03-01",
    size: "2MB",
    type: "txt",
    icon: "📄",
  },
];

const Demo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedContent, setSelectedContent] = useState<
    ContentItem | undefined
  >(undefined);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const handleFetch = async () => {
    const axiosClient = createAxiosClient();
    try {
      const response = await axiosClient.post(`${SERVER_ENDPOINT}/ping`, {
        dummy: "data",
      });
      console.log(JSON.parse(JSON.stringify(response.headers)));
      console.log(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          alert(err.response.data ?? "Not logged in!");
          return;
        }
      }
      throw err;
    }
  };

  const handleClick = (content: ContentItem): void => {
    setSelectedContent(content);
    handleFetch();
  };

  return (
    <div className="relative h-screen flex items-center justify-center text-center bg-demo bg-cover bg-no-repeat">
      <div className="hero-content z-10 p-8 md:p-24 bg-black bg-opacity-80 rounded-lg">
        <h2 className="font-bold break-normal text-white text-3xl md:text-4xl mb-4">
          Decrypt remote resources using Keria Identities
        </h2>
        <p className="text-sm md:text-base text-white font-bold mb-6">
          FILES <span className="text-gray-200">/ Server</span>
        </p>
        <div className="flex flex-col space-y-4">
          {contents.map((content, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 items-center p-4 bg-white bg-opacity-90 rounded-md shadow cursor-pointer hover:bg-opacity-100 transition duration-200 ease-in-out"
              onClick={() => handleClick(content)}
            >
              <span className="col-span-1 text-center text-2xl">
                {content.icon}
              </span>
              <span className="col-span-1 font-medium text-gray-500">
                {content.name}
              </span>
              <span className="col-span-1 text-sm text-gray-500">
                {content.date}
              </span>
              <span className="col-span-1 text-sm text-gray-500">
                {content.size}
              </span>
              <span className="col-span-1 text-sm text-gray-500 uppercase">
                {content.type}
              </span>
            </div>
          ))}
        </div>
        {selectedContent && (
          <div className="w-full max-w-4xl mt-10 p-6 bg-gray rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              Selected Content Details
            </h2>
            <p>
              <strong>Name:</strong> {selectedContent.name}
            </p>
            <p>
              <strong>Date:</strong> {selectedContent.date}
            </p>
            <p>
              <strong>Size:</strong> {selectedContent.size}
            </p>
            <p>
              <strong>Type:</strong> {selectedContent.type.toUpperCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { Demo };
