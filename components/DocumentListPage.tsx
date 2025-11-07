import React, { useState } from 'react';
import { SavedDocument, InvoiceStatus, Payment } from '../types';
import { MailIcon, WhatsAppIcon, CashIcon } from './Icons';
import PaymentModal from './PaymentModal';

interface DocumentListPageProps {
  documents: SavedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  formatCurrency: (amount: number) => string;
  handleSendReminder: (doc: SavedDocument, channel: 'email' | 'whatsapp') => void;
  handleLoadDocument: (doc: SavedDocument) => void;
}

const DocumentListPage: React.FC<DocumentListPageProps> = ({ documents, setDocuments, formatCurrency, handleSendReminder, handleLoadDocument }) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SavedDocument | null>(null);

  const handleRecordPaymentClick = (doc: SavedDocument) => {
    setSelectedInvoice(doc);
    setPaymentModalOpen(true);
  };

  const handleSavePayment = (paymentData: Omit<Payment, 'id'>) => {
    if (!selectedInvoice) return;

    setDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === selectedInvoice.id) {
          const newPayment: Payment = { ...paymentData, id: Date.now() };
          const updatedPayments = [...(doc.payments || []), newPayment];
          const amountPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

          let newStatus = doc.status;
          let newPaidDate = doc.paidDate;

          if (amountPaid >= doc.total) {
            newStatus = InvoiceStatus.Paid;
            newPaidDate = newPayment.date;
          } else if (amountPaid > 0) {
            newStatus = InvoiceStatus.PartiallyPaid;
            newPaidDate = null;
          } else {
            newStatus = InvoiceStatus.Pending;
            newPaidDate = null;
          }

          return {
            ...doc,
            payments: updatedPayments,
            status: newStatus,
            paidDate: newPaidDate,
          };
        }
        return doc;
      })
    );
    setPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const getDisplayStatus = (doc: SavedDocument) => {
    const isOverdue = doc.status !== InvoiceStatus.Paid && new Date(doc.dueDate + 'T00:00:00') < new Date();
    if (isOverdue) return { text: 'Overdue', color: 'bg-red-100 text-red-700' };

    switch (doc.status) {
        case InvoiceStatus.Paid: return { text: 'Paid', color: 'bg-green-100 text-green-700' };
        case InvoiceStatus.PartiallyPaid: return { text: 'Partially Paid', color: 'bg-blue-100 text-blue-700' };
        default: return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
    }
  };


  return (
    <>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Saved Invoices</h2>
          
          <div className="space-y-4">
            {/* Header for large screens */}
            <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1fr,1fr,2fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg">
                <span className="font-semibold text-slate-600 uppercase text-sm">Invoice #</span>
                <span className="font-semibold text-slate-600 uppercase text-sm">Client</span>
                <span className="font-semibold text-slate-600 uppercase text-sm">Due Date</span>
                <span className="font-semibold text-slate-600 uppercase text-sm text-right">Balance Due</span>
                <span className="font-semibold text-slate-600 uppercase text-sm text-right">Total</span>
                <span className="font-semibold text-slate-600 uppercase text-sm text-center">Status</span>
                <span className="font-semibold text-slate-600 uppercase text-sm text-right">Actions</span>
            </div>

            {documents.length > 0 ? documents.map(doc => {
              const amountPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              const balanceDue = doc.total - amountPaid;
              const displayStatus = getDisplayStatus(doc);

              return (
                <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm border lg:p-0 lg:shadow-none lg:rounded-none lg:border-b">
                  {/* Mobile Card View */}
                  <div className="lg:hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Invoice #{doc.documentNumber}</p>
                            <p className="font-medium text-slate-800">{doc.clientDetails.name}</p>
                        </div>
                         <div className="text-right">
                          <p className="font-bold text-lg text-red-600">{formatCurrency(balanceDue)}</p>
                          <p className="text-xs text-slate-500">Balance Due</p>
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                        <p>Due: {new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t flex justify-between items-center">
                        <span className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${displayStatus.color}`}>{displayStatus.text}</span>
                        <div className="flex items-center justify-end gap-1">
                            {doc.status !== InvoiceStatus.Paid && (
                                <>
                                  <button onClick={() => handleSendReminder(doc, 'email')} title="Send Email Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><MailIcon /></button>
                                  <button onClick={() => handleSendReminder(doc, 'whatsapp')} title="Send WhatsApp Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><WhatsAppIcon /></button>
                                </>
                            )}
                            <button onClick={() => handleRecordPaymentClick(doc)} title="Record Payment" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><CashIcon/></button>
                            <button onClick={() => handleLoadDocument(doc)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50 text-xs">View</button>
                            <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">Delete</button>
                        </div>
                    </div>
                  </div>

                  {/* Desktop Row View */}
                  <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1fr,1fr,2fr] gap-4 items-center p-4">
                      <span className="font-medium text-slate-800">{doc.documentNumber}</span>
                      <span className="text-slate-700 truncate">{doc.clientDetails.name}</span>
                      <span className="text-slate-500 text-sm">{new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</span>
                      <span className="font-medium text-red-600 text-right">{formatCurrency(balanceDue)}</span>
                      <span className="font-medium text-slate-800 text-right">{formatCurrency(doc.total)}</span>
                      <div className="text-center">
                          <span className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${displayStatus.color}`}>{displayStatus.text}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                          {doc.status !== InvoiceStatus.Paid && (
                              <>
                                  <button onClick={() => handleSendReminder(doc, 'email')} title="Send Email Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><MailIcon /></button>
                                  <button onClick={() => handleSendReminder(doc, 'whatsapp')} title="Send WhatsApp Reminder" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><WhatsAppIcon /></button>
                              </>
                          )}
                          <button onClick={() => handleRecordPaymentClick(doc)} title="Record Payment" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><CashIcon/></button>
                          <button onClick={() => handleLoadDocument(doc)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50 text-xs">View</button>
                          <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">Delete</button>
                      </div>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center text-slate-500 py-10">You haven't saved any invoices yet.</div>
            )}
          </div>
        </div>
      </main>
      {paymentModalOpen && selectedInvoice && (
        <PaymentModal 
          invoice={selectedInvoice}
          onSave={handleSavePayment}
          onCancel={() => setPaymentModalOpen(false)}
          formatCurrency={formatCurrency}
        />
      )}
    </>
  );
};

export default DocumentListPage;