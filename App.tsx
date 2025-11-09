
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DocumentType, LineItem, Details, Client, Item, SavedDocument, InvoiceStatus, Company, Payment, QuotationStatus } from './types';
import { generateDescription } from './services/geminiService';
import { SparklesIcon, PlusIcon, TrashIcon, CogIcon, UsersIcon, ListIcon, DocumentIcon, MailIcon, WhatsAppIcon, FileTextIcon, DownloadIcon, MoreVerticalIcon, PrinterIcon, ChevronDownIcon, CashIcon } from './components/Icons';
import DocumentPreview from './components/DocumentPreview';
import SetupPage from './components/SetupPage';
import ClientListPage from './components/ClientListPage';
import ItemListPage from './components/ItemListPage';
import DocumentListPage from './components/DocumentListPage';
import QuotationListPage from './components/QuotationListPage';
import SaveItemsModal from './components/SaveItemsModal';
import SaveClientModal from './components/SaveClientModal';

declare const jspdf: any;
declare const html2canvas: any;

// --- Update Client Modal Component ---
interface UpdateClientModalProps {
  isOpen: boolean;
  clientInfo: { original: Client; updated: Details };
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
}

const DetailChange: React.FC<{ label: string; original: string; updated: string }> = ({ label, original, updated }) => {
    if (original === updated) return null;
    return (
        <div>
            <p className="font-semibold text-slate-700">{label}</p>
            <p className="text-sm text-slate-500">From: <span className="line-through">{original || 'N/A'}</span></p>
            <p className="text-sm text-green-700">To: <span className="font-medium">{updated || 'N/A'}</span></p>
        </div>
    );
};

