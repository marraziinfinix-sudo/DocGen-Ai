
import React, { useState } from 'react';
import { SavedDocument, Payment } from '../types';
import { MailIcon, WhatsAppIcon, TelegramIcon } from './Icons';

interface PaymentModalProps {
  invoice: SavedDocument;
  onSave: (payment: Omit<Payment, 'id'>) => void;
  onCancel: () => void;
  formatCurrency: (amount: number) => string;
  onSendEmail?: () => void;
  onSendWhatsApp?: () => void;
  onSendTelegram?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onSave, onCancel, formatCurrency, onSendEmail, onSendWhatsApp, onSendTelegram }) => {
  const amountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = invoice.total - amountPaid;
  const isFullyPaid = balanceDue <= 0.01;

  const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : '0.00');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (paymentAmount > balanceDue + 0.001) { // Add tolerance for float precision
        if (!window.confirm(`The payment amount (${formatCurrency(paymentAmount)}) is greater than the balance due (${formatCurrency(balanceDue)}). This may result in an overpayment. Do you want to proceed?`)) {
            return;
        }
    }

    onSave({
      amount: paymentAmount,
      date,
      method,
      notes,
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
        {isFullyPaid ? (
            <div className="p-6">
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice #{invoice.documentNumber} is Fully Paid</h2>
                    <p className="text-gray-600 text-sm mt-2">No balance due. You can view payment history or resend the receipt below.</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6 border">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-600 text-sm">Total Invoice Amount:</span>
                        <span className="font-bold text-slate-800">{formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Total Paid:</span>
                        <span className="font-bold text-green-600">{formatCurrency(amountPaid)}</span>
                    </div>
                </div>

                {invoice.payments && invoice.payments.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Payment History</h3>
                        <div className="max-h-32 overflow-y-auto border rounded-md">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invoice.payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{new Date(p.date).toLocaleDateString()}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{p.method}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-right">{formatCurrency(p.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onSendEmail}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <MailIcon /> Resend Receipt via Email
                    </button>
                    <button 
                        onClick={onSendWhatsApp}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <WhatsAppIcon /> Resend Receipt via WhatsApp
                    </button>
                    <button 
                        onClick={onSendTelegram}
                        className="w-full flex items-center justify-center gap-2 bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors"
                    >
                        <TelegramIcon /> Resend Receipt via Telegram
                    </button>
                     <button 
                        onClick={onCancel} 
                        className="w-full bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 mt-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        ) : (
            <>
                <form onSubmit={handleSubmit}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Record Payment for Invoice #{invoice.documentNumber}</h2>
                    <div className="mb-4 text-sm">
                        <p>Client: <span className="font-semibold">{invoice.clientDetails.name}</span></p>
                        <p>Total: <span className="font-semibold">{formatCurrency(invoice.total)}</span></p>
                        <p>Balance Due: <span className="font-semibold text-red-600">{formatCurrency(balanceDue)}</span></p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Amount *</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Payment Date *</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    </div>
                    <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                    <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                        <option>Bank Transfer</option>
                        <option>Credit Card</option>
                        <option>Cash</option>
                        <option>Check</option>
                        <option>Other</option>
                    </select>
                    </div>
                    <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Notes (optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"></textarea>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t">
                    <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700">Save Payment</button>
                </div>
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;