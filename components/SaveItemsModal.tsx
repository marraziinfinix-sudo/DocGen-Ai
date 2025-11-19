
import React from 'react';
import { LineItem } from '../types';

interface SaveItemsModalProps {
  isOpen: boolean;
  newItems: LineItem[];
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
  formatCurrency: (amount: number) => string;
}

const SaveItemsModal: React.FC<SaveItemsModalProps> = ({
  isOpen,
  newItems,
  onConfirm,
  onDecline,
  onCancel,
  formatCurrency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Save New Items?</h2>
          <p className="text-gray-600 mb-4">
            You've added new items to this document. Would you like to save them to your item list for future use?
          </p>
          <div className="max-h-48 overflow-y-auto bg-slate-50 border rounded-md p-3 space-y-2">
            {newItems.map((item, index) => (
              <div key={index} className="text-sm p-2 bg-white rounded-md border">
                <p className="font-semibold text-slate-800">{item.description}</p>
                <p className="text-slate-500">Cost: {formatCurrency(item.costPrice)} &bull; Sell: {formatCurrency(item.price)}</p>
              </div>
            ))}
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
            Yes, Save to List
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveItemsModal;