const UpdateClientModal: React.FC<UpdateClientModalProps> = ({ isOpen, clientInfo, onConfirm, onDecline, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Update Client Details?</h2>
          <p className="text-gray-600 mb-4">
            You've changed some details for <span className="font-bold">{clientInfo.original.name}</span>. Do you want to update this client's record in your saved client list?
          </p>
          <div className="bg-slate-50 border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto">
            <DetailChange label="Address" original={clientInfo.original.address} updated={clientInfo.updated.address} />
            <DetailChange label="Email" original={clientInfo.original.email} updated={clientInfo.updated.email} />
            <DetailChange label="Phone" original={clientInfo.original.phone} updated={clientInfo.updated.phone} />
          </div>
        </div>
        <div className="bg-slate-50 p-4 flex flex-col sm:flex-row justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="w-full sm:w-auto bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm border hover:bg-slate-100"
          >
            No, Just Update Document
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700"
          >
            Yes, Update Client List
          </button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'editor' | 'setup' | 'clients' | 'items' | 'invoices' | 'quotations'>('editor');
  
  // --- Data States (loaded from localStorage) ---
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

  const [activeCompanyId, setActiveCompanyId] = useState<number>(() => {
    try {
        const savedId = localStorage.getItem('activeCompanyId');
        const parsedId = savedId ? parseInt(savedId, 10) : null;
        const availableCompanies = JSON.parse(localStorage.getItem('companies') || '[]');
        if (parsedId && availableCompanies.some((c: Company) => c.id === parsedId)) {
            return parsedId;
        }
    } catch (e) {
        console.error('Failed to load active company ID from localStorage', e);
    }
    const firstCompany = (JSON.parse(localStorage.getItem('companies') || '[]') as Company[])[0];
    return firstCompany ? firstCompany.id : 1;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('clients');
      return saved && Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });

  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem('items');
      return saved && Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });

  const [savedInvoices, setSavedInvoices] = useState<SavedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('savedInvoices');
      return saved && Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });

  const [savedQuotations, setSavedQuotations] = useState<SavedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('savedQuotations');
      return saved && Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });
  
  const generateDocumentNumber = useCallback((
    client: Details, 
    docType: DocumentType, 
    invoices: SavedDocument[], 
    quotations: SavedDocument[]
  ): string => {
      const clientNameTrimmed = client.name.trim();

      if (!clientNameTrimmed) {
          return '';
      }

      const clientNamePart = clientNameTrimmed.toLowerCase().replace(/\s+/g, '_');
      const phonePart = client.phone ? client.phone.slice(-4) : '0000';
      const docTypePart = docType === DocumentType.Quotation ? 'QUO' : 'INV';
      
      const prefix = `${clientNamePart}_${phonePart}_${docTypePart}_`;

      const relevantDocs = docType === DocumentType.Quotation ? quotations : invoices;
      
      const clientDocs = relevantDocs.filter(
          doc => doc.clientDetails.name.trim().toLowerCase() === clientNameTrimmed.toLowerCase()
      );
      
      const numbers = clientDocs
          .map(doc => {
              const parts = doc.documentNumber.split('_');
              const numStr = parts[parts.length - 1];
              const typeInNum = parts[parts.length - 2];
              if (typeInNum === docTypePart) {
                  const num = parseInt(numStr, 10);
                  return isNaN(num) ? 0 : num;
              }
              return 0;
          })
          .filter(n => n > 0);

      const lastNum = numbers.length > 0 ? Math.max(...numbers) : 0;
      const newNum = String(lastNum + 1).padStart(3, '0');

      return `${prefix}${newNum}`;
  }, []);

  // --- Document Form States ---
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.Quotation);
  const activeCompany = useMemo(() => companies.find(c => c.id === activeCompanyId) || companies[0], [companies, activeCompanyId]);
  
  const [companyDetails, setCompanyDetails] = useState<Details>(activeCompany.details);
  const [companyLogo, setCompanyLogo] = useState<string | null>(activeCompany.logo);
  const [bankQRCode, setBankQRCode] = useState<string | null>(activeCompany.bankQRCode);
  const [notes, setNotes] = useState(activeCompany.defaultNotes);
  const [taxRate, setTaxRate] = useState(activeCompany.taxRate);
  const [currency, setCurrency] = useState(activeCompany.currency);
  const [template, setTemplate] = useState(activeCompany.template);
  const [accentColor, setAccentColor] = useState(activeCompany.accentColor);
  const [clientDetails, setClientDetails] = useState<Details>({ name: '', address: '', email: '', phone: '' });
  const [documentNumber, setDocumentNumber] = useState('');
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
  const [loadedDocumentInfo, setLoadedDocumentInfo] = useState<{ id: number; status: InvoiceStatus | QuotationStatus | null; docType: DocumentType } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [isSaveItemsModalOpen, setIsSaveItemsModalOpen] = useState(false);
  const [potentialNewItems, setPotentialNewItems] = useState<LineItem[]>([]);
  const [pendingDoc, setPendingDoc] = useState<SavedDocument | null>(null);
  const [isSaveClientModalOpen, setIsSaveClientModalOpen] = useState(false);
  const [potentialNewClient, setPotentialNewClient] = useState<Details | null>(null);
  const [newLineItem, setNewLineItem] = useState<Omit<LineItem, 'id'>>({ description: '', quantity: 1, price: 0 });
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);
  const [clientUpdateInfo, setClientUpdateInfo] = useState<{ original: Client; updated: Details } | null>(null);

  // --- Sync active company changes to form ---
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
  
  useEffect(() => {
    try {
        localStorage.setItem('activeCompanyId', String(activeCompanyId));
    } catch (e) {
        console.error('Failed to save active company ID to localStorage', e);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (isCreatingNew) {
      setDocumentNumber(generateDocumentNumber(clientDetails, documentType, savedInvoices, savedQuotations));
    }
  }, [isCreatingNew, clientDetails, documentType, savedInvoices, savedQuotations, generateDocumentNumber]);


  // --- LocalStorage Persistence ---
  useEffect(() => { localStorage.setItem('companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('savedInvoices', JSON.stringify(savedInvoices)); }, [savedInvoices]);
  useEffect(() => { localStorage.setItem('savedQuotations', JSON.stringify(savedQuotations)); }, [savedQuotations]);

  // --- Calculations ---
  const subtotal = useMemo(() => lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0), [lineItems]);
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);
  const formatCurrency = useCallback((amount: number) => `${activeCompany.currency} ${amount.toFixed(2)}`, [activeCompany.currency]);

  // --- Handlers ---
  const handleLineItemChange = (id: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAddLineItem = () => {
    if (!newLineItem.description.trim() || newLineItem.price < 0 || newLineItem.quantity <= 0) {
        alert('Please provide a valid description, quantity, and price for the item.');
        return;
    }
    setLineItems(prev => [...prev, { id: Date.now(), ...newLineItem }]);
    setNewLineItem({ description: '', quantity: 1, price: 0 });
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
      console.error(error);
    } finally {
      setGeneratingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleClearClientDetails = () => {
    setClientDetails({ name: '', address: '', email: '', phone: '' });
  };

  const handleClearNewLineItem = () => {
    setNewLineItem({ description: '', quantity: 1, price: 0 });
  };

  const handleClientDetailChange = (field: keyof Details, value: string) => {
    setClientDetails(prev => ({ ...prev, [field]: value }));
    if (field === 'name') {
        setIsClientDropdownOpen(true);
    }
  };

  const handleSavedClientSelected = (client: Client) => {
    setClientDetails({ name: client.name, address: client.address, email: client.email, phone: client.phone });
    setIsClientDropdownOpen(false);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDueDateOption(value);
    const newDueDate = new Date(issueDate);
    if (value.endsWith('days')) {
      newDueDate.setDate(newDueDate.getDate() + parseInt(value, 10));
    } else if (value.endsWith('months')) {
      newDueDate.setMonth(newDueDate.getMonth() + parseInt(value, 10));
    } else if (value === 'custom') { return; }
    setDueDate(newDueDate.toISOString().split('T')[0]);
  };

  const handleIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIssueDate = e.target.value;
    setIssueDate(newIssueDate);
    const newDueDate = new Date(newIssueDate);
    if (dueDateOption.endsWith('days')) {
      newDueDate.setDate(newDueDate.getDate() + parseInt(dueDateOption, 10));
    } else if (dueDateOption.endsWith('months')) {
      newDueDate.setMonth(newDueDate.getMonth() + parseInt(dueDateOption, 10));
    }
    setDueDate(newDueDate.toISOString().split('T')[0]);
  };
  
  const handleNewLineItemChange = (field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setNewLineItem(prev => ({ ...prev, [field]: value }));
    if (field === 'description') setIsItemDropdownOpen(true);
  };
  
  const handleSavedItemSelected = (item: Item) => {
    setNewLineItem({ description: item.description, price: item.price, quantity: 1 });
    setIsItemDropdownOpen(false);
  };

  const handleDocumentTypeChange = (newType: DocumentType) => {
    if (newType === documentType) return;
    setDocumentType(newType);
  };
  
  const filteredSavedItems = useMemo(() => {
    if (!isItemDropdownOpen || !Array.isArray(items)) return [];
    const searchTerm = newLineItem.description.trim().toLowerCase();
    if (!searchTerm) return items;
    return items.filter(item => item.description.toLowerCase().includes(searchTerm));
  }, [items, newLineItem.description, isItemDropdownOpen]);

  const filteredSavedClients = useMemo(() => {
    if (!isClientDropdownOpen || !Array.isArray(clients)) return [];
    const searchTerm = clientDetails.name.trim().toLowerCase();
    if (!searchTerm) return clients;
    return clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm)) ||
        (client.phone && client.phone.includes(searchTerm))
    );
  }, [clients, clientDetails.name, isClientDropdownOpen]);

  const saveDocument = (docToSave: SavedDocument) => {
    if (docToSave.documentType === DocumentType.Invoice) {
        setSavedInvoices(prev => {
            const existing = prev.find(inv => inv.id === docToSave.id);
            if (existing) return prev.map(inv => inv.id === docToSave.id ? docToSave : inv);
            return [docToSave, ...prev];
        });
        alert('Invoice saved successfully!');
    } else {
        setSavedQuotations(prev => {
            const existing = prev.find(q => q.id === docToSave.id);
            if (existing) return prev.map(q => q.id === docToSave.id ? docToSave : q);
            return [docToSave, ...prev];
        });
        alert('Quotation saved successfully!');
    }
    setIsCreatingNew(false);
    setLoadedDocumentInfo({id: docToSave.id, status: docToSave.status || docToSave.quotationStatus || null, docType: docToSave.documentType});
  };

  const checkNewItemsAndSave = (docToSave: SavedDocument) => {
    const savedItemDescriptions = new Set(items.map(i => i.description.trim().toLowerCase()));
    const newItemsInDoc = docToSave.lineItems.filter(li => li.description.trim() && !savedItemDescriptions.has(li.description.trim().toLowerCase()));
    if (newItemsInDoc.length > 0) {
        setPotentialNewItems(newItemsInDoc);
        setPendingDoc(docToSave);
        setIsSaveItemsModalOpen(true);
    } else {
        saveDocument(docToSave);
        setPendingDoc(null);
    }
  };

  const handleSaveDocument = () => {
    if (!clientDetails.name || lineItems.length === 0) {
      alert('Please fill in client details and add at least one item.');
      return;
    }
    
    // Check for duplicate document number across both invoices and quotations
    const trimmedDocNum = documentNumber.trim();
    if (!trimmedDocNum) {
        alert('Document number cannot be empty. Please ensure client details are filled to generate a number.');
        return;
    }

    if (isCreatingNew) {
        const allDocs = [...savedInvoices, ...savedQuotations];
        const isDuplicate = allDocs.some(
            doc => doc.documentNumber.trim().toLowerCase() === trimmedDocNum.toLowerCase() && doc.id !== loadedDocumentInfo?.id
        );

        if (isDuplicate) {
            alert(`A document (invoice or quotation) with number "${trimmedDocNum}" already exists. Please use a unique number.`);
            return;
        }
    }

    const docToSave: SavedDocument = {
      id: loadedDocumentInfo?.id || Date.now(),
      documentNumber: trimmedDocNum,
      documentType, clientDetails, companyDetails, companyLogo, bankQRCode, issueDate, dueDate,
      lineItems, notes, taxRate, currency, total, template, accentColor,
      status: loadedDocumentInfo?.docType === DocumentType.Invoice ? (loadedDocumentInfo.status as InvoiceStatus) || InvoiceStatus.Pending : null,
      quotationStatus: loadedDocumentInfo?.docType === DocumentType.Quotation ? (loadedDocumentInfo.status as QuotationStatus) || QuotationStatus.Active : null,
      payments: documentType === DocumentType.Invoice ? payments : [],
    };
    
    if (!isCreatingNew) { // If editing, check if client details were modified
        const originalClient = clients.find(c => c.name.trim().toLowerCase() === clientDetails.name.trim().toLowerCase());
        if (originalClient) {
            const detailsHaveChanged = originalClient.address !== clientDetails.address ||
                                     originalClient.email !== clientDetails.email ||
                                     originalClient.phone !== clientDetails.phone;
            if (detailsHaveChanged) {
                setClientUpdateInfo({ original: originalClient, updated: clientDetails });
                setPendingDoc(docToSave);
                setIsUpdateClientModalOpen(true);
                return; // Stop and wait for user confirmation
            }
        }
    }

    const isExistingClient = clients.some(c => c.name.trim().toLowerCase() === clientDetails.name.trim().toLowerCase());
    if (isCreatingNew && clientDetails.name.trim() && !isExistingClient) { // Only prompt for new client when creating new doc
        setPotentialNewClient(clientDetails);
        setPendingDoc(docToSave);
        setIsSaveClientModalOpen(true);
    } else {
        checkNewItemsAndSave(docToSave);
    }
  };

  const handleConfirmUpdateClient = () => {
    if (clientUpdateInfo) {
      setClients(prev => prev.map(c => 
        c.id === clientUpdateInfo.original.id 
          ? { ...c, address: clientUpdateInfo.updated.address, email: clientUpdateInfo.updated.email, phone: clientUpdateInfo.updated.phone } 
          : c
      ));
    }
    setIsUpdateClientModalOpen(false);
    setClientUpdateInfo(null);
    if (pendingDoc) checkNewItemsAndSave(pendingDoc);
  };

  const handleDeclineUpdateClient = () => {
    setIsUpdateClientModalOpen(false);
    setClientUpdateInfo(null);
    if (pendingDoc) checkNewItemsAndSave(pendingDoc);
  };

  const handleCancelUpdateClient = () => {
    setIsUpdateClientModalOpen(false);
    setClientUpdateInfo(null);
    setPendingDoc(null);
  };

  const handleConfirmSaveNewClient = () => {
    if (potentialNewClient) {
        setClients(prev => [{ id: Date.now(), ...potentialNewClient }, ...prev]);
    }
    setIsSaveClientModalOpen(false);
    setPotentialNewClient(null);
    if (pendingDoc) checkNewItemsAndSave(pendingDoc);
  };

  const handleDeclineSaveNewClient = () => {
    setIsSaveClientModalOpen(false);
    setPotentialNewClient(null);
    if (pendingDoc) checkNewItemsAndSave(pendingDoc);
  };
  
  const handleCancelSaveNewClient = () => {
    setIsSaveClientModalOpen(false);
    setPotentialNewClient(null);
    setPendingDoc(null);
  };

  const handleConfirmSaveNewItems = () => {
    if (potentialNewItems.length > 0) {
        const itemsToAdd: Item[] = potentialNewItems.map((li, index) => ({ id: Date.now() + index, description: li.description, price: li.price, category: '' }));
        setItems(prev => [...prev, ...itemsToAdd]);
    }
    if (pendingDoc) saveDocument(pendingDoc);
    setIsSaveItemsModalOpen(false);
    setPotentialNewItems([]);
    setPendingDoc(null);
  };

  const handleDeclineSaveNewItems = () => {
    if (pendingDoc) saveDocument(pendingDoc);
    setIsSaveItemsModalOpen(false);
    setPotentialNewItems([]);
    setPendingDoc(null);
  };

  const handleCancelSaveNewItems = () => {
    setIsSaveItemsModalOpen(false);
    setPotentialNewItems([]);
    setPendingDoc(null);
  };

  const handleCreateNew = () => {
    setLoadedDocumentInfo(null);
    setIsCreatingNew(true);
    setDocumentType(DocumentType.Quotation);
    setClientDetails({ name: '', address: '', email: '', phone: '' });
    setLineItems([]);
    setPayments([]);
    setStatus(null);
    const today = new Date().toISOString().split('T')[0];
    setIssueDate(today);
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 15);
    setDueDate(newDueDate.toISOString().split('T')[0]);
    setDueDateOption('15days');
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
    // Generate new invoice number
    const newInvoiceNumber = generateDocumentNumber(quotation.clientDetails, DocumentType.Invoice, savedInvoices, savedQuotations);

    // Set new issue and due dates for the invoice
    const today = new Date().toISOString().split('T')[0];
    const newDueDate = new Date();
    // Assuming a default of 15 days for new invoices
    newDueDate.setDate(newDueDate.getDate() + 15);

    // Create the new invoice object from the quotation
    const newInvoice: SavedDocument = {
      ...quotation,
      id: Date.now(),
      documentType: DocumentType.Invoice,
      documentNumber: newInvoiceNumber,
      status: InvoiceStatus.Pending,
      quotationStatus: null, // Invoices don't have quotation status
      payments: [],
      issueDate: today,
      dueDate: newDueDate.toISOString().split('T')[0],
    };

    // Save the new invoice
    setSavedInvoices(prev => [newInvoice, ...prev]);

    // Update the original quotation's status to 'Agreed'
    setSavedQuotations(prev => 
      prev.map(q => 
        q.id === quotation.id 
          ? { ...q, quotationStatus: QuotationStatus.Agreed } 
          : q
      )
    );

    alert(`Invoice #${newInvoiceNumber} has been created successfully.`);
  };
  
  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (printArea) {
      try {
        const canvas = await html2canvas(printArea, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
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
          let position = 0;
          let remainingHeight = canvasHeight;
          while (remainingHeight > 0) {
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            // FIX: Replaced undefined variable `pageHeight` with `pdfHeight`.
            pageCanvas.height = Math.min(canvasHeight, canvasWidth * pdfHeight / pdfWidth);
            pageCanvas.getContext('2d')?.drawImage(canvas, 0, position, canvasWidth, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
            if (position > 0) pdf.addPage();
            pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
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
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };
  
  const handleSendQuotationReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    const message = `Dear ${doc.clientDetails.name},\n\nThis is a friendly follow-up on our quotation #${doc.documentNumber} for the amount of ${formatCurrency(doc.total)}. It is valid until ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\n\nPlease let us know if you have any questions.\n\nBest regards,\n${doc.companyDetails.name}`;
    if (channel === 'email') {
      const subject = `Quotation #${doc.documentNumber} from ${doc.companyDetails.name}`;
      window.location.href = `mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const navButtonClasses = "flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-md transition-colors text-sm font-medium";
  const activeNavButtonClasses = "bg-indigo-100 text-indigo-700";
  const inactiveNavButtonClasses = "text-slate-600 hover:bg-slate-200";

  const renderCurrentView = () => {
    switch(currentView) {
      case 'setup':
        return <SetupPage companies={companies} setCompanies={setCompanies} onDone={() => setCurrentView('editor')} activeCompanyId={activeCompanyId} setActiveCompanyId={setActiveCompanyId} />;
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
                      <button onClick={() => handleDocumentTypeChange(DocumentType.Quotation)} className={`flex-1 text-center font-semibold py-2 px-3 rounded-md transition-all duration-200 ${documentType === DocumentType.Quotation ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                          Quotation
                      </button>
                      <button onClick={() => handleDocumentTypeChange(DocumentType.Invoice)} className={`flex-1 text-center font-semibold py-2 px-3 rounded-md transition-all duration-200 ${documentType === DocumentType.Invoice ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                          Invoice
                      </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Client Information</h2>
                    <button 
                        onClick={handleClearClientDetails} 
                        type="button"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        Clear Fields
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Client Name</label>
                        <input 
                            type="text" 
                            value={clientDetails.name} 
                            onChange={e => handleClientDetailChange('name', e.target.value)} 
                            onFocus={() => setIsClientDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 200)}
                            placeholder="Search name, email, or phone..."
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            autoComplete="off"
                            disabled={!isCreatingNew}
                        />
                        {isClientDropdownOpen && isCreatingNew && (
                            <div className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                            {filteredSavedClients.length > 0 ? (
                                filteredSavedClients.map(client => (
                                <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => handleSavedClientSelected(client)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    <p className="font-semibold">{client.name}</p>
                                    <p className="text-xs text-slate-500">{client.email} {client.email && client.phone && '•'} {client.phone}</p>
                                </button>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-sm text-slate-500">
                                    {Array.isArray(clients) && clients.length > 0 ? "No clients match your search." : "No saved clients. Add some on the 'Clients' page!"}
                                </div>
                            )}
                            </div>
                        )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Address</label>
                      <input type="text" value={clientDetails.address} onChange={e => handleClientDetailChange('address', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Email</label>
                      <input type="email" value={clientDetails.email} onChange={e => handleClientDetailChange('email', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Phone</label>
                      <input type="tel" value={clientDetails.phone} onChange={e => handleClientDetailChange('phone', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Document Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">{documentType} Number</label>
                          <input 
                            type="text" 
                            value={documentNumber} 
                            onChange={e => setDocumentNumber(e.target.value)} 
                            placeholder={isCreatingNew ? "Auto-generated from client" : ""}
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            disabled={!isCreatingNew}
                          />
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
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Items</h2>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700">Add an Item</h3>
                        <button 
                            onClick={handleClearNewLineItem} 
                            type="button"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            Clear Fields
                        </button>
                    </div>
                    
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <textarea
                        rows={2}
                        placeholder="Start typing to search or add a new item..."
                        value={newLineItem.description}
                        onChange={e => handleNewLineItemChange('description', e.target.value)}
                        onFocus={() => setIsItemDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsItemDropdownOpen(false), 200)}
                        className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      {isItemDropdownOpen && (
                        <div className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                          {filteredSavedItems.length > 0 ? (
                            filteredSavedItems.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSavedItemSelected(item)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                              >
                                <p className="font-semibold">{item.description}</p>
                                <p className="text-xs text-slate-500">{formatCurrency(item.price)}</p>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-slate-500">
                                {Array.isArray(items) && items.length > 0 ? "No items match your search." : "No saved items. Add some on the 'Items' page!"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                            <input type="number" value={newLineItem.quantity} onChange={e => handleNewLineItemChange('quantity', parseFloat(e.target.value) || 1)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Price</label>
                            <input type="number" step="0.01" value={newLineItem.price} onChange={e => handleNewLineItemChange('price', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>
                    
                    <button onClick={handleAddLineItem} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                        <PlusIcon /> Add Item to Document
                    </button>
                  </div>

                  <div className="space-y-4">
                    {lineItems.map((item) => (
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
  }> = ({ onClick, isActive, title, children }) => (
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-20 h-[52px] flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">InvQuo AI</h1>
                <nav className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setCurrentView('editor')} className={`py-1 px-3 rounded-md transition-colors text-sm font-medium ${currentView === 'editor' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Editor</button>
                    <button onClick={() => setCurrentView('quotations')} className={`py-1 px-3 rounded-md transition-colors text-sm font-medium ${currentView === 'quotations' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Quotations</button>
                    <button onClick={() => setCurrentView('invoices')} className={`py-1 px-3 rounded-md transition-colors text-sm font-medium ${currentView === 'invoices' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Invoices</button>
                </nav>
            </div>
          </div>
        </div>
      </header>

       <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 grid grid-cols-6">
           <button onClick={() => setCurrentView('editor')} className={`${navButtonClasses} ${currentView === 'editor' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <FileTextIcon /><span className="text-xs">Editor</span>
           </button>
            <button onClick={() => setCurrentView('quotations')} className={`${navButtonClasses} ${currentView === 'quotations' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <DocumentIcon /><span className="text-xs">Quotes</span>
           </button>
           <button onClick={() => setCurrentView('invoices')} className={`${navButtonClasses} ${currentView === 'invoices' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <CashIcon /><span className="text-xs">Invoices</span>
           </button>
            <button onClick={() => setCurrentView('clients')} className={`${navButtonClasses} ${currentView === 'clients' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <UsersIcon /><span className="text-xs">Clients</span>
           </button>
           <button onClick={() => setCurrentView('items')} className={`${navButtonClasses} ${currentView === 'items' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <ListIcon /><span className="text-xs">Items</span>
           </button>
           <button onClick={() => setCurrentView('setup')} className={`${navButtonClasses} ${currentView === 'setup' ? activeNavButtonClasses : inactiveNavButtonClasses}`}>
               <CogIcon /><span className="text-xs">Setup</span>
           </button>
       </nav>

        <div className="hidden sm:block fixed top-0 left-0 h-full bg-white pt-[52px] z-10 shadow-lg">
             <nav className="flex flex-col p-2 space-y-1">
                 <DesktopSidebarButton onClick={() => setCurrentView('clients')} isActive={currentView === 'clients'} title="Clients"><UsersIcon /></DesktopSidebarButton>
                 <DesktopSidebarButton onClick={() => setCurrentView('items')} isActive={currentView === 'items'} title="Items"><ListIcon /></DesktopSidebarButton>
                 <DesktopSidebarButton onClick={() => setCurrentView('setup')} isActive={currentView === 'setup'} title="Setup"><CogIcon /></DesktopSidebarButton>
             </nav>
        </div>
        
        <div className="sm:pl-16 pb-16 sm:pb-0">
          {renderCurrentView()}
        </div>

        {isSaveItemsModalOpen && (
            <SaveItemsModal
                isOpen={isSaveItemsModalOpen}
                newItems={potentialNewItems}
                onConfirm={handleConfirmSaveNewItems}
                onDecline={handleDeclineSaveNewItems}
                onCancel={handleCancelSaveNewItems}
            />
        )}
        {isSaveClientModalOpen && potentialNewClient && (
            <SaveClientModal
                isOpen={isSaveClientModalOpen}
                newClient={potentialNewClient}
                onConfirm={handleConfirmSaveNewClient}
                onDecline={handleDeclineSaveNewClient}
                onCancel={handleCancelSaveNewClient}
            />
        )}
        {isUpdateClientModalOpen && clientUpdateInfo && (
            <UpdateClientModal
                isOpen={isUpdateClientModalOpen}
                clientInfo={clientUpdateInfo}
                onConfirm={handleConfirmUpdateClient}
                onDecline={handleDeclineUpdateClient}
                onCancel={handleCancelUpdateClient}
            />
        )}
    </div>
  );
};

export default App;
