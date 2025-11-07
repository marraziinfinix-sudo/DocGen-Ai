import React from 'react';
import { DocumentType, LineItem, Details, Payment, InvoiceStatus } from '../types';

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
  payments?: Payment[];
  status?: InvoiceStatus | null;
}

const StatusStamp: React.FC<{ status: InvoiceStatus | null }> = ({ status }) => {
  if (!status || status === InvoiceStatus.Pending) return null;

  let text = '';
  let colorClasses = '';

  switch (status) {
    case InvoiceStatus.Paid:
      text = 'PAID';
      colorClasses = 'border-green-500 text-green-500';
      break;
    case InvoiceStatus.PartiallyPaid:
      text = 'PARTIALLY PAID';
      colorClasses = 'border-blue-500 text-blue-500';
      break;
    default:
      return null;
  }

  return (
    <div className={`absolute top-1/4 right-8 sm:right-16 border-4 ${colorClasses} rounded-lg p-4 transform rotate-[-15deg] opacity-70`}>
      <h2 className="text-3xl sm:text-5xl font-bold tracking-widest">{text}</h2>
    </div>
  );
};


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
  payments,
  status,
}) => {

  const amountPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  let balanceDue = total - amountPaid;
  if (status === InvoiceStatus.Paid || balanceDue < 0) {
    balanceDue = 0;
  }


  return (
    <div id="print-area" className="relative bg-white rounded-lg shadow-lg p-6 sm:p-8 md:p-12 text-sm text-slate-700 border">
      {documentType === DocumentType.Invoice && <StatusStamp status={status} />}

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
          <h3 className="font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {documentType === DocumentType.Invoice ? 'Billed To' : 'Quote To'}
          </h3>
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
          {documentType === DocumentType.Invoice && payments && payments.length > 0 && (
            <>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <p className="text-slate-500">Amount Paid</p>
                <p className="font-medium text-slate-800">{formatCurrency(amountPaid)}</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-md flex justify-between">
                <p className="font-bold text-lg text-slate-800">Balance Due</p>
                <p className="font-bold text-lg text-indigo-600">{formatCurrency(balanceDue)}</p>
              </div>
            </>
          )}
        </div>
      </section>
      
      <footer className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold text-slate-600 mb-2">Notes</h4>
          <p className="text-slate-500 whitespace-pre-wrap">{notes}</p>
        </div>
        <div className="space-y-6">
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
          {documentType === DocumentType.Invoice && payments && payments.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-600 mb-2">Payment History</h4>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-1 font-medium text-slate-500">Date</th>
                    <th className="p-1 font-medium text-slate-500">Method</th>
                    <th className="p-1 font-medium text-slate-500 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="p-1 text-slate-600">{new Date(p.date + 'T00:00:00').toLocaleDateString()}</td>
                      <td className="p-1 text-slate-600">{p.method}</td>
                      <td className="p-1 text-slate-600 text-right">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default DocumentPreview;