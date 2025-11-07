import React, { useState } from 'react';
import { SavedDocument, QuotationStatus } from '../types';
import { DocumentIcon, ViewIcon, TrashIcon } from './Icons';

interface QuotationListPageProps {
  documents: SavedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  formatCurrency: (amount: number) => string;
  handleCreateInvoiceFromQuote: (quotation: SavedDocument) => void;
  handleLoadDocument: (doc: SavedDocument) => void;
}

const QuotationListPage: React.FC<QuotationListPageProps> = ({ documents, setDocuments, formatCurrency, handleCreateInvoiceFromQuote, handleLoadDocument }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(documents.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected quotation(s)? This action cannot be undone.`)) {
      setDocuments(prev => prev.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
    }
  };

  const getQuotationDisplayStatus = (doc: SavedDocument) => {
    if (doc.quotationStatus === QuotationStatus.Agreed) {
      return { text: 'Agreed', color: 'bg-green-100 text-green-700' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(doc.dueDate + 'T00:00:00');
    
    if (dueDate < today) {
      return { text: 'Expired', color: 'bg-red-100 text-red-700' };
    }
    return { text: 'Active', color: 'bg-blue-100 text-blue-700' };
  };
  
  const isAllSelected = documents.length > 0 && selectedIds.size === documents.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < documents.length;

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Saved Quotations</h2>
            {selectedIds.size > 0 && (
                <button onClick={handleDeleteSelected} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 flex items-center gap-2 transition-all duration-200">
                    <TrashIcon />
                    Delete ({selectedIds.size})
                </button>
            )}
        </div>
        
        <div className="space-y-4">
          {/* Header for large screens */}
          <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_4fr_2fr_1fr_2fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg items-center">
              <input 
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                onChange={handleSelectAll}
                checked={isAllSelected}
                ref={el => el && (el.indeterminate = isIndeterminate)}
              />
              <span className="font-semibold text-slate-600 uppercase text-sm text-center">Status</span>
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
              <div key={doc.id} className={`p-4 rounded-lg border lg:p-0 lg:shadow-none lg:rounded-none lg:border-b ${selectedIds.has(doc.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                {/* Mobile Card View */}
                <div className="lg:hidden">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1.5"
                            checked={selectedIds.has(doc.id)}
                            onChange={() => handleSelect(doc.id)}
                          />
                          <div className="ml-4">
                              <p className="font-bold text-slate-800">{doc.clientDetails.name}</p>
                              <p className="text-sm text-slate-500">Quote #{doc.documentNumber}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${statusInfo.color}`}>{statusInfo.text}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600 ml-8">
                        <p>Total: <span className="font-bold text-indigo-600">{formatCurrency(doc.total)}</span></p>
                        <p>Valid Until: <span className="font-medium">{new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</span></p>
                    </div>
                    <div className="mt-4 pt-3 border-t flex justify-end items-center gap-2 ml-8">
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
                <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_4fr_2fr_1fr_2fr] gap-4 items-center p-4">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => handleSelect(doc.id)}
                    />
                    <div className="text-center">
                        <span className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${statusInfo.color}`}>{statusInfo.text}</span>
                    </div>
                    <span className="font-medium text-slate-800 truncate">{doc.documentNumber}</span>
                    <span className="text-slate-700 truncate">{doc.clientDetails.name}</span>
                    <span className="text-slate-500 text-sm">{new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</span>
                    <span className="font-medium text-slate-800 text-right">{formatCurrency(doc.total)}</span>
                    <div className="col-span-2 flex items-center justify-end">
                        <button 
                            onClick={() => handleCreateInvoiceFromQuote(doc)}
                            disabled={!isActionable}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title={!isActionable ? (statusInfo.text === 'Agreed' ? 'Already converted to invoice' : 'Quotation has expired') : "Convert to Invoice"}
                        >
                            <DocumentIcon/>
                        </button>
                        <button onClick={() => handleLoadDocument(doc)} title="View Quotation" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                            <ViewIcon/>
                        </button>
                        <button onClick={() => handleDeleteDocument(doc.id)} title="Delete Quotation" className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                            <TrashIcon/>
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
