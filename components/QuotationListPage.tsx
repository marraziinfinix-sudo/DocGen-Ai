import React from 'react';
import { SavedDocument } from '../types';

interface QuotationListPageProps {
  documents: SavedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  formatCurrency: (amount: number) => string;
  handleCreateInvoiceFromQuote: (quotation: SavedDocument) => void;
}

const QuotationListPage: React.FC<QuotationListPageProps> = ({ documents, setDocuments, formatCurrency, handleCreateInvoiceFromQuote }) => {

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };
  
  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Saved Quotations</h2>
        
        <div className="space-y-4">
          {/* Header for large screens */}
          <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1.5fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg">
              <span className="font-semibold text-slate-600 uppercase text-sm">Quote #</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Client</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Date</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Total</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Actions</span>
          </div>

          {documents.length > 0 ? documents.map(doc => (
            <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm border lg:border-b lg:shadow-none lg:rounded-none lg:grid lg:grid-cols-[1fr,2fr,1fr,1fr,1.5fr] gap-4 items-center">
              
              <div className="lg:contents">
                <div className="font-medium text-slate-800">
                  <span className="lg:hidden text-xs font-semibold text-slate-500 uppercase">Quote # </span>
                  {doc.documentNumber}
                </div>
                <div className="text-slate-700 truncate mt-1 lg:mt-0">
                  <span className="lg:hidden text-xs font-semibold text-slate-500 uppercase">Client: </span>
                  {doc.clientDetails.name}
                </div>
                <div className="text-slate-500 text-sm mt-1 lg:mt-0">
                  <span className="lg:hidden text-xs font-semibold uppercase">Date: </span>
                  {new Date(doc.issueDate + 'T00:00:00').toLocaleDateString()}
                </div>
                <div className="font-medium text-slate-800 text-right mt-1 lg:mt-0">
                  <span className="lg:hidden text-xs font-semibold text-slate-500 uppercase">Total: </span>
                  {formatCurrency(doc.total)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t lg:border-0 lg:mt-0 lg:pt-0">
                <button 
                  onClick={() => handleCreateInvoiceFromQuote(doc)}
                  className="font-semibold text-green-600 py-1 px-3 rounded-lg hover:bg-green-50 text-xs whitespace-nowrap"
                  title="Convert to Invoice"
                >
                  Create Invoice
                </button>
                <button onClick={() => handleDeleteDocument(doc.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 text-xs">
                  Delete
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center text-slate-500 py-10">You haven't saved any quotations yet.</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default QuotationListPage;