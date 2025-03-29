import React, { useState } from "react";
import { X, Edit, Trash, Plus, Check } from "lucide-react";
import { addressSlice } from "../utils/utils";

interface Metadata {
  [key: string]: string | boolean;
}

interface Document {
  id: string;
  name: string;
  date: string;
  verified: boolean;
  size: string;
  type: string;
  pageCount: number;
  file: any;
  fileUrl: string;
  hash: string;
  metadata: Metadata;
}

interface DocumentModalProps {
  open: boolean;
  document: Document | null;
  addMetadataField: (key: string, value: string) => void;
  deleteMetadataField: (key: string) => void;
  onClose: () => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  open,
  document,
  addMetadataField,
  deleteMetadataField,
  onClose,
}) => {
  if (!open) return null;

  const [editedDocument, setEditedDocument] = useState<Document>({
    ...document,
  });

  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const handleEdit = (field: string) => {
    setEditMode({ ...editMode, [field]: true });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setEditedDocument({
      ...editedDocument,
      metadata: {
        ...editedDocument.metadata,
        [field]: value,
      },
    });
  };
  const handleSave = (field: string) => {
    const newValue = editedDocument.metadata[field]?.toString() || "";
    addMetadataField(field, newValue);
    setEditMode({ ...editMode, [field]: false });
  };

  const handleDeleteField = (field: string) => {
    deleteMetadataField(field);
    const updatedMetadata = { ...editedDocument.metadata };
    delete updatedMetadata[field];
    setEditedDocument({ ...editedDocument, metadata: updatedMetadata });
  };

  const handleAddField = () => {
    if (newFieldKey.length && newFieldValue.length) {
      addMetadataField(newFieldKey, newFieldValue);
      setEditedDocument({
        ...editedDocument,
        metadata: {
          ...editedDocument.metadata,
          [newFieldKey]: newFieldValue,
        },
      });
      setNewFieldKey("");
      setNewFieldValue("");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg p-6 w-full max-w-[700px] max-h-[90vh] overflow-auto relative shadow-lg transition-all duration-300 ease-in-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 bg-slate-500 text-gray-200 hover:text-gray-300 transition-colors duration-300 rounded-full p-1"
            onClick={onClose}
          >
            <X size={24} />
          </button>

          {/* Document Properties Section */}
          <div className="mb-6 border-b-2">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Metadata Properties</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="text-base text-gray-900">{document.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Size:</span>
                <span className="text-base text-gray-900">{document.size}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="text-base text-gray-900">{document.type}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Pages:</span>
                <span className="text-base text-gray-900">{document.pageCount}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 my-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">CESR Hash:</span>
                <span className="text-base text-gray-900 break-words text-sm">
                  {document.hash}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          {Object.keys(editedDocument.metadata || {}).length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Metadata ({Object.keys(editedDocument.metadata).length}):
              </h2>
              <div className="max-h-[300px] overflow-y-auto rounded-md space-y-2">
                {Object.keys(editedDocument.metadata).map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between border-b border-gray-200 py-2 last:border-b-0 gap-4"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <strong className="text-lg text-gray-700 min-w-[120px]">
                        {field.charAt(0).toUpperCase() + field.slice(1)}:
                      </strong>
                      {editMode[field] ? (
                        <input
                          type="text"
                          value={editedDocument.metadata[field]?.toString() || ""}
                          onChange={(e) => handleChange(field, e.target.value)}
                          className="bg-white text-black rounded px-3 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-md text-gray-700 truncate">
                          {typeof editedDocument.metadata[field] === "string" ||
                          typeof editedDocument.metadata[field] === "boolean"
                            ? addressSlice(editedDocument.metadata[field].toString(), 22)
                            : "Unsupported value"}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
                      {editMode[field] ? (
                        <button
                          className="p-1 rounded-full hover:bg-gray-100 text-green-500 hover:text-green-700 transition-colors"
                          onClick={() => handleSave(field)}
                        >
                          <Check size={20} />
                        </button>
                      ) : (
                        <button
                          className="p-1 rounded-full hover:bg-gray-100 text-blue-500 hover:text-blue-700 transition-colors"
                          onClick={() => handleEdit(field)}
                        >
                          <Edit size={20} />
                        </button>
                      )}
                      <button
                        className="p-1 rounded-full hover:bg-gray-100 text-red-500 hover:text-red-700 transition-colors"
                        onClick={() => handleDeleteField(field)}
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add New Field Section */}
          <div className="mt-6 flex items-center">
            <input
              type="text"
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value.replace(/\s/g, ""))}
              placeholder="New field..."
              className="bg-white text-black border border-gray-300 rounded-md px-3 py-2 mr-4 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newFieldValue}
              onChange={(e) => setNewFieldValue(e.target.value.replace(/\s/g, ""))}
              placeholder="Insert value.."
              className="bg-white text-black border border-gray-300 rounded-md px-3 py-2 mr-4 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
              onClick={handleAddField}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentModal;