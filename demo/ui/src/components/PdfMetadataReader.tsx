import { useState } from "react";
import { PDFDocument, PDFName } from "pdf-lib";
import React from "react";
import { pdfjs, Document, Page } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

function PdfMetadataReader() {
  const [metadata, setMetadata] = useState<Record<string, string | null>>({});
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(
    null,
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      if (reader.result instanceof ArrayBuffer) {
        setPdfArrayBuffer(reader.result);
        await readPdfMetadata(reader.result);
      }
    };
    reader.onerror = () => console.error("Error al leer el archivo PDF");
  };

  const readPdfMetadata = async (pdfBytes: ArrayBuffer) => {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        updateMetadata: false,
      });

      const metadataInfo = {
        title: await pdfDoc.getTitle(),
        author: await pdfDoc.getAuthor(),
        creator: await pdfDoc.getCreator(),
        keywords: (await pdfDoc.getKeywords())?.join(", "),
        producer: await pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate()?.toISOString(),
        modificationDate: pdfDoc.getModificationDate()?.toISOString(),
      };


      setMetadata(metadataInfo);
    } catch (error) {
      console.error("Error leyendo la metadata del PDF:", error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">PDF Metadata Reader</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileUpload}
        className="mb-2"
      />

      {metadata && Object.keys(metadata).length > 0 && (
        <ul className="text-sm">
          {Object.entries(metadata).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {value || "N/A"}
            </li>
          ))}
        </ul>
      )}

      {pdfArrayBuffer && (
        <button
          onClick={() =>
            modifyAndSaveMetadata(pdfArrayBuffer, {
              title: "Nuevo título22",
              author: "Jaime",
              filename: "pdf_modificado.pdf",
            })
          }
          className="mt-2 text-white bg-green-500 hover:bg-green-700 font-medium py-2 px-4 rounded"
        >
          Añadir Metadata y Guardar PDF
        </button>
      )}
    </div>
  );
}

const modifyAndSaveMetadata = async (
  pdfArrayBuffer: ArrayBuffer,
  metadataOptions: { title: string; author: string; filename: string },
) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer, {
      ignoreEncryption: true,
    });

    const metadataXML = `
    <?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
    <x:xmpmeta xmlns:x="adobe:ns:meta/">
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
            <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
                <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${metadataOptions.title}</rdf:li></rdf:Alt></dc:title>
                <dc:creator><rdf:Seq><rdf:li>${metadataOptions.author}</rdf:li></rdf:Seq></dc:creator>
            </rdf:Description>
        </rdf:RDF>
    </x:xmpmeta>
    <?xpacket end="w"?>`.trim();

    const metadataStream = pdfDoc.context.stream(metadataXML, {
      Type: "Metadata",
      Subtype: "XML",
      Length: metadataXML.length,
    });

    const metadataStreamRef = pdfDoc.context.register(metadataStream);
    pdfDoc.catalog.set(PDFName.of("Metadata"), metadataStreamRef);

    // Guardar el PDF modificado
    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // Descargar el PDF
    const a = document.createElement("a");
    a.href = url;
    a.download = metadataOptions.filename || "modified.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  } catch (error) {
    console.error("Error al modificar y guardar metadata:", error);
  }
};

export { PdfMetadataReader, modifyAndSaveMetadata };
