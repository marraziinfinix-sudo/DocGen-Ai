import React from 'react';
import { SavedDocument, InvoiceStatus } from '../types';
import { MailIcon, WhatsAppIcon } from './Icons';

interface DocumentListPageProps {
  documents: SavedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  formatCurrency: (amount: number) => string;
  handleSendReminder: (doc: SavedDocument, channel: 'email' | 'whatsapp') => void;
  handleLoadDocument: (doc: SavedDocument) => void;
}

const DocumentListPage: React.FC<DocumentListPageProps> = ({ documents, setDocuments, formatCurrency, handleSendReminder, handleLoadDocument }) => {

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
          <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1fr,2fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg">
              <span className="font-semibold text-slate-600 uppercase text-sm">Invoice #</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Client</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Date</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Total</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-center">Status</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Actions</span>
          </div>

          {documents.length > 0 ? documents.map(doc => (
            <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm border lg:p-0 lg:shadow-none lg:rounded-none lg:border-b">
              {/* Mobile Card View */}
              <div className="lg:hidden">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Invoice #</p>
                        <p className="font-medium text-slate-800">{doc.documentNumber}</p>
                    </div>
                    <p className="font-bold text-lg text-indigo-600">{formatCurrency(doc.total)}</p>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                    <p className="font-medium">{doc.clientDetails.name}</p>
                    <p>Issued: {new Date(doc.issueDate + 'T00:00:00').toLocaleDateString()}</p>
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <div>
                        {doc.status && (
                            <button
                                onClick={() => handleToggleStatus(doc.id)}
                                className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${doc.status === InvoiceStatus.Paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                            >
                                {doc.status}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                        {doc.status === InvoiceStatus.Pending && (
                            <>
                                <button onClick={() => handleSendReminder(doc, 'email')} title="Send Email Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><MailIcon /></button>
                                <button onClick={() => handleSendReminder(doc, 'whatsapp')} title="Send WhatsApp Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><WhatsAppIcon /></button>
                            </>
                        )}
                        <button onClick={() => handleLoadDocument(doc)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50 text-xs">View</button>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">Delete</button>
                    </div>
                </div>
              </div>

              {/* Desktop Row View */}
              <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1fr,2fr] gap-4 items-center p-4">
                  <span className="font-medium text-slate-800">{doc.documentNumber}</span>
                  <span className="text-slate-700 truncate">{doc.clientDetails.name}</span>
                  <span className="text-slate-500 text-sm">{new Date(doc.issueDate + 'T00:00:00').toLocaleDateString()}</span>
                  <span className="font-medium text-slate-800 text-right">{formatCurrency(doc.total)}</span>
                  <div className="flex flex-col items-center text-center">
                      {doc.status && (
                          <>
                              <button
                                  onClick={() => handleToggleStatus(doc.id)}
                                  className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${doc.status === InvoiceStatus.Paid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                              >
                                  {doc.status}
                              </button>
                              {doc.status === InvoiceStatus.Paid && doc.paidDate && (
                                  <p className="text-xs text-slate-500 mt-1">{new Date(doc.paidDate + 'T00:00:00').toLocaleDateString()}</p>
                              )}
                          </>
                      )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                      {doc.status === InvoiceStatus.Pending && (
                          <>
                              <button onClick={() => handleSendReminder(doc, 'email')} title="Send Email Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><MailIcon /></button>
                              <button onClick={() => handleSendReminder(doc, 'whatsapp')} title="Send WhatsApp Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><WhatsAppIcon /></button>
                          </>
                      )}
                      <button onClick={() => handleLoadDocument(doc)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50 text-xs">View</button>
                      <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">Delete</button>
                  </div>
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
