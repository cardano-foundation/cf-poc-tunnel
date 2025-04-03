import { PDFDocument, PDFName } from "pdf-lib";
import { Diger } from "signify-ts";

const hashFile = async (arrayBuffer: ArrayBuffer) => {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(digest));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return btoa(hashHex);
};

function addressSlice(address: string, sliceLength = 10) {
  if (address.length <= sliceLength * 2) {
    return address;
  }
  if (address) {
    return `${address.slice(0, sliceLength)}...${address.slice(-sliceLength)}`;
  }
  return address;
}

const blake3Hash = (bytes: Uint8Array) => {
  const diger = new Diger({}, bytes);
  return diger.qb64; // return CESR hash
}

const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64.split(",")[1]); // Remove header:  'data:image/png;base64,'
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};



async function calculatePdfHash(
  pdfBytes: Uint8Array
): Promise<string> {
  try {

    const tempPdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
    });

    const tempInfo = tempPdfDoc.context.lookup(tempPdfDoc.context.trailerInfo.Info);

    const sigsKey = tempInfo.get(PDFName.of("Signatures"));
    let bytesToHash: Uint8Array;
    if (sigsKey !== undefined) {
      const clonedInfo = tempInfo.clone(tempPdfDoc.context);

      const key = PDFName.of("Signatures");
      clonedInfo.delete(key);

      const metadataStreamRef = tempPdfDoc.context.register(clonedInfo);
      tempPdfDoc.catalog.set(PDFName.of("Metadata"), metadataStreamRef);

      bytesToHash = await tempPdfDoc.save();
    } else {
      bytesToHash = pdfBytes;
    }

    const hash = await blake3Hash(bytesToHash);
    return hash;
  } catch (error) {
    console.error("Error calculating PDF hash:", error);
    throw error;
  }
}

export { hashFile, addressSlice, blake3Hash, base64ToUint8Array, calculatePdfHash };
