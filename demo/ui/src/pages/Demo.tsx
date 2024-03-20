import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAxiosClient } from "../extension/axiosClient";
import { AxiosError } from "axios";
import { SERVER_ENDPOINT, useAuth } from "../components/AuthProvider";
import {eventBus} from "../utils/EventBus";

interface ContentItem {
  name: string;
  date: string;
  size: string;
  type: "json";
  icon: string;
}

interface HttpHeaders {
  [key: string]: string;
}
interface HttpResponse {
  [key: string]: string;
}

const contents: ContentItem[] = [
  {
    name: "Ping",
    date: "2024-20-03",
    size: "2kb",
    type: "json",
    icon: "📄",
  },
];

const Demo: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();


  const [response, setResponse] = useState<HttpResponse | undefined>(undefined);
  const [headers, setHeaders] = useState<HttpHeaders | undefined>(undefined);
  const { isLoggedIn } = useAuth();

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.maxHeight = isExpanded ? `${contentRef.current.scrollHeight}px` : "0px";
    }
  }, [isExpanded]);

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
      setHeaders(JSON.parse(JSON.stringify(response.headers)));
      setResponse(response.data)
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          eventBus.publish("toast", {
            message: `Session expired, please, login again`,
            type: "danger",
            duration: 5000,
          });
          logout();
          return;
        }
      }
      throw err;
    }
  };

  const handleClick = (): void => {
    handleFetch();
  };

  const headerColor = "bg-[#DDA15E]";
  const responseColor = "bg-[#BC6C25]";

  return (
    <div className="relative h-screen flex items-center justify-center text-center bg-demo bg-cover bg-no-repeat">
      <div className="hero-content z-10 p-8 md:p-24 bg-black bg-opacity-80 rounded-lg">
        <h2 className="font-bold break-normal text-white text-3xl md:text-4xl mb-4">
          Decrypt remote resources using KERI identifiers
        </h2>
        <p className="text-sm md:text-base text-white font-bold mb-6">
          FILES <span className="text-gray-200">/ Server</span>
        </p>
        <div className="flex flex-col space-y-4">
          {contents.map((content, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 items-center p-4 bg-white bg-opacity-90 rounded-md shadow cursor-pointer hover:bg-opacity-100 transition duration-200 ease-in-out"
              onClick={() => handleClick()}
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

        <div
          className={`w-full max-w-4xl my-8 rounded-md shadow-lg overflow-hidden`}
        >
          <div
            className={`${headerColor} w-full cursor-pointer p-4`}
            onClick={toggleExpansion}
          >
            <div className="text-left font-semibold">
              HTTP Headers (click to {isExpanded ? "hide" : "view"})
            </div>
          </div>

          <div
            ref={contentRef}
            className="transition-max-height duration-500 ease-in-out overflow-hidden"
          >
            <div className="text-left bg-white p-4 divide-y divide-gray-200">
              {headers && Object.entries(headers).map(([key, value], index) => (
                <div key={index} className="py-2 flex flex-wrap">
                  <span className="font-bold text-gray-700 w-full md:w-1/3 pr-4 break-words">
                    {key}:
                  </span>
                  <span className="text-gray-600 w-full md:w-2/3 break-words">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${responseColor} w-full p-4 text-left`}>
            <div>
              <span className="font-bold">Message:</span> {response?.message}
            </div>
            <div>
              <span className="font-bold">Username:</span> {response?.username}
            </div>
            <div>
              <span className="font-bold">Valid Until:</span>{" "}
              {new Date(response?.validUntil || "").toLocaleString()}
            </div>
            <div>
              <span className="font-bold">AID:</span> {response?.aid}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Demo };
