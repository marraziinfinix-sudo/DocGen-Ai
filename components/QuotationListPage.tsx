import React, { useState, useEffect, useMemo } from 'react';
import { SavedDocument, QuotationStatus } from '../types';
import { DocumentIcon, ViewIcon, TrashIcon, MoreVerticalIcon, MailIcon, WhatsAppIcon } from './Icons';

interface QuotationListPageProps {
  documents: SavedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<SavedDocument[]>>;
  formatCurrency: (amount: number) => string;
  handleCreateInvoiceFromQuote: (quotation: SavedDocument) => void;
  handleLoadDocument: (doc: SavedDocument) => void;
  handleSendQuotationReminder: (doc: SavedDocument, channel: 'email' | 'whatsapp') => void;
}

const QuotationListPage: React.FC<QuotationListPageProps> = ({ documents, setDocuments, formatCurrency, handleCreateInvoiceFromQuote, handleLoadDocument, handleSendQuotationReminder }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const getQuotationDisplayStatusText = (doc: SavedDocument): QuotationStatus => {
    if (doc.quotationStatus === QuotationStatus.Agreed) {
      return QuotationStatus.Agreed;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(doc.dueDate + 'T00:00:00');
    
    if (dueDate < today) {
      return QuotationStatus.Expired;
    }
    return QuotationStatus.Active;
  };

  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    if (statusFilter === 'All') {
        return documents;
    }
    return documents.filter(doc => getQuotationDisplayStatusText(doc) === statusFilter);
  }, [documents, statusFilter]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

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
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
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
    const statusText = getQuotationDisplayStatusText(doc);
    switch (statusText) {
      case QuotationStatus.Agreed: return { text: 'Agreed', color: 'bg-green-100 text-green-700' };
      case QuotationStatus.Expired: return { text: 'Expired', color: 'bg-red-100 text-red-700' };
      default: return { text: 'Active', color: 'bg-blue-100 text-blue-700' };
    }
  };
  
  const isAllSelected = filteredDocuments.length > 0 && selectedIds.size === filteredDocuments.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredDocuments.length;

  const renderActionsDropdown = (doc: SavedDocument) => {
      const statusInfo = getQuotationDisplayStatus(doc);
      const isActionable = statusInfo.text === 'Active';
      return (
        <div className="relative">
            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                    setOpenDropdownId(openDropdownId === doc.id ? null : doc.id);
                }}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
                <MoreVerticalIcon />
            </button>
            {openDropdownId === doc.id && (
                <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                            onClick={() => { handleCreateInvoiceFromQuote(doc); setOpenDropdownId(null); }}
                            disabled={!isActionable}
                            title={!isActionable ? (statusInfo.text === 'Agreed' ? 'Already converted to invoice' : 'Quotation has expired') : "Convert to Invoice"}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-white"
                        >
                            <DocumentIcon /> Convert to Invoice
                        </button>
                        <button onClick={() => { handleLoadDocument(doc); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <ViewIcon /> View Quotation
                        </button>
                         {isActionable && (
                            <>
                                <div className="border-t my-1"></div>
                                <button onClick={() => { handleSendQuotationReminder(doc, 'email'); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                    <MailIcon /> Send Email Reminder
                                </button>
                                <button onClick={() => { handleSendQuotationReminder(doc, 'whatsapp'); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                    <WhatsAppIcon /> Send WhatsApp Reminder
                                </button>
                            </>
                         )}
                        <div className="border-t my-1"></div>
                        <button onClick={() => { handleDeleteDocument(doc.id); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <TrashIcon /> Delete Quotation
                        </button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  const filterOptions = ['All', 'Active', 'Agreed', 'Expired'];

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
        
        <div className="mb-4">
          {/* Mobile Filter: Dropdown */}
          <div className="sm:hidden">
            <label htmlFor="status-filter" className="block text-sm font-medium text-slate-600 mb-1">
              Filter by status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {filterOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Desktop Filter: Buttons */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Filter by status:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {filterOptions.map(option => (
                    <button
                        key={option}
                        onClick={() => setStatusFilter(option)}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                            statusFilter === option
                                ? 'bg-white text-indigo-700 shadow'
                                : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Header for large screens */}
          <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_4fr_2fr_1fr_2fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg items-center">
              <input 
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                onChange={handleSelectAll}
                checked={isAllSelected}
                ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
              />
              <span className="font-semibold text-slate-600 uppercase text-sm text-center">Status</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Quote #</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Client</span>
              <span className="font-semibold text-slate-600 uppercase text-sm">Valid Until</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Total</span>
              <span className="font-semibold text-slate-600 uppercase text-sm text-right">Actions</span>
          </div>
          
          {/* Header for small screens */}
            {documents.length > 0 && (
                <div className="lg:hidden flex items-center p-2 rounded-t-lg bg-slate-50 border-b">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        onChange={handleSelectAll}
                        checked={isAllSelected}
                        ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                        aria-label="Select all quotations"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-600">Select All</label>
                </div>
            )}

          {documents.length > 0 ? (
            filteredDocuments.length > 0 ? (
                filteredDocuments.map(doc => {
                    const statusInfo = getQuotationDisplayStatus(doc);

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
                                {renderActionsDropdown(doc)}
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
                            <div className="flex items-center justify-end">
                              {renderActionsDropdown(doc)}
                            </div>
                        </div>
                    </div>
                    )
                })
            ) : (
                <div className="text-center text-slate-500 py-10">No quotations match the current filter.</div>
            )
          ) : (
            <div className="text-center text-slate-500 py-10">You haven't saved any quotations yet.</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default QuotationListPage;