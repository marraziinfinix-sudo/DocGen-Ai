import React from 'react';
import { DocumentType, LineItem, Details } from '../types';

interface DocumentPreviewProps {
  documentType: DocumentType;
  companyDetails: Details;
  clientDetails: Details;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  companyLogo: string | null;
  bankQRCode: string | null;
  formatCurrency: (amount: number) => string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentType,
  companyDetails,
  clientDetails,
  documentNumber,
  issueDate,
  dueDate,
  lineItems,
  notes,
  subtotal,
  taxAmount,
  taxRate,
  total,
  companyLogo,
  bankQRCode,
  formatCurrency,
}) => {

  return (
    <div id="print-area" className="bg-white rounded-lg shadow-lg p-6 sm:p-8 md:p-12 text-sm text-slate-700 border">
      <header className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-slate-200 gap-4 sm:gap-2">
        <div className="flex items-start gap-4">
          {companyLogo && <img src={companyLogo} alt="Company Logo" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{companyDetails.name}</h1>
            <p className="text-slate-500">{companyDetails.address}</p>
            <p className="text-slate-500">{companyDetails.email}</p>
            <p className="text-slate-500">{companyDetails.phone}</p>
            {companyDetails.website && <p className="text-slate-500">{companyDetails.website}</p>}
            {companyDetails.taxId && <p className="text-slate-500">Tax ID: {companyDetails.taxId}</p>}
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase text-indigo-600">{documentType}</h2>
          <p className="text-slate-500"># {documentNumber}</p>
        </div>
      </header>
      
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8">
        <div>
          <h3 className="font-semibold text-slate-500 uppercase tracking-wider mb-2">Billed To</h3>
          <p className="font-bold text-slate-800">{clientDetails.name}</p>
          <p className="text-slate-600">{clientDetails.address}</p>
          <p className="text-slate-600">{clientDetails.email}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="mb-2">
            <p className="font-semibold text-slate-500">Date Issued</p>
            <p className="font-medium text-slate-800">{new Date(issueDate + 'T00:00:00').toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-500">
              {documentType === DocumentType.Invoice ? 'Due Date' : 'Valid Until'}
            </p>
            <p className="font-medium text-slate-800">{new Date(dueDate + 'T00:00:00').toLocaleDateString()}</p>
          </div>
        </div>
      </section>
      
      <section className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 font-semibold text-slate-600 uppercase w-1/2">Item</th>
              <th className="p-3 font-semibold text-slate-600 uppercase text-center">Qty</th>
              <th className="p-3 font-semibold text-slate-600 uppercase text-right">Price</th>
              <th className="p-3 font-semibold text-slate-600 uppercase text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map(item => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="p-3 text-slate-800">{item.description}</td>
                <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                <td className="p-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <section className="flex justify-end mt-8">
        <div className="w-full md:w-1/2 lg:w-2/5 space-y-2">
          <div className="flex justify-between">
            <p className="text-slate-500">Subtotal</p>
            <p className="font-medium text-slate-800">{formatCurrency(subtotal)}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-slate-500">Tax ({taxRate}%)</p>
            <p className="font-medium text-slate-800">{formatCurrency(taxAmount)}</p>
          </div>
          <div className="border-t-2 border-slate-200 mt-2 pt-2 flex justify-between">
            <p className="font-bold text-lg text-slate-800">Total</p>
            <p className="font-bold text-lg text-indigo-600">{formatCurrency(total)}</p>
          </div>
        </div>
      </section>
      
      <footer className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold text-slate-600 mb-2">Notes</h4>
          <p className="text-slate-500 whitespace-pre-wrap">{notes}</p>
        </div>
        <div>
          {(companyDetails.bankName || companyDetails.accountNumber || bankQRCode) && (
            <div>
              <h4 className="font-semibold text-slate-600 mb-2">Payment Details</h4>
              <div className="flex items-start justify-between">
                <div>
                  {companyDetails.bankName && <p className="text-slate-500">Bank: <span className="font-medium text-slate-700">{companyDetails.bankName}</span></p>}
                  {companyDetails.accountNumber && <p className="text-slate-500">Account Number: <span className="font-medium text-slate-700">{companyDetails.accountNumber}</span></p>}
                </div>
                {bankQRCode && (
                  <img src={bankQRCode} alt="Payment QR Code" className="w-24 h-24 object-contain" />
                )}
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default DocumentPreview;