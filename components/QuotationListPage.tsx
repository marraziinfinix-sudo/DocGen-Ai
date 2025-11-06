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
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Saved Quotations</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase">
              <tr>
                <th className="p-3 font-semibold">Quotation #</th>
                <th className="p-3 font-semibold">Client</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold text-right">Total</th>
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
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-10">
                    You haven't saved any quotations yet.
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

export default QuotationListPage;