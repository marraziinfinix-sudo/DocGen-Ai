
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DocumentType, LineItem, Details, Client, Item, SavedDocument, InvoiceStatus, Company, Payment, QuotationStatus } from './types';
import { generateDescription } from './services/geminiService';
import { SparklesIcon, PlusIcon, TrashIcon, CogIcon, UsersIcon, ListIcon, DocumentIcon, MailIcon, WhatsAppIcon, FileTextIcon, DownloadIcon, MoreVerticalIcon, PrinterIcon, ChevronDownIcon } from './components/Icons';
import DocumentPreview from './components/DocumentPreview';
import SetupPage from './components/SetupPage';
import ClientListPage from './components/ClientListPage';
import ItemListPage from './components/ItemListPage';
import DocumentListPage from './components/DocumentListPage';
import QuotationListPage from './components/QuotationListPage';

declare const jspdf: any;
declare const html2canvas: any;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'editor' | 'setup' | 'clients' | 'items' | 'invoices' | 'quotations'>('editor');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.Quotation);
  
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem('companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Company[];
        }
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
      template: 'classic',
      accentColor: '#4f46e5',
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
  const [template, setTemplate] = useState(activeCompany.template);
  const [accentColor, setAccentColor] = useState(activeCompany.accentColor);

  useEffect(() => {
    if (activeCompany) {
      setCompanyDetails(activeCompany.details);
      setCompanyLogo(activeCompany.logo);
      setBankQRCode(activeCompany.bankQRCode);
      setNotes(activeCompany.defaultNotes);
      setTaxRate(activeCompany.taxRate);
      setCurrency(activeCompany.currency);
      setTemplate(activeCompany.template);
      setAccentColor(activeCompany.accentColor);
    }
  }, [activeCompany]);


  const [clientDetails, setClientDetails] = useState<Details>({ name: '', address: '', email: '', phone: '' });
  
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed as Client[];
        }
      }
    } catch (e) {
      console.error('Failed to load clients from localStorage', e);
    }
    return [];
  });

   const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem('items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed as Item[];
        }
      }
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
    }
    return [];
  });

  const [documentNumber, setDocumentNumber] = useState('001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split('T')[0];
  });
  const [dueDateOption, setDueDateOption] = useState<string>('15days');
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState<InvoiceStatus | null>(null);
  
  const [generatingStates, setGeneratingStates] = useState<Record<number, boolean>>({});

  const [savedInvoices, setSavedInvoices] = useState<SavedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('savedInvoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed as SavedDocument[];
        }
      }
    } catch (e) {
      console.error('Failed to load savedInvoices from localStorage', e);
    }
    return [];
  });

  const [savedQuotations, setSavedQuotations] = useState<SavedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('savedQuotations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed as SavedDocument[];
        }
      }
    } catch (e) {
      console.error('Failed to load savedQuotations from localStorage', e);
    }
    return [];
  });

  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadedDocumentInfo, setLoadedDocumentInfo] = useState<{ id: number; status: InvoiceStatus | QuotationStatus | null; docType: DocumentType } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);


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
      console.error('Failed to save savedInvoices to localStorage', e);
    }
  }, [savedInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem('savedQuotations', JSON.stringify(savedQuotations));
    } catch (e) {
      console.error('Failed to save savedQuotations to localStorage', e);
    }
  }, [savedQuotations]);

  // --- Calculations ---
  const subtotal = useMemo(() => lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0), [lineItems]);
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const formatCurrency = useCallback((amount: number) => {
    return `${activeCompany.currency} ${amount.toFixed(2)}`;
  }, [activeCompany.currency]);

  // --- Handlers ---
  const handleDetailChange = (
    setter: React.Dispatch<React.SetStateAction<Details>>,
    field: keyof Details,
    value: string
  ) => {
    setter(prev => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (id: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const handleDeleteLineItem = (id: number) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleGenerateDescription = async (id: number, currentDescription: string) => {
    setGeneratingStates(prev => ({ ...prev, [id]: true }));
    try {
      const newDescription = await generateDescription(currentDescription);
      handleLineItemChange(id, 'description', newDescription);
    } catch (error) {
      // Error is logged in the service, but you could add UI feedback here
    } finally {
      setGeneratingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selected = clients.find(c => c.id === parseInt(clientId, 10));
    if (selected) {
      setClientDetails({
        name: selected.name,
        address: selected.address,
        email: selected.email,
        phone: selected.phone
      });
      setSelectedClientId(clientId);
    } else {
      setClientDetails({ name: '', address: '', email: '', phone: '' });
      setSelectedClientId('');
    }
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDueDateOption(value);
    const newDueDate = new Date(issueDate);
    if (value.endsWith('days')) {
      newDueDate.setDate(newDueDate.getDate() + parseInt(value, 10));
    } else if (value.endsWith('months')) {
      newDueDate.setMonth(newDueDate.getMonth() + parseInt(value, 10));
    } else if (value === 'custom') {
      // Don't change due date yet, user will use the date picker
      return;
    }
    setDueDate(newDueDate.toISOString().split('T')[0]);
  };

  const handleIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIssueDate = e.target.value;
    setIssueDate(newIssueDate);
    // Recalculate due date based on the current option
    const newDueDate = new Date(newIssueDate);
    if (dueDateOption.endsWith('days')) {
      newDueDate.setDate(newDueDate.getDate() + parseInt(dueDateOption, 10));
    } else if (dueDateOption.endsWith('months')) {
      newDueDate.setMonth(newDueDate.getMonth() + parseInt(dueDateOption, 10));
    }
    setDueDate(newDueDate.toISOString().split('T')[0]);
  };
  
  const handleItemSelect = (item: Item) => {
    setLineItems(prev => [
        ...prev, 
        { 
            id: Date.now(), 
            description: item.description, 
            quantity: 1, 
            price: item.price
        }
    ]);
    setItemSearchQuery('');
    setIsItemSearchOpen(false);
  };
  
  const groupedFilteredItems = useMemo(() => {
    if (!Array.isArray(items)) return {};
    const filtered = items.filter(item => item.description.toLowerCase().includes(itemSearchQuery.toLowerCase()));
    return filtered.reduce<Record<string, Item[]>>((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [items, itemSearchQuery]);

  const handleSaveDocument = () => {
    if (!clientDetails.name || lineItems.length === 0) {
      alert('Please fill in client details and add at least one line item.');
      return;
    }
    
    const docToSave: SavedDocument = {
      id: loadedDocumentInfo?.id || Date.now(),
      documentNumber: documentNumber,
      documentType: documentType,
      clientDetails: clientDetails,
      companyDetails: companyDetails,
      companyLogo: companyLogo,
      bankQRCode: bankQRCode,
      issueDate: issueDate,
      dueDate: dueDate,
      lineItems: lineItems,
      notes: notes,
      taxRate: taxRate,
      currency: currency,
      total: total,
      status: loadedDocumentInfo?.docType === DocumentType.Invoice ? (loadedDocumentInfo.status as InvoiceStatus) || InvoiceStatus.Pending : null,
      quotationStatus: loadedDocumentInfo?.docType === DocumentType.Quotation ? (loadedDocumentInfo.status as QuotationStatus) || QuotationStatus.Active : null,
      payments: documentType === DocumentType.Invoice ? payments : [],
      template: template,
      accentColor: accentColor,
    };
    
    if (documentType === DocumentType.Invoice) {
        setSavedInvoices(prev => {
            const existing = prev.find(inv => inv.id === docToSave.id);
            if (existing) {
                return prev.map(inv => inv.id === docToSave.id ? docToSave : inv);
            }
            return [docToSave, ...prev];
        });
        alert('Invoice saved successfully!');
    } else {
        setSavedQuotations(prev => {
            const existing = prev.find(q => q.id === docToSave.id);
            if (existing) {
                return prev.map(q => q.id === docToSave.id ? docToSave : q);
            }
            return [docToSave, ...prev];
        });
        alert('Quotation saved successfully!');
    }
    
    setIsCreatingNew(false);
    setLoadedDocumentInfo({id: docToSave.id, status: docToSave.status || docToSave.quotationStatus || null, docType: documentType});
  };

  const handleCreateNew = () => {
    setLoadedDocumentInfo(null);
    setIsCreatingNew(true);
    // Reset form fields
    setDocumentType(DocumentType.Quotation);
    setClientDetails({ name: '', address: '', email: '', phone: '' });
    setSelectedClientId('');
    setLineItems([]);
    setPayments([]);
    setStatus(null);

    const newDocNumber = '001';
    // This logic could be improved to find the next available number
    if (documentType === DocumentType.Invoice && savedInvoices.length > 0) {
        const lastNum = Math.max(...savedInvoices.map(inv => parseInt(inv.documentNumber, 10)));
        setDocumentNumber(String(lastNum + 1).padStart(3, '0'));
    } else if (documentType === DocumentType.Quotation && savedQuotations.length > 0) {
        const lastNum = Math.max(...savedQuotations.map(q => parseInt(q.documentNumber, 10)));
        setDocumentNumber(String(lastNum + 1).padStart(3, '0'));
    } else {
        setDocumentNumber(newDocNumber);
    }
    
    const today = new Date().toISOString().split('T')[0];
    setIssueDate(today);
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 15);
    setDueDate(newDueDate.toISOString().split('T')[0]);
    setDueDateOption('15days');

    // Reset company specific fields to active company defaults
    setCompanyDetails(activeCompany.details);
    setCompanyLogo(activeCompany.logo);
    setBankQRCode(activeCompany.bankQRCode);
    setNotes(activeCompany.defaultNotes);
    setTaxRate(activeCompany.taxRate);
    setCurrency(activeCompany.currency);
    setTemplate(activeCompany.template);
    setAccentColor(activeCompany.accentColor);

  };

  const handleLoadDocument = (doc: SavedDocument) => {
      setDocumentType(doc.documentType);
      setClientDetails(doc.clientDetails);
      const loadedClient = clients.find(c => c.name === doc.clientDetails.name && c.email === doc.clientDetails.email);
      setSelectedClientId(loadedClient ? String(loadedClient.id) : '');
      
      setDocumentNumber(doc.documentNumber);
      setIssueDate(doc.issueDate);
      setDueDate(doc.dueDate);
      setLineItems(doc.lineItems);
      setNotes(doc.notes);
      setTaxRate(doc.taxRate);
      setCurrency(doc.currency);
      setStatus(doc.status);
      setPayments(doc.payments || []);
      
      setCompanyDetails(doc.companyDetails);
      setCompanyLogo(doc.companyLogo);
      setBankQRCode(doc.bankQRCode);
      setTemplate(doc.template);
      setAccentColor(doc.accentColor);

      setLoadedDocumentInfo({id: doc.id, status: doc.status || doc.quotationStatus || null, docType: doc.documentType});
      setIsCreatingNew(false);
      
      setCurrentView('editor');
  };

  const handleCreateInvoiceFromQuote = (quotation: SavedDocument) => {
    handleLoadDocument({
      ...quotation,
      documentType: DocumentType.Invoice,
      status: InvoiceStatus.Pending,
      quotationStatus: QuotationStatus.Agreed,
    });
    setDocumentType(DocumentType.Invoice);
    setStatus(InvoiceStatus.Pending);

    // Update the original quotation to be "Agreed"
    setSavedQuotations(prev => prev.map(q => q.id === quotation.id ? {...q, quotationStatus: QuotationStatus.Agreed} : q));

    // Create a new document number for the invoice
    const lastNum = savedInvoices.length > 0 ? Math.max(...savedInvoices.map(inv => parseInt(inv.documentNumber, 10))) : 0;
    setDocumentNumber(String(lastNum + 1).padStart(3, '0'));
    
    // Set a new ID for the invoice so it saves as a new document
    setLoadedDocumentInfo({id: Date.now(), status: InvoiceStatus.Pending, docType: DocumentType.Invoice});
    setIsCreatingNew(false);
    setCurrentView('editor');
  };
  
  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (printArea) {
      try {
        const canvas = await html2canvas(printArea, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = width / ratio;

        if (height <= pdfHeight) {
          pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        } else {
          // Handle multi-page PDF for long content
          let position = 0;
          const pageHeight = pdf.internal.pageSize.getHeight();
          let remainingHeight = canvas.height;
          
          while (remainingHeight > 0) {
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(canvas.height, canvas.width * pageHeight / pdfWidth); // Height of one A4 page in canvas pixels
            const ctx = pageCanvas.getContext('2d');
            ctx?.drawImage(canvas, 0, position, canvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
            const pageImgData = pageCanvas.toDataURL('image/png');
            if (position > 0) {
              pdf.addPage();
            }
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pageHeight);
            position += pageCanvas.height;
            remainingHeight -= pageCanvas.height;
          }
        }
        
        pdf.save(`${documentType}_${documentNumber}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, there was an error generating the PDF.");
      }
    }
  };
  
  const handleSendReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    const balanceDue = doc.total - (doc.payments?.reduce((s, p) => s + p.amount, 0) || 0);
    const message = `Dear ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding invoice #${doc.documentNumber} for the amount of ${formatCurrency(doc.total)}. The outstanding balance is ${formatCurrency(balanceDue)}. The due date is ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\n\nThank you,\n${doc.companyDetails.name}`;
    
    if (channel === 'email') {
      const subject = `Reminder: Invoice #${doc.documentNumber} from ${doc.companyDetails.name}`;
      window.location.href = `mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else { // whatsapp
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };
  
  const handleSendQuotationReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    const message = `Dear ${doc.clientDetails.name},\n\nThis is a friendly follow-up on our quotation #${doc.documentNumber} for the amount of ${formatCurrency(doc.total)}. It is valid until ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\n\nPlease let us know if you have any questions.\n\nBest regards,\n${doc.companyDetails.name}`;
    
    if (channel === 'email') {
      const subject = `Quotation #${doc.documentNumber} from ${doc.companyDetails.name}`;
      window.location.href = `mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else { // whatsapp
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const navButtonClasses = "flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-md transition-colors text-sm font-medium";
  const activeNavButtonClasses = "bg-indigo-100 text-indigo-700";
  const inactiveNavButtonClasses = "text-slate-600 hover:bg-slate-200";

  const renderCurrentView = () => {
    switch(currentView) {
      case 'setup':
        return <SetupPage companies={companies} setCompanies={setCompanies} onDone={() => setCurrentView('editor')} />;
      case 'clients':
        return <ClientListPage clients={clients} setClients={setClients} onDone={() => setCurrentView('editor')} />;
      case 'items':
        return <ItemListPage items={items} setItems={setItems} formatCurrency={formatCurrency} onDone={() => setCurrentView('editor')} />;
      case 'invoices':
        return <DocumentListPage documents={savedInvoices} setDocuments={setSavedInvoices} formatCurrency={formatCurrency} handleSendReminder={handleSendReminder} handleLoadDocument={handleLoadDocument} />;
      case 'quotations':
        return <QuotationListPage documents={savedQuotations} setDocuments={setSavedQuotations} formatCurrency={formatCurrency} handleCreateInvoiceFromQuote={handleCreateInvoiceFromQuote} handleLoadDocument={handleLoadDocument} handleSendQuotationReminder={handleSendQuotationReminder} />;
      case 'editor':
      default:
        return (
          <>
            <div className="sticky top-[52px] bg-gray-100/80 backdrop-blur-sm z-10 border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">
                              {isCreatingNew ? 'Creating New Document' : `Editing ${loadedDocumentInfo?.docType} #${documentNumber}`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleCreateNew} className="flex items-center gap-1.5 bg-white text-slate-700 font-semibold py-2 px-3 rounded-lg shadow-sm border hover:bg-slate-100 text-sm">
                                <PlusIcon /> Create New
                            </button>
                            <button onClick={handleSaveDocument} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                                {isCreatingNew ? 'Save' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 sm:p-6 lg:p-8">
              {/* Form Section */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Document Type</h2>
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setDocumentType(DocumentType.Quotation)} className={`flex-1 text-center font-semibold py-2 px-3 rounded-md transition-all duration-200 ${documentType === DocumentType.Quotation ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                          Quotation
                      </button>
                      <button onClick={() => setDocumentType(DocumentType.Invoice)} className={`flex-1 text-center font-semibold py-2 px-3 rounded-md transition-all duration-200 ${documentType === DocumentType.Invoice ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                          Invoice
                      </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Client Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Select Existing Client</label>
                      <select value={selectedClientId} onChange={e => handleClientSelect(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- New Client --</option>
                        {/* FIX: Added an Array.isArray check for `clients` before accessing its `map` property to prevent potential runtime errors if `clients` is not an array. This also provides a type guard for the code inside the map, resolving the static analysis error. */}
                        {Array.isArray(clients) ? clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>) : null}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Name</label>
                      <input type="text" value={clientDetails.name} onChange={e => handleDetailChange(setClientDetails, 'name', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Address</label>
                      <input type="text" value={clientDetails.address} onChange={e => handleDetailChange(setClientDetails, 'address', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Email</label>
                      <input type="email" value={clientDetails.email} onChange={e => handleDetailChange(setClientDetails, 'email', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Document Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">{documentType} Number</label>
                          <input type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Issue Date</label>
                          <input type="date" value={issueDate} onChange={handleIssueDateChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">{documentType === DocumentType.Invoice ? 'Payment Terms' : 'Validity'}</label>
                          <select value={dueDateOption} onChange={handleDueDateChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                              <option value="15days">15 Days</option>
                              <option value="30days">30 Days</option>
                              <option value="45days">45 Days</option>
                              <option value="60days">60 Days</option>
                              <option value="custom">Custom</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">{documentType === DocumentType.Invoice ? 'Due Date' : 'Valid Until'}</label>
                          <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setDueDateOption('custom'); }} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Line Items</h2>
                    <div className="relative">
                      <input 
                          type="text"
                          placeholder="Search for an item..."
                          value={itemSearchQuery}
                          onChange={e => { setItemSearchQuery(e.target.value); setIsItemSearchOpen(true); }}
                          onFocus={() => setIsItemSearchOpen(true)}
                          className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                      {isItemSearchOpen && (
                          <div className="absolute z-10 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border rounded-md shadow-lg">
                              {itemSearchQuery && Object.keys(groupedFilteredItems).length > 0 ? (
                                  Object.entries(groupedFilteredItems).map(([category, itemsInCategory]) => (
                                      <div key={category}>
                                          <h3 className="text-xs font-bold uppercase text-slate-500 bg-slate-100 p-2 sticky top-0">{category}</h3>
                                          {itemsInCategory.map(item => (
                                              <div key={item.id} onClick={() => handleItemSelect(item)} className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center">
                                                  <span>{item.description}</span>
                                                  <span className="text-sm text-slate-500">{formatCurrency(item.price)}</span>
                                              </div>
                                          ))}
                                      </div>
                                  ))
                              ) : (
                                  <div className="p-2 text-slate-500 text-center text-sm">Type to search items.</div>
                              )}
                          </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg border">
                          <div className="col-span-12">
                              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                              <div className="flex gap-1">
                                  <textarea
                                      rows={2}
                                      value={item.description}
                                      onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                                      className="flex-grow w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-none"
                                  />
                                  <button
                                      onClick={() => handleGenerateDescription(item.id, item.description)}
                                      className="flex-shrink-0 p-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200"
                                      title="Generate description with AI"
                                      disabled={generatingStates[item.id]}
                                  >
                                      <SparklesIcon isLoading={generatingStates[item.id]} />
                                  </button>
                              </div>
                          </div>
                          <div className="col-span-5">
                              <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                              <input type="number" value={item.quantity} onChange={e => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                          </div>
                          <div className="col-span-5">
                              <label className="block text-sm font-medium text-gray-600 mb-1">Price</label>
                              <input type="number" value={item.price} onChange={e => handleLineItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                          </div>
                           <div className="col-span-2 flex items-end">
                              <button onClick={() => handleDeleteLineItem(item.id)} className="w-full p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex justify-center items-center">
                                  <TrashIcon />
                              </button>
                          </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleAddLineItem} className="mt-4 flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                      <PlusIcon /> Add Item
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Notes / Terms</h2>
                  <textarea 
                      rows={4} 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)}
                      className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter notes, terms and conditions, or payment instructions here..."
                  />
                </div>
              </div>

              {/* Preview and Actions Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800">Preview</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-3 rounded-lg shadow-sm border hover:bg-slate-100 text-sm">
                            <PrinterIcon /> <span className="hidden sm:inline">Print</span>
                        </button>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-3 rounded-lg shadow-sm border hover:bg-slate-100 text-sm">
                            <DownloadIcon /> <span className="hidden sm:inline">Download PDF</span>
                        </button>
                    </div>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto pr-2">
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
                      payments={payments}
                      status={status}
                      template={template}
                      accentColor={accentColor}
                    />
                  </div>
                </div>
              </div>
            </main>
          </>
        );
    }
  };
  
  const DesktopSidebarButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, title, children }) => {
    return (
      <button 
        onClick={onClick}
        className={`relative group flex items-center justify-center gap-2 p-3 rounded-md transition-colors text-sm font-medium w-12 h-12 ${isActive ? activeNavButtonClasses : inactiveNavButtonClasses}`}
        title={title}
      >
        {children}
        <span className="absolute left-full ml-3 px-2 py-1 bg-slate-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {title}
        </span>
      </button>
    );
  };


  return (
    <div className="min-h-screen bg-gray-100" onClick={() => { setIsItemSearchOpen(false); }}>
      <header className="bg-white shadow-md sticky top-0 z-20 h-[52px] flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">InvQuo AI</h1>
                {/* Desktop Navigation */}
                <nav className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setCurrentView('editor')} className={`py-1 px-3 rounded-md transition-colors text-sm font-medium ${currentView === 'editor' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Editor</button>
                    <button onClick={() => setCurrentView('quotations')} className={`py-1 px-3 rounded-md transition-colors text-sm font-medium ${currentView === 'quotations' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Quotations</button>
                    <button onClick={() => setCurrentView('invoices')} className={`py-1 px-3 rounded-md transition-colors text-sm font-medium ${currentView === 'invoices' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Invoices</button>
                </nav>
            </div>
          </div>
        </div>
      </header>

       {/* Floating Nav for Mobile */}
       <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 grid grid-cols-5">
           <button onClick={() => setCurrentView('editor')} className={`${navButtonClasses} ${currentView === 'editor' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <FileTextIcon /><span className="text-xs">Editor</span>
           </button>
            <button onClick={() => setCurrentView('quotations')} className={`${navButtonClasses} ${currentView === 'quotations' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <DocumentIcon /><span className="text-xs">Quotes</span>
           </button>
           <button onClick={() => setCurrentView('invoices')} className={`${navButtonClasses} ${currentView === 'invoices' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <ListIcon /><span className="text-xs">Invoices</span>
           </button>
            <button onClick={() => setCurrentView('clients')} className={`${navButtonClasses} ${currentView === 'clients' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <UsersIcon /><span className="text-xs">Clients</span>
           </button>
           <button onClick={() => setCurrentView('setup')} className={`${navButtonClasses} ${currentView === 'setup' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <CogIcon /><span className="text-xs">Setup</span>
           </button>
       </nav>

        {/* Sidebar Nav for Desktop */}
        <div className="hidden sm:block fixed top-0 left-0 h-full bg-white pt-[52px] z-10 shadow-lg">
             <nav className="flex flex-col p-2 space-y-1">
                 <DesktopSidebarButton onClick={() => setCurrentView('clients')} isActive={currentView === 'clients'} title="Clients">
                    <UsersIcon />
                 </DesktopSidebarButton>
                 <DesktopSidebarButton onClick={() => setCurrentView('items')} isActive={currentView === 'items'} title="Items">
                    <ListIcon />
                 </DesktopSidebarButton>
                 <DesktopSidebarButton onClick={() => setCurrentView('setup')} isActive={currentView === 'setup'} title="Setup">
                    <CogIcon />
                 </DesktopSidebarButton>
             </nav>
        </div>
        
        <div className="sm:pl-16 pb-16 sm:pb-0">
          {renderCurrentView()}
        </div>
    </div>
  );
};

export default App;
