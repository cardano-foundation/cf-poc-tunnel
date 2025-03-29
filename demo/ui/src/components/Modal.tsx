import React from "react";
interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  width?: string;
  height?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  children,
  width = "100%",
  height = "100vh",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="relative z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
        aria-hidden="true"
      ></div>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="relative transform overflow-hidden bg-white text-left shadow-xl transition-all"
            style={{ width, height }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
