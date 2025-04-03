import { Check, Download, Signature, Plus, Minus } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";

export default function PDFViewer({
  selectedPdfUrl,
  addVisualSignature,
  verify,
  download,
}: {
  selectedPdfUrl: string;
  addVisualSignature: () => void;
  verify: () => void;
  download: () => void;
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [scaleFactor, setScaleFactor] = useState(1.2); // Factor de escala inicial
  const mainViewRef = useRef<HTMLDivElement>(null);

  const baseWidth = 600;
  const scaledWidth = baseWidth * scaleFactor;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const scrollToPage = (pageNumber: number) => {
    const pageElement = document.querySelector(`[data-page="${pageNumber}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!mainViewRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = Number(entry.target.getAttribute("data-page"));
            setCurrentVisiblePage(pageNumber);
          }
        });
      },
      {
        root: mainViewRef.current,
        threshold: 0.5,
      }
    );

    document.querySelectorAll("[data-page]").forEach((page) => {
      observer.observe(page);
    });

    return () => observer.disconnect();
  }, [numPages]);

  const handleSignatureClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Signature button clicked");
    addVisualSignature();
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  // Funciones para aumentar/disminuir el tamaño
  const increaseScale = () => setScaleFactor((prev) => Math.min(prev + 0.1, 2.0)); // Máximo 2x
  const decreaseScale = () => setScaleFactor((prev) => Math.max(prev - 0.1, 0.5)); // Mínimo 0.5x

  return (
    <div className="flex h-screen">
      <div
        ref={mainViewRef}
        className="flex-grow flex justify-center items-start overflow-auto"
      >
        <Document file={selectedPdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              data-page={index + 1}
              className="mb-4 shadow-lg"
              style={{
                width: `${scaledWidth}px`,
                backgroundColor: "white",
                padding: "8px",
                borderRadius: "4px",
              }}
            >
              <Page pageNumber={index + 1} width={scaledWidth} />
            </div>
          ))}
        </Document>
      </div>
      <div className="w-32 border-l p-2 bg-gray-100 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-16"> {/* Margen inferior para evitar solapamiento */}
          <Document file={selectedPdfUrl}>
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`thumb_${index + 1}`}
                className="cursor-pointer relative mb-2 shadow-sm hover:ring-2 hover:ring-blue-400"
                onClick={() => scrollToPage(index + 1)}
                style={{
                  backgroundColor: "white",
                  padding: "2px",
                  borderRadius: "2px",
                  width: "110px",
                }}
              >
                <Page pageNumber={index + 1} width={110} />
                {currentVisiblePage === index + 1 && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500" />
                )}
              </div>
            ))}
          </Document>
        </div>
      </div>

      <div
        className="fixed bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg z-50 flex gap-1"
        onClick={handleContainerClick}
      >
        <button
          onClick={(e) => handleSignatureClick(e)}
          className="px-2 py-1 text-black bg-gray-200 rounded hover:bg-gray-300"
        >
          <Signature className="w-5 h-5" />
        </button>
        <button
          onClick={() => verify()}
          className="px-2 py-1 text-black bg-gray-200 rounded hover:bg-gray-300"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={() => download()}
          className="px-2 py-1 text-black bg-gray-200 rounded hover:bg-gray-300"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={increaseScale}
          className="ml-4 px-2 py-1 text-black bg-gray-200 rounded hover:bg-gray-300"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={decreaseScale}
          className="px-2 py-1 text-black bg-gray-200 rounded hover:bg-gray-300"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}