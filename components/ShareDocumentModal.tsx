
import React from 'react';
import { DocumentType } from '../types';
import { MailIcon, WhatsAppIcon } from './Icons';

interface ShareDocumentModalProps {
  isOpen: boolean;
  documentType: DocumentType;
  documentNumber: string;
  onShareEmail: () => void;
  onShareWhatsApp: () => void;
  onClose: () => void;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  documentType,
  documentNumber,
  onShareEmail,
  onShareWhatsApp,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Saved Successfully!</h2>
          <p className="text-gray-600 mb-8">
            {documentType} <span className="font-semibold">#{documentNumber}</span> has been saved. Do you want to share it now?
          </p>
          
          <div className="space-y-3">
            <button
                onClick={() => { onShareEmail(); onClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
            >
                <MailIcon /> Share via Email
            </button>
            <button
                onClick={() => { onShareWhatsApp(); onClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-md transition-colors"
            >
                <WhatsAppIcon /> Share via WhatsApp
            </button>
            <button
                onClick={onClose}
                className="w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors mt-2"
            >
                No, thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentModal;
