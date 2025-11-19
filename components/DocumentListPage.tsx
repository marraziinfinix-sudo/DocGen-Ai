
import React, { useState, useEffect, useMemo } from 'react';
import { SavedDocument, InvoiceStatus, Payment } from '../types';
import { MailIcon, WhatsAppIcon, CashIcon, ViewIcon, TrashIcon, MoreVerticalIcon, RepeatIcon } from './Icons';
import PaymentModal from './PaymentModal';
import { saveInvoices } from '../services/firebaseService';

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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const getDisplayStatusText = (doc: SavedDocument): string => {
    if (!!doc.recurrence && !doc.recurrenceParentId) return 'Recurring';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(doc.dueDate + 'T00:00:00');
    
    const isOverdue = doc.status !== InvoiceStatus.Paid && dueDate < today;
    if (isOverdue) return 'Overdue';

    switch (doc.status) {
        case InvoiceStatus.Paid: return 'Paid';
        case InvoiceStatus.PartiallyPaid: return 'Partially Paid';
        default: return 'Pending';
    }
  };
  
  const dropdownClients = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    const uniqueClientNames = Array.from(new Set(documents.map(doc => doc.clientDetails.name))).sort();

    if (!clientSearchInput) {
        return uniqueClientNames;
    }
    return uniqueClientNames.filter(name => name.toLowerCase().includes(clientSearchInput.toLowerCase()));
  }, [documents, clientSearchInput]);

  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    return documents.filter(doc => {
        const status = getDisplayStatusText(doc);
        const matchesStatus = statusFilter === 'All' || status === statusFilter;
        const matchesClient = clientFilter === 'All' || doc.clientDetails.name === clientFilter;
        return matchesStatus && matchesClient;
    });
  }, [documents, statusFilter, clientFilter]);
  
  const summary = useMemo(() => {
    const initialSummary = {
        Paid: { total: 0, count: 0 },
        PartiallyPaid: { total: 0, balanceDue: 0, count: 0 },
        Pending: { total: 0, count: 0 },
        Overdue: { total: 0, count: 0 },
    };

    if (!Array.isArray(documents)) return initialSummary;

    return documents.reduce((acc, doc) => {
        const status = getDisplayStatusText(doc);
        const amountPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        let balanceDue = doc.total - amountPaid;
        if(doc.status === InvoiceStatus.Paid || balanceDue < 0.01) {
            balanceDue = 0;
        }

        switch (status) {
            case 'Paid':
                acc.Paid.total += doc.total;
                acc.Paid.count++;
                break;
            case 'Partially Paid':
                acc.PartiallyPaid.total += doc.total;
                acc.PartiallyPaid.balanceDue += balanceDue;
                acc.PartiallyPaid.count++;
                break;
            case 'Pending':
                acc.Pending.total += balanceDue;
                acc.Pending.count++;
                break;
            case 'Overdue':
                acc.Overdue.total += balanceDue;
                acc.Overdue.count++;
                break;
        }
        return acc;
    }, initialSummary);
  }, [documents]);


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


  const handleRecordPaymentClick = (doc: SavedDocument) => {
    setSelectedInvoice(doc);
    setPaymentModalOpen(true);
  };

  const handleSavePayment = (paymentData: Omit<Payment, 'id'>) => {
    if (!selectedInvoice) return;

    setDocuments(prevDocs => {
      const newDocs = prevDocs.map(doc => {
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
      });
      saveInvoices(newDocs);
      return newDocs;
    });
    setPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      setDocuments(prev => {
        const newDocs = prev.filter(doc => doc.id !== id);
        saveInvoices(newDocs);
        return newDocs;
      });
    }
  };

  const handleStopRecurrence = (id: number) => {
    if (window.confirm('Are you sure you want to stop this invoice from recurring? This will not delete any existing invoices in the series.')) {
        setDocuments(prev => {
            const newDocs = prev.map(doc => doc.id === id ? { ...doc, recurrence: null } : doc);
            saveInvoices(newDocs);
            return newDocs;
        });
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
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected invoice(s)? This action cannot be undone.`)) {
      setDocuments(prev => {
        const newDocs = prev.filter(d => !selectedIds.has(d.id));
        saveInvoices(newDocs);
        return newDocs;
      });
      setSelectedIds(new Set());
    }
  };

  const getDisplayStatus = (doc: SavedDocument) => {
    const statusText = getDisplayStatusText(doc);
    switch (statusText) {
        case 'Paid': return { text: 'Paid', color: 'bg-green-100 text-green-700' };
        case 'Partially Paid': return { text: 'Partially Paid', color: 'bg-blue-100 text-blue-700' };
        case 'Pending': return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
        case 'Overdue': return { text: 'Overdue', color: 'bg-red-100 text-red-700' };
        case 'Recurring': return { text: 'Recurring', color: 'bg-purple-100 text-purple-700' };
        default: return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
    }
  };
  
  const isAllSelected = filteredDocuments.length > 0 && selectedIds.size === filteredDocuments.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredDocuments.length;


  const renderActionsDropdown = (doc: SavedDocument) => (
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
                <button onClick={() => { handleRecordPaymentClick(doc); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <CashIcon /> Record Payment
                </button>
                <button onClick={() => { handleLoadDocument(doc); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <ViewIcon /> View/Edit Invoice
                </button>
                 {doc.status !== InvoiceStatus.Paid && (
                    <>
                        <div className="border-t my-1"></div>
                        <button onClick={() => { handleSendReminder(doc, 'email'); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <MailIcon /> Send Email Reminder
                        </button>
                        <button onClick={() => { handleSendReminder(doc, 'whatsapp'); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <WhatsAppIcon /> Send WhatsApp Reminder
                        </button>
                    </>
                 )}
                <div className="border-t my-1"></div>
                {!!doc.recurrence && !doc.recurrenceParentId && (
                    <button onClick={() => { handleStopRecurrence(doc.id); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50">
                        <RepeatIcon /> Stop Recurrence
                    </button>
                )}
                <button onClick={() => { handleDeleteDocument(doc.id); setOpenDropdownId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <TrashIcon /> Delete Invoice
                </button>
            </div>
        </div>
      )}
    </div>
  );
  
  const filterOptions = ['All', 'Paid', 'Partially Paid', 'Pending', 'Overdue', 'Recurring'];

  return (
    <>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Saved Invoices</h2>
            {selectedIds.size > 0 && (
                <button onClick={handleDeleteSelected} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 flex items-center gap-2 transition-all duration-200">
                    <TrashIcon />
                    Delete ({selectedIds.size})
                </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800">Total Paid</h3>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.Paid.total)}</p>
                <p className="text-xs text-green-600">{summary.Paid.count} invoice(s)</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800">Partially Paid</h3>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.PartiallyPaid.balanceDue)}</p>
                <p className="text-xs text-blue-600">{summary.PartiallyPaid.count} invoice(s)</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-800">Pending</h3>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(summary.Pending.total)}</p>
                <p className="text-xs text-yellow-600">{summary.Pending.count} invoice(s)</p>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800">Overdue</h3>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(summary.Overdue.total)}</p>
                <p className="text-xs text-red-600">{summary.Overdue.count} invoice(s)</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-grow">
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
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg flex-wrap">
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
            <div className="relative flex-shrink-0">
              <label htmlFor="client-filter-search" className="block text-sm font-medium text-slate-600 mb-1 sm:hidden">Filter by client:</label>
              <input
                  id="client-filter-search"
                  type="text"
                  value={clientSearchInput}
                  onChange={(e) => {
                      setClientSearchInput(e.target.value);
                      if (e.target.value === '') {
                          setClientFilter('All');
                      }
                  }}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 200)}
                  placeholder="Filter by client..."
                  autoComplete="off"
                  className="w-full sm:w-56 p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  aria-label="Filter by client"
              />
              {isClientDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <button
                          onClick={() => {
                              setClientFilter('All');
                              setClientSearchInput('');
                              setIsClientDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                          All Clients
                      </button>
                      {dropdownClients.map(name => (
                          <button
                              key={name}
                              onClick={() => {
                                  setClientFilter(name);
                                  setClientSearchInput(name);
                                  setIsClientDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          >
                              {name}
                          </button>
                      ))}
                      {(dropdownClients.length === 0 && clientSearchInput) && (
                          <div className="px-4 py-2 text-sm text-slate-500">No clients match search.</div>
                      )}
                  </div>
              )}
            </div>
          </div>


          <div className="space-y-4">
            {/* Header for large screens */}
            <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_3fr_2fr_1fr_1fr_2fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-lg items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  onChange={handleSelectAll}
                  checked={isAllSelected}
                  ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                />
                <span className="font-semibold text-slate-600 uppercase text-sm text-center">Status</span>
                <span className="font-semibold text-slate-600 uppercase text-sm">Invoice #</span>
                <span className="font-semibold text-slate-600 uppercase text-sm">Client</span>
                <span className="font-semibold text-slate-600 uppercase text-sm">Due Date</span>
                <span className="font-semibold text-slate-600 uppercase text-sm text-right">Balance</span>
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
                        aria-label="Select all invoices"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-600">Select All</label>
                </div>
            )}

            {documents.length > 0 ? (
                filteredDocuments.length > 0 ? (
                  filteredDocuments.map(doc => {
                    const amountPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                    let balanceDue = doc.total - amountPaid;
                    if (doc.status === InvoiceStatus.Paid || balanceDue < 0) {
                      balanceDue = 0;
                    }
                    const displayStatus = getDisplayStatus(doc);
                    const isRecurringParent = !!doc.recurrence && !doc.recurrenceParentId;
                    const isRecurringChild = !!doc.recurrenceParentId;

                    return (
                      <div key={doc.id} className={`p-4 rounded-lg border lg:p-0 lg:shadow-none lg:rounded-none lg:border-b ${selectedIds.has(doc.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3">
                            <div className="flex items-start">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1.5"
                                  checked={selectedIds.has(doc.id)}
                                  onChange={() => handleSelect(doc.id)}
                                />
                                <div className="ml-4">
                                    <span className={`inline-block text-xs font-bold py-1 px-3 rounded-full capitalize mb-1 ${displayStatus.color}`}>{displayStatus.text}</span>
                                    <p className="font-bold text-slate-800 text-lg">{doc.clientDetails.name}</p>
                                    <p className="text-sm text-slate-500">Invoice #{doc.documentNumber}</p>
                                </div>
                            </div>

                          <div className="flex justify-between items-baseline bg-slate-50 p-3 rounded-lg ml-8">
                              <div>
                                  <p className="text-xs text-slate-500">Balance Due</p>
                                  <p className="font-bold text-2xl text-red-600">{formatCurrency(balanceDue)}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs text-slate-500">Total</p>
                                  <p className="font-medium text-slate-700">{formatCurrency(doc.total)}</p>
                              </div>
                          </div>

                          <p className="text-sm text-slate-600 ml-8">Due: <span className="font-medium">{new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</span></p>

                          <div className="pt-3 border-t flex flex-wrap justify-end items-center gap-2 ml-8">
                            {renderActionsDropdown(doc)}
                          </div>
                        </div>


                        {/* Desktop Row View */}
                        <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_3fr_2fr_1fr_1fr_2fr] gap-4 items-center p-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={selectedIds.has(doc.id)}
                              onChange={() => handleSelect(doc.id)}
                            />
                            <div className="text-center flex items-center justify-center gap-2">
                                <span className={`text-xs font-bold py-1 px-3 rounded-full capitalize ${displayStatus.color}`}>{displayStatus.text}</span>
                                {(isRecurringParent || isRecurringChild) && (
                                    <span title={isRecurringParent ? "Recurring Template" : "Part of a recurring series"} className="text-slate-400">
                                        <RepeatIcon />
                                    </span>
                                )}
                            </div>
                            <span className="font-medium text-slate-800 truncate" title={doc.documentNumber}>{doc.documentNumber}</span>
                            <span className="text-slate-700 truncate">{doc.clientDetails.name}</span>
                            <span className="text-slate-500 text-sm">{new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}</span>
                            <span className="font-medium text-red-600 text-right">{formatCurrency(balanceDue)}</span>
                            <span className="font-medium text-slate-800 text-right">{formatCurrency(doc.total)}</span>
                            <div className="flex items-center justify-end">
                              {renderActionsDropdown(doc)}
                            </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                   <div className="text-center text-slate-500 py-10">No invoices match the current filter.</div>
                )
            ) : (
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
