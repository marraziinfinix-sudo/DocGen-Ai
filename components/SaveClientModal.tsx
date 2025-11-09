
import React from 'react';
import { Details } from '../types';

interface SaveClientModalProps {
  isOpen: boolean;
  newClient: Details;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
}

const SaveClientModal: React.FC<SaveClientModalProps> = ({
  isOpen,
  newClient,
  onConfirm,
  onDecline,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Save New Client?</h2>
          <p className="text-gray-600 mb-4">
            This client is not in your saved list. Would you like to add them for future use?
          </p>
          <div className="bg-slate-50 border rounded-md p-3 space-y-1">
              <p className="font-semibold text-slate-800">{newClient.name}</p>
              <p className="text-sm text-slate-600">{newClient.address}</p>
              <p className="text-sm text-slate-600">{newClient.email}</p>
              <p className="text-sm text-slate-600">{newClient.phone}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 flex flex-col sm:flex-row justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="w-full sm:w-auto bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm border hover:bg-slate-100"
          >
            No, Just Save Document
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700"
          >
            Yes, Save Client
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveClientModal;
