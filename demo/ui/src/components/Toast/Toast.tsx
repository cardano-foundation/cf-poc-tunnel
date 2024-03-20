import React from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  type: "success" | "danger" | "warning";
}

const Toast: React.FC<ToastProps> = ({ message, onClose, type }) => {
  const backgroundColors = {
    success: "bg-green-200 dark:bg-green-900",
    danger: "bg-red-200 dark:bg-red-900",
    warning: "bg-yellow-200 dark:bg-yellow-900",
  };

  const textColors = {
    success: "text-green-700 dark:text-green-300",
    danger: "text-red-700 dark:text-red-300",
    warning: "text-yellow-700 dark:text-yellow-300",
  };

  return (
    <div
      className={`flex items-center w-full max-w-lg p-4 mt-16 mb-4 text-gray-600 bg-white rounded-lg shadow dark:text-gray-300 dark:bg-gray-700 ${backgroundColors[type]}`}
      role="alert"
    >
      <div
        className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${textColors[type]} rounded-lg`}
      >
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {type === "success" ? (
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
          ) : type === "danger" ? (
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
          ) : (
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
          )}
        </svg>
      </div>
      <div className="ml-3 mr-2 text-sm font-normal">{message}</div>
      <button
        onClick={onClose}
        className="ml-2 p-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex h-8 w-8 items-center justify-center"
        aria-label="Close"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7L1 13"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
