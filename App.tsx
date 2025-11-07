import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DocumentType, LineItem, Details, Client, Item, SavedDocument, InvoiceStatus, Company, Payment, QuotationStatus } from './types';
import { generateDescription } from './services/geminiService';
import { SparklesIcon, PlusIcon, TrashIcon, CogIcon, UsersIcon, ListIcon, DocumentIcon, MailIcon, WhatsAppIcon, FileTextIcon, DownloadIcon, MoreVerticalIcon, PrinterIcon } from './components/Icons';
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
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
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
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadedDocumentInfo, setLoadedDocumentInfo] = useState<{ id: number; status: InvoiceStatus | QuotationStatus | null; docType: DocumentType } | null>(null);


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
  
  // --- Document Number Management ---
  useEffect(() => {
    if (currentView !== 'editor' || loadedDocumentInfo) return;
    const relevantDocs = documentType === DocumentType.Invoice ? savedInvoices : savedQuotations;
    const highestNum = relevantDocs.reduce((max, doc) => {
      const num = parseInt(doc.documentNumber, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    setDocumentNumber(String(highestNum + 1).padStart(3, '0'));
  }, [documentType, savedInvoices, savedQuotations, currentView, loadedDocumentInfo]);
  // --- End Document Number Management ---

  // --- Auto-update saved client on detail change ---
  useEffect(() => {
    if (selectedClientId) {
      setClients(prevClients =>
        prevClients.map(client =>
          client.id === parseInt(selectedClientId, 10)
            ? { ...client, ...clientDetails }
            : client
        )
      );
    }
  }, [clientDetails, selectedClientId, setClients]);

  // --- Due Date Calculation Effect ---
  useEffect(() => {
    if (dueDateOption === 'custom' || !issueDate) return;

    const newDueDate = new Date(issueDate + 'T00:00:00'); 
    
    switch (dueDateOption) {
        case 'sameday': break;
        case '15days': newDueDate.setDate(newDueDate.getDate() + 15); break;
        case '30days': newDueDate.setDate(newDueDate.getDate() + 30); break;
        case '45days': newDueDate.setDate(newDueDate.getDate() + 45); break;
        case '60days': newDueDate.setDate(newDueDate.getDate() + 60); break;
        default: return;
    }

    setDueDate(newDueDate.toISOString().split('T')[0]);
  }, [issueDate, dueDateOption]);
  
  const handleManualDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
    setDueDateOption('custom');
  };
  // --- End Due Date Calculation ---

  // --- Close action menu on outside click ---
  useEffect(() => {
    const closeMenu = () => setIsActionMenuOpen(false);
    if (isActionMenuOpen) {
      window.addEventListener('click', closeMenu);
    }
    return () => {
      window.removeEventListener('click', closeMenu);
    };
  }, [isActionMenuOpen]);

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
  
  const clearAndPrepareNewDocument = useCallback(() => {
    setLoadedDocumentInfo(null);
    setSelectedClientId('');
    setClientDetails({ name: '', address: '', email: '', phone: '' });
    setLineItems([]);
    setSelectedSavedItemId('');
    setPayments([]);
    setStatus(documentType === DocumentType.Invoice ? InvoiceStatus.Pending : null);
    
    const today = new Date().toISOString().split('T')[0];
    setIssueDate(today);
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 15);
    setDueDate(newDueDate.toISOString().split('T')[0]);
    setDueDateOption('15days');

    if (activeCompany) {
      setNotes(activeCompany.defaultNotes);
      setTemplate(activeCompany.template);
      setAccentColor(activeCompany.accentColor);
    }
  }, [activeCompany, documentType]);

  const handleCreateNew = () => {
    if (window.confirm("Are you sure you want to start a new document? All unsaved changes will be lost.")) {
      clearAndPrepareNewDocument();
    }
  };

  const handleSaveDocument = () => {
    if (lineItems.length === 0 || !clientDetails.name.trim()) {
      alert('Please add at least one line item and a client name before saving.');
      return;
    }

    let originalDoc: SavedDocument | undefined = undefined;
    if (loadedDocumentInfo) {
      const list = loadedDocumentInfo.docType === DocumentType.Invoice ? savedInvoices : savedQuotations;
      originalDoc = list.find(d => d.id === loadedDocumentInfo.id);
    }

    const isUpdating = !!originalDoc;

    if (originalDoc) {
      if (originalDoc.documentType === DocumentType.Invoice && originalDoc.status !== InvoiceStatus.Pending) {
        alert('This invoice is already Paid or Partially Paid and cannot be modified. Please create a new invoice instead.');
        return;
      }
      if (originalDoc.documentType === DocumentType.Quotation) {
        if (originalDoc.quotationStatus === QuotationStatus.Agreed) {
          alert('This quotation has been converted to an invoice and cannot be modified.');
          return;
        }
        if (originalDoc.quotationStatus === QuotationStatus.Expired) {
          alert('This quotation has expired and cannot be modified.');
          return;
        }
      }
    }

    const existingDocs = documentType === DocumentType.Invoice ? savedInvoices : savedQuotations;
    const isDuplicate = existingDocs.some(
      doc => doc.documentNumber.trim().toLowerCase() === documentNumber.trim().toLowerCase() && doc.id !== originalDoc?.id
    );

    if (isDuplicate) {
      alert(`A ${documentType.toLowerCase()} with the number #${documentNumber} already exists. Please use a different number.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to ${isUpdating ? 'update' : 'save'} this ${documentType.toLowerCase()}? Please review the details.`)) {
      return;
    }

    if (clientDetails.name && clientDetails.name.trim() !== '') {
      const isExistingClient = clients.some(c => 
        c.name.trim().toLowerCase() === clientDetails.name.trim().toLowerCase() && 
        c.email.trim().toLowerCase() === clientDetails.email.trim().toLowerCase()
      );

      if (!isExistingClient && window.confirm(`'${clientDetails.name}' is not saved. Save to client list?`)) {
          const newClient: Client = { id: Date.now(), ...clientDetails };
          setClients(prev => [...prev, newClient]);
      }
    }

    let finalStatus: InvoiceStatus | null = null;
    let finalPaidDate: string | null | undefined = null;
    if (documentType === DocumentType.Invoice) {
        const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        if (amountPaid >= total) {
            finalStatus = InvoiceStatus.Paid;
            finalPaidDate = payments.length > 0 ? payments[payments.length - 1].date : new Date().toISOString().split('T')[0];
        } else if (amountPaid > 0) {
            finalStatus = InvoiceStatus.PartiallyPaid;
        } else {
            finalStatus = InvoiceStatus.Pending;
        }
    }

    const documentData: Omit<SavedDocument, 'id'> = {
      documentNumber,
      documentType,
      clientDetails,
      companyDetails,
      companyLogo,
      bankQRCode,
      issueDate,
      dueDate,
      lineItems,
      notes,
      taxRate,
      currency,
      total,
      status: finalStatus,
      quotationStatus: documentType === DocumentType.Quotation ? (originalDoc?.quotationStatus || QuotationStatus.Active) : null,
      paidDate: finalPaidDate,
      payments: documentType === DocumentType.Invoice ? payments : [],
      template,
      accentColor,
    };
    
    if (isUpdating && originalDoc) {
      const updatedDocument: SavedDocument = { ...documentData, id: originalDoc.id };
      if (documentType === DocumentType.Invoice) {
        setSavedInvoices(prev => prev.map(doc => doc.id === originalDoc.id ? updatedDocument : doc));
        alert('Invoice updated successfully!');
      } else {
        setSavedQuotations(prev => prev.map(doc => doc.id === originalDoc.id ? updatedDocument : doc));
        alert('Quotation updated successfully!');
      }
    } else {
      const newDocument: SavedDocument = { ...documentData, id: Date.now() };
      if (documentType === DocumentType.Invoice) {
        setSavedInvoices(prev => [newDocument, ...prev]);
        alert('Invoice saved successfully!');
      } else {
        setSavedQuotations(prev => [newDocument, ...prev]);
        alert('Quotation saved successfully!');
      }
    }
  };

  const handleSavePdf = async () => {
    const input = document.getElementById('print-area');
    if (input) {
      try {
        const canvas = await html2canvas(input, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        
        const filename = `${documentType}-${documentNumber}.pdf`;
        pdf.save(filename);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, there was an error generating the PDF.");
      }
    }
  };
  
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedClient = clients.find(c => c.id === parseInt(clientId, 10));
    if (selectedClient) {
        setClientDetails(selectedClient);
    } else {
        setClientDetails({ name: '', address: '', email: '', phone: '' });
    }
  };

  const handleLoadDocument = (doc: SavedDocument) => {
    setLoadedDocumentInfo({ id: doc.id, status: doc.status || doc.quotationStatus, docType: doc.documentType });
    setDocumentType(doc.documentType);
    setCompanyDetails(doc.companyDetails || activeCompany.details);
    setCompanyLogo(doc.companyLogo);
    setBankQRCode(doc.bankQRCode);
    setClientDetails(doc.clientDetails);
    setDocumentNumber(doc.documentNumber);
    setIssueDate(doc.issueDate);
    setDueDate(doc.dueDate);
    setLineItems(doc.lineItems.map(item => ({ ...item, id: Date.now() + Math.random() }))); 
    setNotes(doc.notes);
    setTaxRate(doc.taxRate);
    setCurrency(doc.currency);
    setPayments(doc.payments || []);
    setStatus(doc.status);
    setTemplate(doc.template || 'classic');
    setAccentColor(doc.accentColor || '#4f46e5');
    setCurrentView('editor');
  };

  const generateWhatsAppMessage = (docData: any) => {
    let message = `*${docData.documentType.toUpperCase()}*\n\n`;

    message += `*FROM:*\n${docData.companyDetails.name}\n`;
    if (docData.companyDetails.address) message += `${docData.companyDetails.address}\n`;
    if (docData.companyDetails.email) message += `Email: ${docData.companyDetails.email}\n`;
    if (docData.companyDetails.phone) message += `Phone: ${docData.companyDetails.phone}\n`;
    if (docData.companyDetails.website) message += `Website: ${docData.companyDetails.website}\n`;
    if (docData.companyDetails.taxId) message += `Tax ID: ${docData.companyDetails.taxId}\n\n`;

    const billedToLabel = docData.documentType === DocumentType.Invoice ? 'BILLED TO' : 'QUOTE TO';
    message += `*${billedToLabel}:*\n${docData.clientDetails.name}\n`;
    if (docData.clientDetails.address) message += `${docData.clientDetails.address}\n`;
    if (docData.clientDetails.email) message += `Email: ${docData.clientDetails.email}\n\n`;

    message += `*${docData.documentType} #: ${docData.documentNumber}*\n`;
    message += `*Date Issued:* ${new Date(docData.issueDate + 'T00:00:00').toLocaleDateString()}\n`;
    const dueDateLabel = docData.documentType === DocumentType.Invoice ? 'Due Date' : 'Valid Until';
    message += `*${dueDateLabel}:* ${new Date(docData.dueDate + 'T00:00:00').toLocaleDateString()}\n\n`;

    message += `*ITEMS*\n-----------------------------------\n`;
    docData.lineItems.forEach((item: LineItem) => {
        message += `${item.description}\n(${item.quantity} x ${docData.formatCurrency(item.price)}) = *${docData.formatCurrency(item.price * item.quantity)}*\n-----------------------------------\n`;
    });
    message += `\n`;

    message += `Subtotal: ${docData.formatCurrency(docData.subtotal)}\n`;
    message += `Tax (${docData.taxRate}%): ${docData.formatCurrency(docData.taxAmount)}\n`;
    message += `*TOTAL: ${docData.formatCurrency(docData.total)}*\n\n`;
    
    if(docData.payments && docData.payments.length > 0) {
        const amountPaid = docData.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
        const balanceDue = docData.total - amountPaid;
        message += `Amount Paid: ${docData.formatCurrency(amountPaid)}\n`;
        message += `*Balance Due: ${docData.formatCurrency(balanceDue)}*\n\n`;
    }

    if (docData.notes) message += `*Notes:*\n${docData.notes}\n\n`;

    if (docData.companyDetails.bankName || docData.companyDetails.accountNumber) {
        message += `*Payment Details:*\n`;
        if (docData.companyDetails.bankName) message += `Bank: ${docData.companyDetails.bankName}\n`;
        if (docData.companyDetails.accountNumber) message += `Account No.: ${docData.companyDetails.accountNumber}\n\n`;
    }

    return message;
  };

   const handleSendReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    const reminderMessage = `Dear ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding invoice #${doc.documentNumber} for ${formatCurrency(doc.total)}, which was due on ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\n\nPlease let us know if you have any questions.\n\nBest regards,\n${doc.companyDetails.name}`;
    
    if (channel === 'email') {
      const subject = `Payment Reminder: Invoice #${doc.documentNumber}`;
      window.location.href = `mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reminderMessage)}`;
    } else {
      if (!doc.clientDetails.phone || doc.clientDetails.phone.trim() === '') {
        alert(`Please add a phone number for '${doc.clientDetails.name}' to send a WhatsApp reminder.`);
        return;
      }
      const phoneNumber = doc.clientDetails.phone.replace(/\D/g, '');

      const subtotal = doc.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
      const taxAmount = subtotal * (doc.taxRate / 100);
      const docDataForMessage = { ...doc, subtotal, taxAmount, formatCurrency };
      
      const reminderPrefix = `*Friendly Reminder*\n\nDear ${doc.clientDetails.name},\nThis is a reminder for the following invoice which was due on ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}:\n\n---\n\n`;
      const messageContent = generateWhatsAppMessage(docDataForMessage);
      const fullMessage = reminderPrefix + messageContent;

      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(fullMessage)}`;
      window.open(url, '_blank');
    }
  };
  
  const handleCreateInvoiceFromQuote = (quotation: SavedDocument) => {
    if (!window.confirm(`Create an invoice from quotation #${quotation.documentNumber}? This will be saved immediately.`)) {
      return;
    }
    
    const newInvoiceNumber = quotation.documentNumber;

    const isDuplicateInvoice = savedInvoices.some(
      inv => inv.documentNumber.trim().toLowerCase() === newInvoiceNumber.trim().toLowerCase()
    );

    if (isDuplicateInvoice) {
      alert(`Cannot create invoice. An invoice with the number #${newInvoiceNumber} already exists.`);
      return;
    }
    
    const today = new Date();
    const issueDate = today.toISOString().split('T')[0];
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 15);
    const dueDateString = dueDate.toISOString().split('T')[0];

    const newInvoice: SavedDocument = {
      ...quotation,
      id: Date.now(),
      documentType: DocumentType.Invoice,
      documentNumber: newInvoiceNumber,
      issueDate: issueDate,
      dueDate: dueDateString,
      status: InvoiceStatus.Pending,
      paidDate: null,
      payments: [],
      quotationStatus: null,
    };
    
    setSavedInvoices(prev => [newInvoice, ...prev]);
    setSavedQuotations(prev => prev.map(q => q.id === quotation.id ? { ...q, quotationStatus: QuotationStatus.Agreed } : q));

    alert(`Invoice #${newInvoiceNumber} created successfully!`);
    setCurrentView('invoices');
  };

  const handleShareEmail = () => {
      const subject = `${documentType} #${documentNumber} from ${companyDetails.name}`;
      
      const docDataForMessage = {
          documentType, companyDetails, clientDetails, documentNumber,
          issueDate, dueDate, lineItems, notes, subtotal, taxAmount, taxRate, total,
          formatCurrency, payments,
      };
      
      const messagePrefix = `Hi ${clientDetails.name},\n\nPlease find the details of our ${documentType.toLowerCase()} #${documentNumber} below.\n\n---\n\n`;
      const messageContent = generateWhatsAppMessage(docDataForMessage);
      const messageSuffix = `\n\nThank you,\n${companyDetails.name}`;
      const body = messagePrefix + messageContent + messageSuffix;
      
      window.location.href = `mailto:${clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareWhatsApp = () => {
    if (!clientDetails.phone || clientDetails.phone.trim() === '') {
      alert("Please enter a phone number for the client to share via WhatsApp.");
      return;
    }
    const phoneNumber = clientDetails.phone.replace(/\D/g, '');
    
    const docDataForMessage = {
        documentType, companyDetails, clientDetails, documentNumber,
        issueDate, dueDate, lineItems, notes, subtotal, taxAmount, taxRate, total,
        formatCurrency, payments,
    };
    
    const messagePrefix = `Hi ${clientDetails.name}, here is our ${documentType.toLowerCase()} #${documentNumber}:\n\n---\n\n`;
    const messageContent = generateWhatsAppMessage(docDataForMessage);
    const message = messagePrefix + messageContent;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
                <select value={selectedClientId} onChange={(e) => handleSelectClient(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
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
              <input 
                type="text" 
                value={documentNumber} 
                onChange={e => setDocumentNumber(e.target.value)} 
                readOnly={!!loadedDocumentInfo}
                className={`w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!!loadedDocumentInfo ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                title={!!loadedDocumentInfo ? 'Document number cannot be changed for a saved document.' : ''}
              />
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
            payments={payments}
            status={status}
            template={template}
            accentColor={accentColor}
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
                {/* Desktop View: Full buttons */}
                <div className="hidden sm:flex items-center gap-2">
                    <button onClick={handleShareEmail} title="Share via Email" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"> <MailIcon /> </button>
                    <button onClick={handleShareWhatsApp} title="Share via WhatsApp" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"> <WhatsAppIcon /> </button>
                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                    <button onClick={handleCreateNew} title="Create New Document" className="bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                        <span>New</span>
                    </button>
                    <button onClick={handleSaveDocument} className="bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                        <span>Save</span>
                    </button>
                    <button onClick={() => window.print()} title="Print" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
                        Print
                    </button>
                    <button onClick={handleSavePdf} title="Save as PDF" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
                        PDF
                    </button>
                </div>
                
                {/* Mobile View: Dropdown */}
                <div className="sm:hidden flex items-center gap-2">
                    <button onClick={handleCreateNew} title="Create New Document" className="bg-slate-500 text-white font-semibold py-2 px-3 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                        <span>New</span>
                    </button>
                    <button onClick={handleSaveDocument} className="bg-slate-500 text-white font-semibold py-2 px-3 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                        <span>Save</span>
                    </button>
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(prev => !prev); }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                            <MoreVerticalIcon />
                        </button>
                        {isActionMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30 ring-1 ring-black ring-opacity-5" onClick={e => e.stopPropagation()}>
                                <div className="py-1">
                                    <button onClick={() => { handleShareEmail(); setIsActionMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                        <MailIcon /> Share via Email
                                    </button>
                                    <button onClick={() => { handleShareWhatsApp(); setIsActionMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                        <WhatsAppIcon /> Share via WhatsApp
                                    </button>
                                    <div className="border-t my-1"></div>
                                    <button onClick={() => { window.print(); setIsActionMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                       <PrinterIcon/> Print
                                    </button>
                                    <button onClick={() => { handleSavePdf(); setIsActionMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                       <DownloadIcon/> Save as PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    return <button onClick={() => setCurrentView('editor')} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">Back To Main Menu</button>;
  };


  return (
    <div className="min-h-screen font-sans text-slate-800">
      <header className="bg-white shadow-md sticky top-0 z-20 no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
            {/* Title on the far left */}
            <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">QuotInv AI</h1>
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
        {currentView === 'setup' && <SetupPage 
            companies={companies} 
            setCompanies={setCompanies} 
            clients={clients}
            setClients={setClients}
            items={items}
            setItems={setItems}
            savedInvoices={savedInvoices}
            setSavedInvoices={setSavedInvoices}
            savedQuotations={savedQuotations}
            setSavedQuotations={setSavedQuotations}
            onDone={() => setCurrentView('editor')} 
        />}
        {currentView === 'clients' && <ClientListPage clients={clients} setClients={setClients} onDone={() => setCurrentView('editor')} />}
        {currentView === 'items' && <ItemListPage items={items} setItems={setItems} formatCurrency={formatCurrency} onDone={() => setCurrentView('editor')} />}
        {currentView === 'invoices' && <DocumentListPage documents={savedInvoices} setDocuments={setSavedInvoices} formatCurrency={formatCurrency} handleSendReminder={handleSendReminder} handleLoadDocument={handleLoadDocument} />}
        {currentView === 'quotations' && <QuotationListPage documents={savedQuotations} setDocuments={setSavedQuotations} formatCurrency={formatCurrency} handleCreateInvoiceFromQuote={handleCreateInvoiceFromQuote} handleLoadDocument={handleLoadDocument} />}
      </main>
    </div>
  );
};

export default App;