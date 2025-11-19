
import React from 'react';
import { SavedDocument } from '../types';
import { MailIcon, WhatsAppIcon, TelegramIcon } from './Icons';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  invoice: SavedDocument | null;
  onClose: () => void;
  onSendEmail: () => void;
  onSendWhatsApp: () => void;
  onSendTelegram: () => void;
  formatCurrency: (amount: number) => string;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  invoice,
  onClose,
  onSendEmail,
  onSendWhatsApp,
  onSendTelegram,
  formatCurrency,
}) => {
  if (!isOpen || !invoice) return null;

  const amountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = Math.max(0, invoice.total - amountPaid);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Recorded!</h2>
          <p className="text-gray-600 mb-6">
            Payment for Invoice <span className="font-semibold">#{invoice.documentNumber}</span> has been saved.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm space-y-2 border">
            <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-indigo-600">{invoice.status === 'Paid' ? 'Fully Paid' : invoice.status}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-medium">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(amountPaid)}</span>
            </div>
             <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-slate-700 font-bold">Balance Due:</span>
                <span className="font-bold text-red-600">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">Send a receipt/update to the client?</p>

          <div className="space-y-3">
            <button
                onClick={() => { onSendEmail(); onClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
            >
                <MailIcon /> Send via Email
            </button>
            <button
                onClick={() => { onSendWhatsApp(); onClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-md transition-colors"
            >
                <WhatsAppIcon /> Send via WhatsApp
            </button>
            <button
                onClick={() => { onSendTelegram(); onClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-base font-medium rounded-lg text-white bg-sky-500 hover:bg-sky-600 shadow-md transition-colors"
            >
                <TelegramIcon /> Send via Telegram
            </button>
            <button
                onClick={onClose}
                className="w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors mt-2"
            >
                Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;