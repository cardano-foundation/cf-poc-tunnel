import React, {useEffect, useRef, useState} from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedContent, setSelectedContent] = useState<
    ContentItem | undefined
  >(undefined);
  const [response, setResponse] = useState({
    "message": "Welcome, your Legal Entity Identifier is 5493001KJTIIGC8Y1R17",
    "username": "5493001KJTIIGC8Y1R17",
    "validUntil": "2024-03-19T09:42:04.552Z",
    "aid": "ECygYLCqfZutgV_WpKo1FVEixiF44q5EUT2FR7NwHztc"
  });
  const [headers, setHeaders] = useState({
    "content-length": "654",
    "content-type": "application/json; charset=utf-8",
    "signature": "indexed=\"?0\";signify=\"0BBc1TlM3O4CmL9isIiPDq4shzG66FWCgmhSAvpA7O2Ve5nXeGVmdp1R9vcASMeLq9aauF5Kz_UJMTOvgngI5rYO\"",
    "signature-input": "signify=(\"@method\" \"@path\" \"signify-resource\" \"signify-timestamp\");created=1710841051;keyid=\"BDlOCcJ5rgoUfctlg1gnqkzHmCYtgFa6P3cQOfpqjVKJ\";alg=\"ed25519\"",
    "signify-resource": "EG8ebM1_ANYRSw-KXxz7iGWqvamGkEM3TrWuZopIXeIL",
    "signify-timestamp": "2024-03-19T09:37:31.636000+00:00"
  });
  const { isLoggedIn } = useAuth();

  const toggleExpansion = () => {
    if (contentRef.current) {
      setIsExpanded(!isExpanded);contentRef.current.style.maxHeight = isExpanded ? '0px' : `${contentRef.current.scrollHeight}px`;
    }
  };
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

  const headerColor = 'bg-[#DDA15E]';
  const responseColor = 'bg-[#BC6C25]';

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

        <div className={`w-full max-w-4xl my-8 rounded-md shadow-lg overflow-hidden`}>
          {/* Header section */}
          <div className={`${headerColor} w-full cursor-pointer p-4`} onClick={toggleExpansion}>
            <div className="text-left font-semibold">HTTP Headers (click to {isExpanded ? 'hide' : 'view'})</div>
          </div>

          {/* Expandable header content */}
          <div ref={contentRef} className="transition-max-height duration-500 ease-in-out overflow-hidden">
            <div className="text-left bg-white p-4 divide-y divide-gray-200">
              {Object.entries(headers).map(([key, value], index) => (
                  <div key={index} className="py-2 flex flex-wrap">
                    <span className="font-bold text-gray-700 w-full md:w-1/3 pr-4 break-words">{key}:</span>
                    <span className="text-gray-600 w-full md:w-2/3 break-words">{value}</span>
                  </div>
              ))}
            </div>
          </div>

          {/* Response section */}
          <div className={`${responseColor} w-full p-4 text-left`}>
            <div><span className="font-bold">Message:</span> {response.message}</div>
            <div><span className="font-bold">Username:</span> {response.username}</div>
            <div><span className="font-bold">Valid Until:</span> {new Date(response.validUntil).toLocaleString()}</div>
            <div><span className="font-bold">AID:</span> {response.aid}</div>
          </div>
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
