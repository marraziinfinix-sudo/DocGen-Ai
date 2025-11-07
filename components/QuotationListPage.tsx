import React from 'react';
import { SavedDocument, QuotationStatus } from '../types';

interface QuotationListPageProps {
  documents: SavedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  formatCurrency: (amount: number) => string;
  handleCreateInvoiceFromQuote: (quotation: SavedDocument) => void;
  handleLoadDocument: (doc: SavedDocument) => void;
}

const QuotationListPage: React.FC<QuotationListPageProps> = ({ documents, setDocuments, formatCurrency, handleCreateInvoiceFromQuote, handleLoadDocument }) => {

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const getQuotationDisplayStatus = (doc: SavedDocument) => {
    if (doc.quotationStatus === QuotationStatus.Agreed) {
      return { text: 'Agreed', color: 'bg-green-100 text-green-700' };
    }
    // Check if the due date is in the past. The time is set to the end of the day for comparison.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(doc.dueDate + 'T00:00:00');
    
    if (dueDate < today) {
      return { text: 'Expired', color: 'bg-red-100 text-red-700' };
    }
    return { text: 'Active', color: 'bg-blue-100 text-blue-700' };
  };
  
  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Saved Quotations</h2>
        
        <div className="space-y-4">
          {/* Header for large screens */}
          <div className="hidden lg:grid grid-cols-[auto,1fr,2fr,1fr,1fr,1fr,2fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg">
              <span className="font-semibold text-slate-600 uppercase text-sm">Status</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Quote #</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Client</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Valid Until</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Total</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Actions</span>
          </div>

          {documents.length > 0 ? documents.map(doc => {
            const statusInfo = getQuotationDisplayStatus(doc);
            const isActionable = statusInfo.text === 'Active';

            return (
              <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm border lg:p-0 lg:shadow-none lg:rounded-none lg:border-b">
                {/* Mobile Card View */}
                <div className="lg:hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-slate-800">{doc.clientDetails.name}</p>
                            <p className="text-sm text-slate-500">Quote #{doc.documentNumber}</p>
                        </div>
                        <span className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${statusInfo.color}`}>{statusInfo.text}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                        <p>Total: <span className="font-bold text-indigo-600">{formatCurrency(doc.total)}</span></p>
                        <p>Valid Until: <span className="font-medium">{new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</span></p>
                    </div>
                    <div className="mt-4 pt-3 border-t flex justify-end items-center gap-2">
                        <button 
                            onClick={() => handleCreateInvoiceFromQuote(doc)}
                            disabled={!isActionable}
                            className="font-semibold text-green-600 py-1 px-3 rounded-lg hover:bg-green-50 text-sm whitespace-nowrap disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed"
                            title={!isActionable ? (statusInfo.text === 'Agreed' ? 'Already converted to invoice' : 'Quotation has expired') : "Convert to Invoice"}
                        >
                            Create Invoice
                        </button>
                        <button onClick={() => handleLoadDocument(doc)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50 text-sm">View</button>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-sm">
                            Delete
                        </button>
                    </div>
                </div>

                {/* Desktop Row View */}
                <div className="hidden lg:grid grid-cols-[auto,1fr,2fr,1fr,1fr,auto] gap-4 items-center p-4">
                    <span className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${statusInfo.color}`}>{statusInfo.text}</span>
                    <span className="font-medium text-slate-800">{doc.documentNumber}</span>
                    <span className="text-slate-700 truncate">{doc.clientDetails.name}</span>
                    <span className="text-slate-500 text-sm">{new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</span>
                    <span className="font-medium text-slate-800 text-right">{formatCurrency(doc.total)}</span>
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleCreateInvoiceFromQuote(doc)}
                            disabled={!isActionable}
                            className="font-semibold text-green-600 py-1 px-3 rounded-lg hover:bg-green-50 text-xs whitespace-nowrap disabled:text-slate-400 disabled:bg-transparent disabled:cursor-not-allowed"
                            title={!isActionable ? (statusInfo.text === 'Agreed' ? 'Already converted to invoice' : 'Quotation has expired') : "Convert to Invoice"}
                        >
                            Create Invoice
                        </button>
                        <button onClick={() => handleLoadDocument(doc)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50 text-xs">View</button>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">
                            Delete
                        </button>
                    </div>
                </div>
              </div>
            )
          }) : (
            <div className="text-center text-slate-500 py-10">You haven't saved any quotations yet.</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default QuotationListPage;