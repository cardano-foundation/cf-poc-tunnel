import { Check, Download, Signature } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";

export default function PDFViewer({
  selectedPdfUrl,
}: {
  selectedPdfUrl: string;
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const mainViewRef = useRef<HTMLDivElement>(null);

  // Ancho base para simular un A4
  const baseWidth = 595;
  const scaledWidth = baseWidth * scale;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Función para manejar el scroll a una página específica
  const scrollToPage = (pageNumber: number) => {
    const pageElement = document.querySelector(`[data-page="${pageNumber}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Observer para detectar la página visible actual
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
      },
    );

    // Observar todas las páginas
    document.querySelectorAll("[data-page]").forEach((page) => {
      observer.observe(page);
    });

    return () => observer.disconnect();
  }, [numPages]);

  return (
    <div className="flex h-screen">
      {/* Vista principal del PDF */}
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
        <div className="flex-1 overflow-y-auto">
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
                  width: 0.8,
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

      {/* Controles de zoom */}
      <div className="fixed bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg">
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
          className="px-2 py-1 text-black bg-gray-200 rounded-l hover:bg-gray-300"
        >
          <Signature className="w-5 h-5" />
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
          className="px-2 mx-1 py-1 text-black bg-gray-200 rounded-l hover:bg-gray-300"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
          className="px-2 py-1 text-black bg-gray-200 rounded-l hover:bg-gray-300"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
