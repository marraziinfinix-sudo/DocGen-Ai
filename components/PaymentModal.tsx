import React, { useState } from 'react';
import { SavedDocument, Payment } from '../types';

interface PaymentModalProps {
  invoice: SavedDocument;
  onSave: (payment: Omit<Payment, 'id'>) => void;
  onCancel: () => void;
  formatCurrency: (amount: number) => string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onSave, onCancel, formatCurrency }) => {
  const amountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = invoice.total - amountPaid;

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
      </div>
    </div>
  );
};

export default PaymentModal;
