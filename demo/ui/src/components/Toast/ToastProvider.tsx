import React, { ReactNode, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import Toast from "./Toast";

import { eventBus } from "../../utils/EventBus";

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastList, setToastList] = useState<
    Array<{
      id: string;
      message: string;
      type: "success" | "danger" | "warning";
      duration: number;
    }>
  >([]);

  useEffect(() => {
    const handleShowToast = (data: {
      message: string;
      type: "success" | "danger" | "warning";
      duration: number;
    }) => {
      const id = uuidv4();
      const { message, type, duration } = data;
      setToastList((prevList) => [
        ...prevList,
        { id, message, type, duration },
      ]);

      setTimeout(() => {
        setToastList((prevList) => prevList.filter((toast) => toast.id !== id));
      }, duration);
    };

    eventBus.subscribe("toast", handleShowToast);

    return () => {
      eventBus.unsubscribe("toast", handleShowToast);
    };
  }, []);

  return (
    <>
      {children}
      <div
        className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-5 space-y-2"
        style={{ zIndex: 1050 }}
      >
        {toastList.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setToastList((prevList) =>
                prevList.filter((t) => t.id !== toast.id),
              )
            }
          />
        ))}
      </div>
    </>
  );
};
