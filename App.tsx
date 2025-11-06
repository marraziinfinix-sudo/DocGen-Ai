
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DocumentType, LineItem, Details, Client, Item, SavedDocument, InvoiceStatus, Company } from './types';
import { generateDescription } from './services/geminiService';
import { SparklesIcon, PlusIcon, TrashIcon, PrinterIcon, CogIcon, UsersIcon, ListIcon, DocumentIcon, MailIcon, WhatsAppIcon, FileTextIcon } from './components/Icons';
import DocumentPreview from './components/DocumentPreview';
import SetupPage from './components/SetupPage';
import ClientListPage from './components/ClientListPage';
import ItemListPage from './components/ItemListPage';
import DocumentListPage from './components/DocumentListPage';
import QuotationListPage from './components/QuotationListPage';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'editor' | 'setup' | 'clients' | 'items' | 'invoices' | 'quotations'>('editor');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.Quotation);
  
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem('companies');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load companies from localStorage', e);
    }
    return [{
      id: 1,
      details: { name: '', address: '', email: '', phone: '', bankName: '', accountNumber: '', website: '', taxId: '' },
      logo: null,
      bankQRCode: null,
      defaultNotes: '',
      taxRate: 0,
      currency: '',
    }];
  });
  const [activeCompanyId, setActiveCompanyId] = useState<number>(companies[0].id);

  const activeCompany = useMemo(() => companies.find(c => c.id === activeCompanyId) || companies[0], [companies, activeCompanyId]);

  // States for the current document form
  const [companyDetails, setCompanyDetails] = useState<Details>(activeCompany.details);
  const [companyLogo, setCompanyLogo] = useState<string | null>(activeCompany.logo);
  const [bankQRCode, setBankQRCode] = useState<string | null>(activeCompany.bankQRCode);
  const [notes, setNotes] = useState(activeCompany.defaultNotes);
  const [taxRate, setTaxRate] = useState(activeCompany.taxRate);
  const [currency, setCurrency] = useState(activeCompany.currency);

  useEffect(() => {
    if (activeCompany) {
      setCompanyDetails(activeCompany.details);
      setCompanyLogo(activeCompany.logo);
      setBankQRCode(activeCompany.bankQRCode);
      setNotes(activeCompany.defaultNotes);
      setTaxRate(activeCompany.taxRate);
      setCurrency(activeCompany.currency);
    }
  }, [activeCompany]);


  const [clientDetails, setClientDetails] = useState<Details>({ name: '', address: '', email: '', phone: '' });
  
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('clients');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load clients from localStorage', e);
      return [];
    }
  });

   const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem('items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
      return [];
    }
  });

  const [documentNumber, setDocumentNumber] = useState('001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [dueDateOption, setDueDateOption] = useState<string>('30days');
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  const [generatingStates, setGeneratingStates] = useState<Record<number, boolean>>({});

  const [savedInvoices, setSavedInvoices] = useState<SavedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('savedInvoices');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load savedInvoices from localStorage', e);
      return [];
    }
  });

  const [savedQuotations, setSavedQuotations] = useState<SavedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('savedQuotations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load savedQuotations from localStorage', e);
      return [];
    }
  });

  const [selectedSavedItemId, setSelectedSavedItemId] = useState<string>('');

  // --- LocalStorage Persistence ---
  useEffect(() => {
    try {
      localStorage.setItem('companies', JSON.stringify(companies));
    } catch (e) {
      console.error('Failed to save companies to localStorage', e);
    }
  }, [companies]);

  useEffect(() => {
    try {
      localStorage.setItem('clients', JSON.stringify(clients));
    } catch (e) {
      console.error('Failed to save clients to localStorage', e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem('items', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices));
    } catch (e) {
      console.error('Failed to save invoices to localStorage', e);
    }
  }, [savedInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem('savedQuotations', JSON.stringify(savedQuotations));
    } catch (e) {
      console.error('Failed to save quotations to localStorage', e);
    }
  }, [savedQuotations]);
  // --- End LocalStorage Persistence ---


  // --- Due Date Calculation Effect ---
  useEffect(() => {
    if (dueDateOption === 'custom' || !issueDate) return;

    const newDueDate = new Date(issueDate + 'T00:00:00'); // Use UTC midnight to avoid timezone issues
    
    switch (dueDateOption) {
        case 'sameday':
            // Due date is the same as issue date, so no change to newDueDate
            break;
        case '15days':
            newDueDate.setDate(newDueDate.getDate() + 15);
            break;
        case '30days':
            newDueDate.setDate(newDueDate.getDate() + 30);
            break;
        case '45days':
            newDueDate.setDate(newDueDate.getDate() + 45);
            break;
        case '60days':
            newDueDate.setDate(newDueDate.getDate() + 60);
            break;
        default:
            return; // Don't change if it's an unknown option
    }

    setDueDate(newDueDate.toISOString().split('T')[0]);
  }, [issueDate, dueDateOption]);
  
  const handleManualDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
    setDueDateOption('custom');
  };
  // --- End Due Date Calculation ---

  const handleLineItemChange = useCallback((id: number, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setLineItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems(prevItems => [
      ...prevItems,
      { id: Date.now(), description: '', quantity: 1, price: 0 },
    ]);
  }, []);

  const addLineItemFromSaved = useCallback((item: Item) => {
    setLineItems(prevItems => [
        ...prevItems,
        { id: Date.now(), description: item.description, quantity: 1, price: item.price },
    ]);
  }, []);

  const handleAddSelectedSavedItem = () => {
    if (!selectedSavedItemId) return;
    const selectedItem = items.find(item => item.id === parseInt(selectedSavedItemId, 10));
    if (selectedItem) {
        addLineItemFromSaved(selectedItem);
        setSelectedSavedItemId(''); // Reset dropdown
    }
  };


  const removeLineItem = useCallback((id: number) => {
    setLineItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const handleGenerateDescription = async (id: number) => {
    const item = lineItems.find(item => item.id === id);
    if (!item || !item.description) return;

    setGeneratingStates(prev => ({ ...prev, [id]: true }));
    try {
      const newDescription = await generateDescription(item.description);
      handleLineItemChange(id, 'description', newDescription);
    } catch (error) {
      console.error("Failed to generate description", error);
    } finally {
      setGeneratingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDetailChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(prev => ({ ...prev, [field]: e.target.value }));
  };

  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [lineItems, taxRate]);

  const formatCurrency = (amount: number) => {
    return `${currency}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  };

  const handleSaveDocument = () => {
    // Check if client is new and ask to save
    if (clientDetails.name && clientDetails.name.trim() !== '') {
      const isExistingClient = clients.some(c => 
        c.name.trim().toLowerCase() === clientDetails.name.trim().toLowerCase() && 
        c.email.trim().toLowerCase() === clientDetails.email.trim().toLowerCase()
      );

      if (!isExistingClient) {
        if (window.confirm(`'${clientDetails.name}' is not in your client list. Would you like to save this client for future use?`)) {
          const newClient: Client = {
            id: Date.now(),
            name: clientDetails.name,
            address: clientDetails.address,
            email: clientDetails.email,
            phone: clientDetails.phone,
          };
          setClients(prev => [...prev, newClient]);
        }
      }
    }

    const newDocument: SavedDocument = {
      id: Date.now(),
      documentNumber,
      documentType,
      clientDetails,
      issueDate,
      dueDate,
      lineItems,
      total,
      status: documentType === DocumentType.Invoice ? InvoiceStatus.Pending : null,
    };
    if (documentType === DocumentType.Invoice) {
      setSavedInvoices(prev => [newDocument, ...prev]);
      alert('Invoice saved successfully!');
    } else {
      setSavedQuotations(prev => [newDocument, ...prev]);
      alert('Quotation saved successfully!');
    }
  };
  
  const handleSelectClient = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === parseInt(clientId, 10));
    if (selectedClient) {
        setClientDetails(selectedClient);
    } else {
        setClientDetails({ name: '', address: '', email: '', phone: '' });
    }
  };

   const handleSendReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    const message = `Dear ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding invoice #${doc.documentNumber} for ${formatCurrency(doc.total)}, which was due on ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\n\nPlease let us know if you have any questions.\n\nBest regards,\n${companyDetails.name}`;
    
    if (channel === 'email') {
      const subject = `Payment Reminder: Invoice #${doc.documentNumber}`;
      window.location.href = `mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };
  
  const handleCreateInvoiceFromQuote = (quotation: SavedDocument) => {
    // Switch to Invoice type
    setDocumentType(DocumentType.Invoice);

    // Populate form fields from the quotation
    setClientDetails(quotation.clientDetails);
    // Give line items new IDs to avoid key conflicts if the user manipulates them
    setLineItems(quotation.lineItems.map(item => ({ ...item, id: Date.now() + Math.random() }))); 
    
    // Set new invoice-specific details
    setDocumentNumber(String(savedInvoices.length + 1).padStart(3, '0'));
    setIssueDate(new Date().toISOString().split('T')[0]);
    
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 30);
    setDueDate(newDueDate.toISOString().split('T')[0]);
    setDueDateOption('30days');

    // Use default notes from the active company profile
    if (activeCompany) {
      setNotes(activeCompany.defaultNotes);
    }

    // Switch view to the editor
    setCurrentView('editor');
  };

  const handleShareEmail = () => {
      const subject = `${documentType} #${documentNumber} from ${companyDetails.name}`;
      const body = `Hi ${clientDetails.name},\n\nPlease find attached our ${documentType.toLowerCase()} #${documentNumber} for a total of ${formatCurrency(total)}.\n\n${documentType === DocumentType.Invoice ? `The due date is ${new Date(dueDate + 'T00:00:00').toLocaleDateString()}.` : ''}\n\nThank you,\n${companyDetails.name}`;
      window.location.href = `mailto:${clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareWhatsApp = () => {
    const message = `Hi ${clientDetails.name}, here is our ${documentType.toLowerCase()} #${documentNumber} for a total of ${formatCurrency(total)}. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const renderEditor = () => (
    <>
      <div className="lg:col-span-3 space-y-6 no-print">
        {/* Document Type Toggle */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setDocumentType(DocumentType.Quotation)} className={`w-full py-2 rounded-md font-semibold transition-colors ${documentType === DocumentType.Quotation ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
              Quotation
            </button>
            <button onClick={() => setDocumentType(DocumentType.Invoice)} className={`w-full py-2 rounded-md font-semibold transition-colors ${documentType === DocumentType.Invoice ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
              Invoice
            </button>
          </div>
        </div>
        
        {/* Company & Client Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Active Company Profile</label>
                  <select onChange={(e) => setActiveCompanyId(Number(e.target.value))} value={activeCompanyId} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    {companies.map(c => <option key={c.id} value={c.id}>{c.details.name}</option>)}
                  </select>
              </div>
              {renderDetailsForm("From (Editable for this document)", companyDetails, handleDetailChange(setCompanyDetails))}
          </div>
          <div>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Select a client</label>
                <select onChange={(e) => handleSelectClient(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">-- New Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            {renderDetailsForm("To", clientDetails, handleDetailChange(setClientDetails))}
          </div>
        </div>

        {/* Document Info */}
        <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{documentType} #</label>
              <input type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date Issued</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-600">
                {documentType === DocumentType.Invoice ? 'Due Date' : 'Valid Until'}
              </label>
              <select 
                value={dueDateOption} 
                onChange={(e) => setDueDateOption(e.target.value)}
                className="text-xs p-1 bg-white text-slate-600 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="custom">Custom</option>
                <option value="sameday">On The Same Day</option>
                <option value="15days">15 Days</option>
                <option value="30days">30 Days</option>
                <option value="45days">45 Days</option>
                <option value="60days">60 Days</option>
              </select>
            </div>
            <input 
              type="date" 
              value={dueDate} 
              onChange={handleManualDueDateChange} 
              className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
        </div>
        
        {/* Line Items */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Items</h3>
           <div className="space-y-4">
            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-[minmax(0,_1fr)_90px_110px_110px_50px] gap-x-4 text-sm font-semibold text-slate-500 border-b pb-2">
              <span>Description</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Total</span>
              <span></span>
            </div>

            {lineItems.map((item) => (
              <div key={item.id} className="p-3 rounded-lg md:p-0 border md:border-0 md:border-b md:rounded-none border-slate-200 md:grid grid-cols-[minmax(0,_1fr)_90px_110px_110px_50px] gap-x-4 items-start md:py-3 space-y-2 md:space-y-0">
                {/* Description */}
                <div className="relative">
                  <label className="text-xs font-medium text-slate-500 md:hidden">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                    rows={2}
                    placeholder="Item description"
                    className="w-full p-2 pr-10 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                  <button onClick={() => handleGenerateDescription(item.id)} disabled={generatingStates[item.id]} className="absolute top-2 right-2 p-1 text-indigo-500 hover:bg-indigo-100 rounded-full disabled:text-slate-400 disabled:cursor-wait">
                    <SparklesIcon isLoading={generatingStates[item.id]} />
                  </button>
                </div>
                
                {/* Mobile container for Qty/Price */}
                <div className="grid grid-cols-2 gap-4 md:contents">
                    <div>
                        <label className="text-xs font-medium text-slate-500 md:hidden">Qty</label>
                        <input type="number" min="0" value={item.quantity} onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full text-center p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 md:hidden">Price</label>
                        <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => handleLineItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} className="w-full text-right p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                </div>

                {/* Total */}
                <div className="text-right self-center">
                    <span className="font-medium text-slate-500 md:hidden">Total: </span>
                    <span className="font-semibold text-slate-800">{formatCurrency(item.quantity * item.price)}</span>
                </div>

                {/* Remove Button */}
                <div className="flex justify-end items-center self-center">
                  <button onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon/></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addLineItem} className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-50 transition-colors">
            <PlusIcon/> Add Item
          </button>
           <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label htmlFor="saved-item-select" className="block text-sm font-medium text-slate-600 mb-2">Add from Saved Items</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  id="saved-item-select"
                  value={selectedSavedItemId}
                  onChange={e => setSelectedSavedItemId(e.target.value)}
                  className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="" disabled>-- Select an item --</option>
                  {items.map(item => <option key={item.id} value={item.id}>{item.description} ({formatCurrency(item.price)})</option>)}
                </select>
                <button 
                  onClick={handleAddSelectedSavedItem} 
                  disabled={!selectedSavedItemId}
                  className="bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Add Item
                </button>
              </div>
            </div>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Notes / Terms</h3>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <label className="text-slate-600">Tax (%)</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 p-1 bg-white text-slate-900 border border-slate-300 rounded-md text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tax</span>
              <span className="font-semibold">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between items-center">
              <span className="text-xl font-bold text-slate-800">Total</span>
              <span className="text-xl font-bold text-indigo-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="lg:sticky top-24">
          <DocumentPreview 
            documentType={documentType}
            companyDetails={companyDetails}
            clientDetails={clientDetails}
            documentNumber={documentNumber}
            issueDate={issueDate}
            dueDate={dueDate}
            lineItems={lineItems}
            notes={notes}
            subtotal={subtotal}
            taxAmount={taxAmount}
            taxRate={taxRate}
            total={total}
            companyLogo={companyLogo}
            bankQRCode={bankQRCode}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </>
  );

  const renderDetailsForm = (title: string, details: Details, handler: (field: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) => void) => (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="space-y-2">
        <input type="text" placeholder="Name" value={details.name} onChange={handler('name')} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
        <input type="text" placeholder="Address" value={details.address} onChange={handler('address')} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
        <input type="email" placeholder="Email" value={details.email} onChange={handler('email')} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
        <input type="tel" placeholder="Phone" value={details.phone} onChange={handler('phone')} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>
    </div>
  );
  
  const headerActions = () => {
    if (currentView === 'editor') {
        return (
            <div className="flex items-center gap-2">
                <button onClick={handleShareEmail} title="Share via Email" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                    <MailIcon />
                </button>
                <button onClick={handleShareWhatsApp} title="Share via WhatsApp" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                    <WhatsAppIcon />
                </button>
                 <button onClick={handleSaveDocument} className="flex items-center gap-2 bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                    <span>Save</span>
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
                    <PrinterIcon />
                    <span className="hidden sm:inline">Print / PDF</span>
                </button>
            </div>
        );
    }
    return <button onClick={() => setCurrentView('editor')} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">Back to Editor</button>;
  };


  return (
    <div className="min-h-screen font-sans text-slate-800">
      <header className="bg-white shadow-md sticky top-0 z-20 no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
            {/* Title on the far left */}
            <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">DocGen AI</h1>
            </div>
            
            {/* Nav in the middle, will wrap to a new line on mobile */}
            <nav className="w-full md:w-auto order-3 md:order-2 flex-grow">
                <div className="flex items-center justify-center gap-1 sm:gap-2 pt-4 border-t md:pt-0 md:border-0">
                   <button onClick={() => setCurrentView('setup')} title="Setup" className={`flex items-center gap-2 py-2 px-3 rounded-lg ${currentView === 'setup' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}><CogIcon/> <span className="hidden md:inline">Setup</span></button>
                   <button onClick={() => setCurrentView('clients')} title="Clients" className={`flex items-center gap-2 py-2 px-3 rounded-lg ${currentView === 'clients' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}><UsersIcon/> <span className="hidden md:inline">Clients</span></button>
                   <button onClick={() => setCurrentView('items')} title="Items" className={`flex items-center gap-2 py-2 px-3 rounded-lg ${currentView === 'items' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}><ListIcon/> <span className="hidden md:inline">Items</span></button>
                   <button onClick={() => setCurrentView('quotations')} title="Quotations" className={`flex items-center gap-2 py-2 px-3 rounded-lg ${currentView === 'quotations' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}><FileTextIcon/> <span className="hidden md:inline">Quotes</span></button>
                   <button onClick={() => setCurrentView('invoices')} title="Invoices" className={`flex items-center gap-2 py-2 px-3 rounded-lg ${currentView === 'invoices' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}><DocumentIcon/> <span className="hidden md:inline">Invoices</span></button>
                </div>
            </nav>
            
            {/* Actions on the far right */}
            <div className="flex-shrink-0 order-2 md:order-3">
                {headerActions()}
            </div>
        </div>
      </header>
      
      <main className={`container mx-auto p-4 sm:p-6 lg:p-8 ${currentView === 'editor' ? 'grid grid-cols-1 lg:grid-cols-5 gap-8' : ''}`}>
        {currentView === 'editor' && renderEditor()}
        {currentView === 'setup' && <SetupPage companies={companies} setCompanies={setCompanies} onDone={() => setCurrentView('editor')} />}
        {currentView === 'clients' && <ClientListPage clients={clients} setClients={setClients} onDone={() => setCurrentView('editor')} />}
        {currentView === 'items' && <ItemListPage items={items} setItems={setItems} formatCurrency={formatCurrency} onDone={() => setCurrentView('editor')} />}
        {currentView === 'invoices' && <DocumentListPage documents={savedInvoices} setDocuments={setSavedInvoices} formatCurrency={formatCurrency} handleSendReminder={handleSendReminder} />}
        {currentView === 'quotations' && <QuotationListPage documents={savedQuotations} setDocuments={setSavedQuotations} formatCurrency={formatCurrency} handleCreateInvoiceFromQuote={handleCreateInvoiceFromQuote} />}
      </main>
    </div>
  );
};

export default App;
