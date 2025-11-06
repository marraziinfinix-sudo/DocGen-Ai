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
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Saved Invoices</h2>
        
        <div className="space-y-4">
          {/* Header for large screens */}
          <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1fr,1.5fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg">
              <span className="font-semibold text-slate-600 uppercase text-sm">Invoice #</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Client</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Date</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Total</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-center">Status</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Actions</span>
          </div>

          {documents.length > 0 ? documents.map(doc => (
            <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm border lg:border-b lg:shadow-none lg:rounded-none lg:grid lg:grid-cols-[1fr,2fr,1fr,1fr,1fr,1.5fr] gap-4 items-center">
              
              {/* Mobile top section */}
              <div className="flex justify-between items-start lg:contents">
                <div className="lg:p-0">
                  <span className="lg:hidden text-xs font-semibold text-slate-500 uppercase">Invoice # </span>
                  <span className="font-medium text-slate-800">{doc.documentNumber}</span>
                </div>
                {/* Status (Mobile View) */}
                <div className="lg:hidden text-center">
                  {doc.status && (
                    <div>
                      <button
                        onClick={() => handleToggleStatus(doc.id)}
                        className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${doc.status === InvoiceStatus.Paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                      >
                        {doc.status}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-slate-700 truncate mt-1 lg:mt-0 lg:contents">
                <span className="lg:hidden text-xs font-semibold text-slate-500 uppercase">Client: </span>
                {doc.clientDetails.name}
              </div>
              
              <div className="text-slate-500 text-sm mt-1 lg:mt-0 lg:contents">
                  <span className="lg:hidden text-xs font-semibold uppercase">Date: </span>
                  {new Date(doc.issueDate + 'T00:00:00').toLocaleDateString()}
              </div>

              <div className="font-medium text-slate-800 text-right mt-1 lg:mt-0 lg:contents">
                <span className="lg:hidden text-xs font-semibold text-slate-500 uppercase">Total: </span>
                {formatCurrency(doc.total)}
              </div>
              
              {/* Status (Desktop View) */}
              <div className="hidden lg:flex flex-col items-center text-center mt-4 lg:mt-0">
                  {doc.status && (
                    <div>
                      <button
                        onClick={() => handleToggleStatus(doc.id)}
                        className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${doc.status === InvoiceStatus.Paid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                      >
                        {doc.status}
                      </button>
                      {doc.status === InvoiceStatus.Paid && doc.paidDate && (
                        <p className="text-xs text-slate-500 mt-1">{new Date(doc.paidDate + 'T00:00:00').toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t lg:border-0 lg:mt-0 lg:pt-0">
                {doc.status === InvoiceStatus.Pending && (
                  <>
                    <button onClick={() => handleSendReminder(doc, 'email')} title="Send Email Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><MailIcon /></button>
                    <button onClick={() => handleSendReminder(doc, 'whatsapp')} title="Send WhatsApp Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><WhatsAppIcon /></button>
                  </>
                )}
                <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">Delete</button>
              </div>
            </div>
          )) : (
            <div className="text-center text-slate-500 py-10">You haven't saved any invoices yet.</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default DocumentListPage;