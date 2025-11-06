import React from 'react';
import { SavedDocument, InvoiceStatus } from '../types';
import { MailIcon, WhatsAppIcon } from './Icons';

interface DocumentListPageProps {
  documents: SavedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  formatCurrency: (amount: number) => string;
  handleSendReminder: (doc: SavedDocument, channel: 'email' | 'whatsapp') => void;
}

const DocumentListPage: React.FC<DocumentListPageProps> = ({ documents, setDocuments, formatCurrency, handleSendReminder }) => {

  const handleToggleStatus = (id: number) => {
    setDocuments(prev =>
      prev.map(doc => {
        if (doc.id === id && doc.status) {
          const isNowPaid = doc.status === InvoiceStatus.Pending;
          return {
            ...doc,
            status: isNowPaid ? InvoiceStatus.Paid : InvoiceStatus.Pending,
            paidDate: isNowPaid ? new Date().toISOString().split('T')[0] : null,
          };
        }
        return doc;
      })
    );
  };

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Saved Invoices</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase">
              <tr>
                <th className="p-3 font-semibold">Invoice #</th>
                <th className="p-3 font-semibold">Client</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold text-right">Total</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? documents.map(doc => (
                <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{doc.documentNumber}</td>
                  <td className="p-3 text-slate-700">{doc.clientDetails.name}</td>
                  <td className="p-3 text-slate-500">{new Date(doc.issueDate + 'T00:00:00').toLocaleDateString()}</td>
                  <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(doc.total)}</td>
                  <td className="p-3 text-center">
                    {doc.status && (
                      <div>
                        <button
                          onClick={() => handleToggleStatus(doc.id)}
                          className={`
                            text-xs font-bold py-1 px-3 rounded-full capitalize
                            ${doc.status === InvoiceStatus.Paid
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }
                          `}
                        >
                          {doc.status}
                        </button>
                        {doc.status === InvoiceStatus.Paid && doc.paidDate && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(doc.paidDate + 'T00:00:00').toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc.status === InvoiceStatus.Pending && (
                        <>
                          <button
                            onClick={() => handleSendReminder(doc, 'email')}
                            title="Send Email Reminder"
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
                          >
                            <MailIcon />
                          </button>
                          <button
                            onClick={() => handleSendReminder(doc, 'whatsapp')}
                            title="Send WhatsApp Reminder"
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
                          >
                            <WhatsAppIcon />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-10">
                    You haven't saved any invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default DocumentListPage;