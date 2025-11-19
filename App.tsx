
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DocumentType, LineItem, Details, Client, Item, SavedDocument, InvoiceStatus, Company, Payment, QuotationStatus, Recurrence } from './types';
import { generateDescription } from './services/geminiService';
import { fetchUserData, saveCompanies, saveClients, saveItems, saveInvoices, saveQuotations, saveDocument, saveActiveCompanyId, saveItemCategories, defaultUserData } from './services/firebaseService';
import { SparklesIcon, PlusIcon, TrashIcon, CogIcon, UsersIcon, ListIcon, DocumentIcon, MailIcon, WhatsAppIcon, FileTextIcon, DownloadIcon, MoreVerticalIcon, PrinterIcon, ChevronDownIcon, CashIcon, SendIcon, RefreshIcon } from './components/Icons';
import DocumentPreview from './components/DocumentPreview';
import SetupPage from './components/SetupPage';
import ClientListPage from './components/ClientListPage';
import ItemListPage from './components/ItemListPage';
import DocumentListPage from './components/DocumentListPage';
import QuotationListPage from './components/QuotationListPage';
import SaveItemsModal from './components/SaveItemsModal';
import SaveClientModal from './components/SaveClientModal';
import ShareDocumentModal from './components/ShareDocumentModal';
import CustomerResponsePage from './components/CustomerResponsePage';
import LoginPage from './components/LoginPage';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';


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

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
};

const App: React.FC = () => {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 640;
  
  // --- States ---
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setCurrentView] = useState<'editor' | 'setup' | 'clients' | 'items' | 'invoices' | 'quotations'>('editor');
  const [isResponseMode, setIsResponseMode] = useState(false);
  
  // --- Auth States ---
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Refs for PDF/Print ---
  const previewContainerRef = React.useRef<HTMLDivElement>(null);
  const previewScrollerRef = React.useRef<HTMLDivElement>(null);


  // --- Data States (from Firestore) ---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [savedInvoices, setSavedInvoices] = useState<SavedDocument[]>([]);
  const [savedQuotations, setSavedQuotations] = useState<SavedDocument[]>([]);
  
  // --- Authentication and Data loading ---
  useEffect(() => {
    // Check for response mode URL params first
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'respond') {
      setIsResponseMode(true);
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = useCallback(async (uid: string) => {
    const userData = await fetchUserData(uid);
    setCompanies(userData.companies);
    setClients(userData.clients);
    setItems(userData.items);
    setItemCategories(userData.itemCategories || []);
    setSavedInvoices(userData.savedInvoices);
    setSavedQuotations(userData.savedQuotations);
    setActiveCompanyId(userData.activeCompanyId);
  }, []);

  const handleRefresh = async () => {
      if (!firebaseUser) return;
      setIsRefreshing(true);
      await loadUserData(firebaseUser.uid);
      setIsRefreshing(false);
  };

  useEffect(() => {
    if (firebaseUser) {
      loadUserData(firebaseUser.uid);
    } else {
      // Clear data on logout
      setCompanies([]);
      setClients([]);
      setItems([]);
      setItemCategories([]);
      setSavedInvoices([]);
      setSavedQuotations([]);
      setActiveCompanyId(1);
    }
  }, [firebaseUser, loadUserData]);
  
  useEffect(() => {
      if (firebaseUser) {
        saveItemCategories(itemCategories);
      }
  }, [itemCategories, firebaseUser]);

  const handleLogout = () => {
    signOut(auth);
  };

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

      // Shorten the client name part to the first 6 alphanumeric characters, uppercase
      const clientNamePart = clientNameTrimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
      
      // Ensure phone part is digits only, fallback to '0000'
      const phoneDigits = client.phone ? client.phone.replace(/\D/g, '') : '';
      const phonePart = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : phoneDigits.padEnd(4, '0');
      
      const docTypePart = docType === DocumentType.Quotation ? 'QUO' : 'INV';
      
      // Use 'CLI' as fallback if name has no alphanumeric characters
      const prefix = `${clientNamePart || 'CLI'}_${phonePart}_${docTypePart}_`;

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
  
  const [companyDetails, setCompanyDetails] = useState<Details>({ name: '', address: '', email: '', phone: '' });
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [bankQRCode, setBankQRCode] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState('');
  const [template, setTemplate] = useState('classic');
  const [accentColor, setAccentColor] = useState('#4f46e5');
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
  const [loadedDocumentInfo, setLoadedDocumentInfo] = useState<{ id: number; status: InvoiceStatus | QuotationStatus | null; docType: DocumentType, recurrenceParentId?: number | null } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [isSaveItemsModalOpen, setIsSaveItemsModalOpen] = useState(false);
  const [potentialNewItems, setPotentialNewItems] = useState<LineItem[]>([]);
  const [pendingDoc, setPendingDoc] = useState<SavedDocument | null>(null);
  const [isSaveClientModalOpen, setIsSaveClientModalOpen] = useState(false);
  const [potentialNewClient, setPotentialNewClient] = useState<Details | null>(null);
  const [newLineItem, setNewLineItem] = useState<Omit<LineItem, 'id'>>({ name: '', description: '', quantity: isMobile ? 0 : 1, costPrice: 0, markup: 0, price: 0 });
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);
  const [clientUpdateInfo, setClientUpdateInfo] = useState<{ original: Client; updated: Details } | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Derived state for Read Only (Fully Paid Invoice or Linked Quote)
  const isReadOnly = useMemo(() => {
      if (loadedDocumentInfo?.docType === DocumentType.Invoice) {
          return loadedDocumentInfo?.status === InvoiceStatus.Paid;
      }
      if (loadedDocumentInfo?.docType === DocumentType.Quotation) {
          // Find the actual quotation object to get the relatedDocumentId
          const quote = savedQuotations.find(q => q.id === loadedDocumentInfo.id);
          if (quote && quote.relatedDocumentId) {
              const linkedInvoice = savedInvoices.find(inv => inv.id === quote.relatedDocumentId);
              // If the linked invoice is fully paid, the quote is read-only
              if (linkedInvoice && linkedInvoice.status === InvoiceStatus.Paid) {
                  return true;
              }
          }
      }
      return false;
  }, [loadedDocumentInfo, savedQuotations, savedInvoices]);

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
    if (activeCompanyId && firebaseUser) {
        saveActiveCompanyId(activeCompanyId);
    }
  }, [activeCompanyId, firebaseUser]);

  useEffect(() => {
    if (isCreatingNew) {
      setDocumentNumber(generateDocumentNumber(clientDetails, documentType, savedInvoices, savedQuotations));
    }
  }, [isCreatingNew, clientDetails, documentType, savedInvoices, savedQuotations, generateDocumentNumber]);

  // --- Recurring Invoice Generation ---
  const recurringChecked = React.useRef(false);
  useEffect(() => {
    if (!firebaseUser || recurringChecked.current || savedInvoices.length === 0) return;
    recurringChecked.current = true;

    const calculateNextIssueDate = (lastDateStr: string, rec: Recurrence): Date => {
      const lastDate = new Date(lastDateStr + 'T00:00:00');
      const { frequency, interval } = rec;
      switch (frequency) {
        case 'daily': lastDate.setDate(lastDate.getDate() + interval); break;
        case 'weekly': lastDate.setDate(lastDate.getDate() + interval * 7); break;
        case 'monthly': lastDate.setMonth(lastDate.getMonth() + interval); break;
        case 'yearly': lastDate.setFullYear(lastDate.getFullYear() + interval); break;
      }
      return lastDate;
    };

    const parentInvoices = savedInvoices.filter(inv => inv.recurrence && !inv.recurrenceParentId);
    let newInvoicesToGenerate: SavedDocument[] = [];
    let allInvoices = [...savedInvoices]; // Use a temporary list for number generation

    parentInvoices.forEach(parent => {
      const seriesInvoices = allInvoices.filter(inv => inv.recurrenceParentId === parent.id);
      const allSeries = [parent, ...seriesInvoices];
      const latestInvoice = allSeries.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0];
      
      let nextIssueDate = calculateNextIssueDate(latestInvoice.issueDate, parent.recurrence!);
      
      while (nextIssueDate <= new Date() && (!parent.recurrence!.endDate || nextIssueDate <= new Date(parent.recurrence!.endDate))) {
        const issueDateObj = new Date(parent.issueDate + 'T00:00:00');
        const dueDateObj = new Date(parent.dueDate + 'T00:00:00');
        const duration = dueDateObj.getTime() - issueDateObj.getTime();
        const newDueDate = new Date(nextIssueDate.getTime() + duration);

        const newInvoice: SavedDocument = {
          ...parent,
          id: Date.now() + Math.random(),
          issueDate: nextIssueDate.toISOString().split('T')[0],
          dueDate: newDueDate.toISOString().split('T')[0],
          documentNumber: generateDocumentNumber(parent.clientDetails, DocumentType.Invoice, allInvoices, savedQuotations),
          status: InvoiceStatus.Pending,
          payments: [],
          paidDate: null,
          recurrence: null,
          recurrenceParentId: parent.id,
        };
        
        newInvoicesToGenerate.push(newInvoice);
        allInvoices.push(newInvoice); // Add to temp list for next number generation
        
        nextIssueDate = calculateNextIssueDate(newInvoice.issueDate, parent.recurrence!);
      }
    });

    if (newInvoicesToGenerate.length > 0) {
      setSavedInvoices(allInvoices);
      saveInvoices(allInvoices);
      alert(`Generated ${newInvoicesToGenerate.length} new recurring invoice(s).`);
    }
  }, [savedInvoices, savedQuotations, generateDocumentNumber, firebaseUser]);

  // --- Calculations ---
  const subtotal = useMemo(() => lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0), [lineItems]);
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);
  const formatCurrency = useCallback((amount: number) => `${activeCompany?.currency || '$'} ${amount.toFixed(2)}`, [activeCompany]);

  // --- Handlers ---
  const handleLineItemChange = (id: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev =>
        prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item };
                const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

                if (['costPrice', 'markup', 'price', 'quantity'].includes(field)) {
                    (updatedItem as any)[field] = numericValue;
                } else {
                    (updatedItem as any)[field] = value;
                }

                if (field === 'costPrice') {
                    const price = numericValue * (1 + updatedItem.markup / 100);
                    updatedItem.price = parseFloat(price.toFixed(2));
                } else if (field === 'markup') {
                    const price = updatedItem.costPrice * (1 + numericValue / 100);
                    updatedItem.price = parseFloat(price.toFixed(2));
                } else if (field === 'price') {
                    const markup = updatedItem.costPrice > 0 ? ((numericValue / updatedItem.costPrice) - 1) * 100 : 0;
                    updatedItem.markup = parseFloat(markup.toFixed(2));
                }
                
                return updatedItem;
            }
            return item;
        })
    );
  };

  const handleAddLineItem = () => {
    if (!newLineItem.name.trim() || newLineItem.price < 0 || newLineItem.quantity <= 0) {
        alert('Please provide a valid item name, quantity, and price for the item.');
        return;
    }
    setLineItems(prev => [...prev, { id: Date.now(), ...newLineItem }]);
    setNewLineItem({ name: '', description: '', quantity: isMobile ? 0 : 1, costPrice: 0, markup: 0, price: 0 });
  };

  const handleDeleteLineItem = (id: number) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleGenerateDescription = async (id: number, itemName: string, currentDescription: string) => {
    setGeneratingStates(prev => ({ ...prev, [id]: true }));
    try {
      const newDescription = await generateDescription(itemName); // Pass item name to AI
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
    setNewLineItem({ name: '', description: '', quantity: isMobile ? 0 : 1, costPrice: 0, markup: 0, price: 0 });
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
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    setNewLineItem(prev => {
        const updatedItem = { ...prev };

        if (['costPrice', 'markup', 'price', 'quantity'].includes(field)) {
            (updatedItem as any)[field] = numericValue;
        } else {
            (updatedItem as any)[field] = value;
        }

        if (field === 'costPrice') {
            const price = numericValue * (1 + updatedItem.markup / 100);
            updatedItem.price = parseFloat(price.toFixed(2));
        } else if (field === 'markup') {
            const price = updatedItem.costPrice * (1 + numericValue / 100);
            updatedItem.price = parseFloat(price.toFixed(2));
        } else if (field === 'price') {
            const markup = updatedItem.costPrice > 0 ? ((numericValue / updatedItem.costPrice) - 1) * 100 : 0;
            updatedItem.markup = parseFloat(markup.toFixed(2));
        }
        
        return updatedItem;
    });

    if (field === 'name') {
        setIsItemDropdownOpen(true);
    }
  };
  
  const handleSavedItemSelected = (item: Item) => {
    const costPrice = item.costPrice || 0;
    const price = item.price || 0;
    const markup = costPrice > 0 ? ((price / costPrice) - 1) * 100 : 0;
    
    setNewLineItem({
      name: item.name,
      description: item.description,
      quantity: isMobile ? 0 : 1,
      costPrice: costPrice,
      markup: parseFloat(markup.toFixed(2)),
      price: price
    });
    setIsItemDropdownOpen(false);
  };

  const handleDocumentTypeChange = (newType: DocumentType) => {
    if (newType === documentType) return;
    setDocumentType(newType);
    if (newType === DocumentType.Quotation) {
      setRecurrence(null); // Clear recurrence when switching to quotation
    }
  };
  
  const filteredSavedItems = useMemo(() => {
    if (!isItemDropdownOpen || !Array.isArray(items)) return [];
    const searchTerm = newLineItem.name.trim().toLowerCase(); // Filter by item name
    if (!searchTerm) return items;
    return items.filter(item => item.name.toLowerCase().includes(searchTerm));
  }, [items, newLineItem.name, isItemDropdownOpen]);

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

  const saveDocumentAndState = (docToSave: SavedDocument) => {
      setIsSaving(true);
      if (docToSave.documentType === DocumentType.Invoice) {
          saveDocument('savedInvoices', docToSave);
          const existing = savedInvoices.find(inv => inv.id === docToSave.id);
          if (existing) {
              setSavedInvoices(prev => prev.map(inv => inv.id === docToSave.id ? docToSave : inv));
          } else {
              setSavedInvoices(prev => [docToSave, ...prev]);
          }
      } else {
          saveDocument('savedQuotations', docToSave);
          const existing = savedQuotations.find(q => q.id === docToSave.id);
          if (existing) {
              setSavedQuotations(prev => prev.map(q => q.id === docToSave.id ? docToSave : q));
          } else {
              setSavedQuotations(prev => [docToSave, ...prev]);
          }
      }
      
      // Update the loaded document info so share functions have access to the ID immediately
      setLoadedDocumentInfo({
        id: docToSave.id, 
        status: docToSave.status || docToSave.quotationStatus || null, 
        docType: docToSave.documentType, 
        recurrenceParentId: docToSave.recurrenceParentId
      });
      setIsCreatingNew(false);
      
      setIsSaving(false);
      setIsShareModalOpen(true);
  };

  const checkNewItemsAndSave = (docToSave: SavedDocument) => {
    const savedItemNames = new Set(items.map(i => i.name.trim().toLowerCase())); // Check by item name
    const newItemsInDoc = docToSave.lineItems.filter(li => li.name.trim() && !savedItemNames.has(li.name.trim().toLowerCase())); // Filter by item name
    if (newItemsInDoc.length > 0) {
        setPotentialNewItems(newItemsInDoc);
        setPendingDoc(docToSave);
        setIsSaveItemsModalOpen(true);
    } else {
        saveDocumentAndState(docToSave);
        setPendingDoc(null);
    }
  };

  const handleSaveDocument = () => {
    if (isReadOnly) return;

    if (!clientDetails.name || lineItems.length === 0) {
        alert('Please fill in client details and add at least one item to save.');
        return;
    }
    
    let finalDocNum = documentNumber.trim();
    
    // If number is empty, try to regenerate
    if (!finalDocNum) {
         const newNum = generateDocumentNumber(clientDetails, documentType, savedInvoices, savedQuotations);
         if (newNum) {
             finalDocNum = newNum;
             setDocumentNumber(newNum);
         } else {
            alert('Document number cannot be empty. Please ensure client details are filled to generate a number.');
            return;
         }
    }

    const allDocs = [...savedInvoices, ...savedQuotations];
    const potentialDuplicate = allDocs.find(
        doc => doc.documentNumber.trim().toLowerCase() === finalDocNum.toLowerCase()
    );

    if (potentialDuplicate && potentialDuplicate.id !== loadedDocumentInfo?.id) {
        alert(`A document (invoice or quotation) with number "${finalDocNum}" already exists. Please use a unique number.`);
        return;
    }

    // Determine status
    let invoiceStatus: InvoiceStatus | null = null;
    let quotationStatus: QuotationStatus | null = null;

    if (documentType === DocumentType.Invoice) {
        const current = loadedDocumentInfo?.status as InvoiceStatus;
        if (!current) {
            invoiceStatus = InvoiceStatus.Pending;
        } else {
            invoiceStatus = current;
        }
    } else {
        const current = loadedDocumentInfo?.status as QuotationStatus;
        if (!current) {
            quotationStatus = QuotationStatus.Active;
        } else {
            quotationStatus = current;
        }
    }
    
    // Preserve relatedDocumentId if editing an existing document
    let relatedDocId = null;
    if (!isCreatingNew && loadedDocumentInfo && loadedDocumentInfo.docType === documentType) {
         const originalDoc = documentType === DocumentType.Invoice 
            ? savedInvoices.find(d => d.id === loadedDocumentInfo.id) 
            : savedQuotations.find(d => d.id === loadedDocumentInfo.id);
        relatedDocId = originalDoc?.relatedDocumentId || null;
    }

    const docToSave: SavedDocument = {
      id: loadedDocumentInfo?.id || Date.now(),
      documentNumber: finalDocNum,
      documentType, clientDetails, companyDetails, companyLogo, bankQRCode, issueDate, dueDate,
      lineItems, notes, taxRate, currency, total, template, accentColor,
      status: invoiceStatus,
      quotationStatus: quotationStatus,
      payments: documentType === DocumentType.Invoice ? payments : [],
      recurrence: documentType === DocumentType.Invoice ? recurrence : null,
      recurrenceParentId: loadedDocumentInfo?.docType === DocumentType.Invoice ? loadedDocumentInfo.recurrenceParentId : null,
      relatedDocumentId: relatedDocId
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
      const newClients = clients.map(c => 
        c.id === clientUpdateInfo.original.id 
          ? { ...c, name: clientUpdateInfo.updated.name, address: clientUpdateInfo.updated.address, email: clientUpdateInfo.updated.email, phone: clientUpdateInfo.updated.phone } 
          : c
      );
      saveClients(newClients);
      setClients(newClients);
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
        const newClients = [{ id: Date.now(), ...potentialNewClient }, ...clients];
        saveClients(newClients);
        setClients(newClients);
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
        const itemsToAdd: Item[] = potentialNewItems.map((li, index) => ({
            id: Date.now() + index,
            name: li.name, // Save item name
            description: li.description, // Save item description
            costPrice: li.costPrice,
            price: li.price,
            category: ''
        }));
        const newItems = [...items, ...itemsToAdd];
        saveItems(newItems);
        setItems(newItems);
    }
    if (pendingDoc) saveDocumentAndState(pendingDoc);
    setIsSaveItemsModalOpen(false);
    setPotentialNewItems([]);
    setPendingDoc(null);
  };

  const handleDeclineSaveNewItems = () => {
    if (pendingDoc) saveDocumentAndState(pendingDoc);
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
    setRecurrence(null);
    const today = new Date().toISOString().split('T')[0];
    setIssueDate(today);
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 15);
    setDueDate(newDueDate.toISOString().split('T')[0]);
    setDueDateOption('15days');
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
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    handleCreateNew();
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
      setRecurrence(doc.recurrence || null);
      setLoadedDocumentInfo({id: doc.id, status: doc.status || doc.quotationStatus || null, docType: doc.documentType, recurrenceParentId: doc.recurrenceParentId});
      setIsCreatingNew(false);
      setCurrentView('editor');
  };

  const handleCreateInvoiceFromQuote = (quotation: SavedDocument) => {
    setIsSaving(true);
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
      relatedDocumentId: quotation.id // Link back to the quotation
    };

    // Save the new invoice
    saveDocument('savedInvoices', newInvoice);
    setSavedInvoices(prev => [newInvoice, ...prev]);

    // Update the original quotation's status to 'Agreed' and link to the invoice
    const updatedQuotation = { 
        ...quotation, 
        quotationStatus: QuotationStatus.Agreed,
        relatedDocumentId: newInvoice.id // Link forward to the invoice
    };
    saveDocument('savedQuotations', updatedQuotation);
    setSavedQuotations(prev => prev.map(q => q.id === quotation.id ? updatedQuotation : q));
    
    setIsSaving(false);
    alert(`Invoice #${newInvoiceNumber} has been created successfully.`);
  };
  
  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    
    if (!printArea) {
        alert("Preview element not found. Cannot generate PDF.");
        return;
    }

    setIsSaving(true); // Show loading state

    try {
        // --- HIGH-FIDELITY PDF GENERATION ---
        // We use a cloning technique to render the PDF from a clean, specific layout container
        // This avoids issues with screen-specific styles (scrollbars, sticky positioning, etc.)
        
        const a4WidthPx = 794; // Standard A4 width at 96DPI
        
        // Create an off-screen container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = `${a4WidthPx}px`;
        container.style.backgroundColor = '#ffffff';
        document.body.appendChild(container);

        // Clone the print area
        const clone = printArea.cloneNode(true) as HTMLElement;
        
        // Force specific styles on the clone to ensure it renders correctly for print
        clone.style.width = '100%';
        clone.style.height = 'auto';
        clone.style.overflow = 'visible';
        clone.style.maxHeight = 'none';
        clone.style.transform = 'none'; // Reset any transforms
        
        container.appendChild(clone);

        // Small delay to allow DOM to settle (images, fonts, etc.)
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(clone, { 
            scale: 2, // Higher scale for better resolution
            useCORS: true,
            logging: false,
            windowWidth: a4WidthPx,
            width: a4WidthPx
        });
        
        // Cleanup
        document.body.removeChild(container);
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = position - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${documentType}_${documentNumber}.pdf`);

    } catch (error) {
        console.error("Error generating rich PDF, falling back to simple text PDF:", error);
        
        try {
            // --- FALLBACK: SIMPLE TEXT-BASED PDF ---
            const doc = new jspdf.jsPDF();
            
            doc.setFontSize(20);
            doc.text(documentType.toUpperCase(), 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Number: ${documentNumber}`, 20, 30);
            doc.text(`Date: ${new Date(issueDate + 'T00:00:00').toLocaleDateString()}`, 20, 40);
            doc.text(`${documentType === DocumentType.Invoice ? 'Due' : 'Valid'}: ${new Date(dueDate + 'T00:00:00').toLocaleDateString()}`, 20, 50);
            
            doc.text(`From:`, 20, 70);
            doc.setFontSize(10);
            doc.text(companyDetails.name, 20, 76);
            // Assuming address/email might be multiline or long, but basic fallback text is okay
            
            doc.setFontSize(12);
            doc.text(`To:`, 120, 70);
            doc.setFontSize(10);
            doc.text(clientDetails.name, 120, 76);
            
            let y = 100;
            doc.setFontSize(12);
            doc.text("Items:", 20, y);
            y += 10;
            
            lineItems.forEach((item: LineItem) => {
                doc.setFontSize(10);
                const itemText = `${item.name} (x${item.quantity})`;
                const priceText = formatCurrency(item.price * item.quantity);
                doc.text(itemText, 20, y);
                doc.text(priceText, 150, y);
                y += 7;
                if (item.description) {
                     doc.setFontSize(8);
                     doc.setTextColor(100); // Gray color for description
                     const descLines = doc.splitTextToSize(item.description, 100); // Wrap text
                     doc.text(descLines, 20, y);
                     doc.setTextColor(0); // Reset color
                     y += (descLines.length * 4) + 4; 
                } else {
                    y += 3; 
                }
                
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
            
            y += 10;
            doc.setFontSize(14);
            doc.text(`Total: ${formatCurrency(total)}`, 120, y);
            
            doc.save(`${documentType}_${documentNumber}_simple.pdf`);
            alert("A standard PDF could not be generated due to a system limitation. A simplified version has been downloaded instead.");
            
        } catch (fallbackError) {
            console.error("Fallback PDF generation failed:", fallbackError);
            alert("Could not generate PDF. Please try the 'Print' option and save as PDF.");
        }
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleSendViaEmail = () => {
    if (!clientDetails.email) {
      alert("Client email is missing.");
      return;
    }
    
    const dateIssued = new Date(issueDate + 'T00:00:00').toLocaleDateString();
    const dateDue = new Date(dueDate + 'T00:00:00').toLocaleDateString();
    
    let docText = `${documentType.toUpperCase()} #${documentNumber}\n`;
    docText += `From: ${companyDetails.name}\n`;
    docText += `To: ${clientDetails.name}\n\n`;
    docText += `Date: ${dateIssued}\n`;
    docText += `${documentType === DocumentType.Invoice ? 'Due Date' : 'Valid Until'}: ${dateDue}\n\n`;
    
    docText += `ITEMS:\n`;
    lineItems.forEach((item, index) => {
        docText += `${index + 1}. ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    docText += `\n`;
    
    docText += `Subtotal: ${formatCurrency(subtotal)}\n`;
    if (taxRate > 0) {
        docText += `Tax (${taxRate}%): ${formatCurrency(taxAmount)}\n`;
    }
    docText += `TOTAL: ${formatCurrency(total)}\n\n`;
    
    if (companyDetails.bankName || companyDetails.accountNumber) {
        docText += `PAYMENT DETAILS:\n`;
        if (companyDetails.bankName) docText += `Bank: ${companyDetails.bankName}\n`;
        if (companyDetails.accountNumber) docText += `Account: ${companyDetails.accountNumber}\n`;
        docText += `\n`;
    }

    const subject = `${documentType} #${documentNumber} from ${companyDetails.name}`;
    let body = `Dear ${clientDetails.name},\n\nHere are the details for your ${documentType.toLowerCase()}:\n\n${docText}`;
    
    if (documentType === DocumentType.Quotation && loadedDocumentInfo?.id && firebaseUser?.uid) {
        const link = `${window.location.origin}?view=respond&uid=${firebaseUser.uid}&id=${loadedDocumentInfo.id}`;
        body += `Do you agree with the quotation provided? Please click the link below to respond:\n\n${link}\n\n`;
    } else if (documentType === DocumentType.Quotation) {
         body += `If you agree with this quotation, please reply to this email stating: "Yes, I agree to the quotation offer provided."\n\n`;
    }

    body += `Thank you for your business.\n\nBest regards,\n${companyDetails.name}`;
    
    const mailtoLink = `mailto:${clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };
  
  const handleSendViaWhatsApp = () => {
    const dateIssued = new Date(issueDate + 'T00:00:00').toLocaleDateString();
    const dateDue = new Date(dueDate + 'T00:00:00').toLocaleDateString();

    let text = `*${documentType.toUpperCase()} #${documentNumber}*\n`;
    text += `From: *${companyDetails.name}*\n`;
    text += `To: ${clientDetails.name}\n\n`;
    
    text += `Date: ${dateIssued}\n`;
    text += `${documentType === DocumentType.Invoice ? 'Due Date' : 'Valid Until'}: ${dateDue}\n\n`;
    
    text += `*ITEMS:*\n`;
    lineItems.forEach((item, index) => {
        text += `${index + 1}. ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    text += `\n`;
    
    text += `Subtotal: ${formatCurrency(subtotal)}\n`;
    if (taxRate > 0) {
        text += `Tax (${taxRate}%): ${formatCurrency(taxAmount)}\n`;
    }
    text += `*TOTAL: ${formatCurrency(total)}*\n\n`;
    
    if (companyDetails.bankName || companyDetails.accountNumber) {
        text += `*Payment Details:*\n`;
        if (companyDetails.bankName) text += `Bank: ${companyDetails.bankName}\n`;
        if (companyDetails.accountNumber) text += `Account: ${companyDetails.accountNumber}\n`;
        text += `\n`;
    }

    if (documentType === DocumentType.Quotation && loadedDocumentInfo?.id && firebaseUser?.uid) {
        const link = `${window.location.origin}?view=respond&uid=${firebaseUser.uid}&id=${loadedDocumentInfo.id}`;
        text += `Do you agree with the quotation provided? Please click the link below to respond:\n${link}\n\n`;
    } else if (documentType === DocumentType.Quotation) {
        text += `If you agree with this quotation, please reply to this message stating: "Yes, I agree to the quotation offer provided."\n\n`;
    }
    
    text += `Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // FIX: Define handleSendReminder function for invoices
  const handleSendReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    if (channel === 'email' && !doc.clientDetails.email) {
      alert("Client email is missing for this document.");
      return;
    }
  
    const amountPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    let balanceDue = doc.total - amountPaid;
    if (doc.status === InvoiceStatus.Paid || balanceDue < 0.01) {
      balanceDue = 0;
    }

    // Build Payment History Text
    let paymentHistoryText = '';
    if (doc.payments && doc.payments.length > 0) {
        doc.payments.forEach(p => {
            const dateStr = new Date(p.date).toLocaleDateString();
            paymentHistoryText += `- ${dateStr} (${p.method}): ${formatCurrency(p.amount)}\n`;
        });
    } else {
        paymentHistoryText = "No payments recorded.";
    }
  
    const subject = `Reminder: Invoice #${doc.documentNumber} from ${doc.companyDetails.name}`;
    const emailBody = `Dear ${doc.clientDetails.name},\n\n` +
        `This is a friendly reminder regarding invoice #${doc.documentNumber}, which was due on ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\n\n` +
        `Invoice Summary:\n` +
        `Total Amount: ${formatCurrency(doc.total)}\n` +
        `Amount Paid: ${formatCurrency(amountPaid)}\n` +
        `Balance Due: ${formatCurrency(balanceDue)}\n\n` +
        `Payment History:\n${paymentHistoryText}\n\n` +
        `Please let us know if you have any questions.\n\n` +
        `Best regards,\n${doc.companyDetails.name}`;
    
    const whatsappMessage = `Hello ${doc.clientDetails.name},\n\n` +
        `This is a friendly reminder regarding invoice #${doc.documentNumber}.\n` + 
        `Total Amount: ${formatCurrency(doc.total)}\n` +
        `Amount Paid: ${formatCurrency(amountPaid)}\n` +
        `*Balance Due: ${formatCurrency(balanceDue)}*\n\n` +
        `Payment History:\n${paymentHistoryText}\n\n` +
        `Thank you,\n${doc.companyDetails.name}`;
  
    if (channel === 'email') {
      const mailtoLink = `mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    }
  };

  // FIX: Define handleSendQuotationReminder function for quotations
  const handleSendQuotationReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    if (channel === 'email' && !doc.clientDetails.email) {
      alert("Client email is missing for this document.");
      return;
    }
  
    const subject = `Reminder: Quotation #${doc.documentNumber} from ${doc.companyDetails.name}`;
    let emailBody = `Dear ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding quotation #${doc.documentNumber}, which is valid until ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\n\nThe total amount is ${formatCurrency(doc.total)}.\n\n`;
    
    if (firebaseUser?.uid) {
        const link = `${window.location.origin}?view=respond&uid=${firebaseUser.uid}&id=${doc.id}`;
        emailBody += `Do you agree with the quotation provided? Please click the link below to respond:\n${link}\n\n`;
    }

    emailBody += `Please let us know if you have any questions or would like to proceed.\n\nBest regards,\n${doc.companyDetails.name}`;

    let whatsappMessage = `Hello ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding quotation #${doc.documentNumber}, valid until ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\nThe total amount is ${formatCurrency(doc.total)}.\n\n`;
    
    if (firebaseUser?.uid) {
        const link = `${window.location.origin}?view=respond&uid=${firebaseUser.uid}&id=${doc.id}`;
        whatsappMessage += `Do you agree with the quotation provided? Please click the link below to respond:\n${link}\n\n`;
    }

    whatsappMessage += `Please let us know if you have any questions.\n\nThank you,\n${doc.companyDetails.name}`;
  
    if (channel === 'email') {
      const mailtoLink = `mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    }
  };

  const navButtonClasses = "flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-md transition-colors text-sm font-medium";
  const activeNavButtonClasses = "bg-indigo-100 text-indigo-700";
  const inactiveNavButtonClasses = "text-slate-600 hover:bg-slate-200";

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isResponseMode) {
    return <CustomerResponsePage />;
  }

  if (!firebaseUser) {
    return <LoginPage />;
  }
  
  // Helper to truncate email for mobile display
  const truncateEmail = (email: string | null | undefined, maxLength: number) => {
    if (!email) return '';
    if (email.length <= maxLength) return email;
    return email.substring(0, maxLength - 3) + '...';
  };


  const renderCurrentView = () => {
    switch(currentView) {
      case 'setup':
        return <SetupPage
            user={firebaseUser}
            companies={companies}
            setCompanies={setCompanies}
            onDone={() => setCurrentView('editor')}
            activeCompanyId={activeCompanyId}
            setActiveCompanyId={setActiveCompanyId}
            setClients={setClients} // Passed for reset app
            setItems={setItems} // Passed for reset app
            setItemCategories={setItemCategories} // Passed for reset app
            setSavedInvoices={setSavedInvoices} // Passed for reset app
            setSavedQuotations={setSavedQuotations} // Passed for reset app
            defaultUserData={defaultUserData} // Passed for reset app
            />;
      case 'clients':
        return <ClientListPage
            clients={clients}
            setClients={setClients}
            onDone={() => setCurrentView('editor')} />;
      case 'items':
        return <ItemListPage
            items={items}
            setItems={setItems}
            categories={itemCategories}
            setCategories={setItemCategories}
            formatCurrency={formatCurrency}
            onDone={() => setCurrentView('editor')} />;
      case 'invoices':
        return <DocumentListPage
            documents={savedInvoices}
            setDocuments={setSavedInvoices}
            formatCurrency={formatCurrency}
            handleSendReminder={handleSendReminder}
            handleLoadDocument={handleLoadDocument} />;
      case 'quotations':
        return <QuotationListPage
            documents={savedQuotations}
            setDocuments={setSavedQuotations}
            invoices={savedInvoices} // Passed savedInvoices here
            formatCurrency={formatCurrency}
            handleCreateInvoiceFromQuote={handleCreateInvoiceFromQuote}
            handleLoadDocument={handleLoadDocument}
            handleSendQuotationReminder={handleSendQuotationReminder} />;
      case 'editor':
      default:
        const inputType = isMobile ? 'text' : 'number';
        const inputMode = isMobile ? 'decimal' : undefined;
        return (
          <>
            <div className="sticky top-[68px] bg-gray-100/80 backdrop-blur-sm z-10 border-b no-print">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-2">
                        {/* Status text */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-slate-600 truncate">
                              {isCreatingNew ? 'Creating New Document' : `Editing ${loadedDocumentInfo?.docType}`}
                              <span className="hidden sm:inline">
                                {!isCreatingNew && ` #${documentNumber}`}
                              </span>
                            </span>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <button onClick={handleCreateNew} className="flex items-center gap-1.5 bg-white text-slate-700 font-semibold py-2 px-3 rounded-lg shadow-sm border hover:bg-slate-100 text-sm">
                                <PlusIcon /> New
                            </button>
                            <button onClick={() => handleSaveDocument()} disabled={isSaving || isReadOnly} className={`${isReadOnly ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}>
                                {isSaving && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {isSaving ? 'Saving...' : (isReadOnly ? 'Read Only' : 'Save')}
                            </button>
                        </div>
                    </div>
                     {/* Document Number on Mobile */}
                    {!isCreatingNew && (
                      <div className="sm:hidden pb-2">
                        <span className="text-xs text-slate-500 truncate">
                          #{documentNumber}
                        </span>
                      </div>
                    )}
                    {isReadOnly && (
                      <div className="w-full bg-green-50 border-l-4 border-green-500 p-2 mb-2 text-xs sm:text-sm text-green-700">
                        {loadedDocumentInfo?.docType === DocumentType.Invoice
                          ? "This invoice is fully paid and cannot be edited."
                          : "This quotation is linked to a fully paid invoice and cannot be edited."}
                      </div>
                    )}
                </div>
            </div>
            <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 sm:p-6 lg:p-8">
              {/* Form Section */}
              <div className="lg:col-span-1 space-y-6 no-print">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Document Type</h2>
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                      <button disabled={isReadOnly} onClick={() => handleDocumentTypeChange(DocumentType.Quotation)} className={`flex-1 text-center font-semibold py-2 px-3 rounded-md transition-all duration-200 ${documentType === DocumentType.Quotation ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          Quotation
                      </button>
                      <button disabled={isReadOnly} onClick={() => handleDocumentTypeChange(DocumentType.Invoice)} className={`flex-1 text-center font-semibold py-2 px-3 rounded-md transition-all duration-200 ${documentType === DocumentType.Invoice ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isReadOnly}
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
                            disabled={!isCreatingNew || isReadOnly}
                        />
                        {isClientDropdownOpen && isCreatingNew && !isReadOnly && (
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
                      <input type="text" value={clientDetails.address} onChange={e => handleClientDetailChange('address', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" disabled={isReadOnly}/>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Email</label>
                      <input type="email" value={clientDetails.email} onChange={e => handleClientDetailChange('email', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" disabled={isReadOnly}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Client Phone</label>
                      <input type="tel" value={clientDetails.phone} onChange={e => handleClientDetailChange('phone', e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" disabled={isReadOnly}/>
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
                            disabled={!isCreatingNew || isReadOnly}
                          />
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Issue Date</label>
                          <input type="date" value={issueDate} onChange={handleIssueDateChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" disabled={isReadOnly}/>
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">{documentType === DocumentType.Invoice ? 'Payment Terms' : 'Validity'}</label>
                          <select value={dueDateOption} onChange={handleDueDateChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" disabled={isReadOnly}>
                              <option value="15days">15 Days</option>
                              <option value="30days">30 Days</option>
                              <option value="45days">45 Days</option>
                              <option value="60days">60 Days</option>
                              <option value="custom">Custom</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">{documentType === DocumentType.Invoice ? 'Due Date' : 'Valid Until'}</label>
                          <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setDueDateOption('custom'); }} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" disabled={isReadOnly}/>
                      </div>
                  </div>
                  {documentType === DocumentType.Invoice && (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={!!recurrence}
                                onChange={e => {
                                    if (e.target.checked) {
                                        setRecurrence({ frequency: 'monthly', interval: 1 });
                                    } else {
                                        setRecurrence(null);
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isReadOnly}
                            />
                            <span className="font-medium text-gray-700">Make this a recurring invoice</span>
                        </label>
                        {recurrence && (
                            <div className="pl-6 pt-4">
                                <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Repeat Every</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={recurrence.interval}
                                                onChange={e => setRecurrence(r => r ? {...r, interval: parseInt(e.target.value, 10) || 1} : null)}
                                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Frequency</label>
                                            <select 
                                                value={recurrence.frequency}
                                                onChange={e => setRecurrence(r => r ? {...r, frequency: e.target.value as Recurrence['frequency']} : null)}
                                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                disabled={isReadOnly}
                                            >
                                                <option value="daily">Day(s)</option>
                                                <option value="weekly">Week(s)</option>
                                                <option value="monthly">Month(s)</option>
                                                <option value="yearly">Year(s)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">End Date (Optional)</label>
                                        <input 
                                            type="date" 
                                            value={recurrence.endDate || ''}
                                            onChange={e => setRecurrence(r => r ? {...r, endDate: e.target.value || null} : null)}
                                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Items</h2>
                  
                  <div className={`bg-slate-50 p-4 rounded-lg border space-y-4 mb-6 ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700">Add an Item</h3>
                        <button 
                            onClick={handleClearNewLineItem} 
                            type="button"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                            disabled={isReadOnly}
                        >
                            Clear Fields
                        </button>
                    </div>
                    
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Item Name</label>
                      <input
                        type="text"
                        placeholder="Start typing to search or add a new item..."
                        value={newLineItem.name}
                        onChange={e => handleNewLineItemChange('name', e.target.value)}
                        onFocus={() => setIsItemDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsItemDropdownOpen(false), 200)}
                        className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                        autoComplete="off"
                        disabled={isReadOnly}
                      />
                      {isItemDropdownOpen && !isReadOnly && (
                        <div className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                          {filteredSavedItems.length > 0 ? (
                            filteredSavedItems.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSavedItemSelected(item)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                              >
                                <p className="font-semibold">{item.name}</p>
                                {item.description && <p className="text-xs text-slate-500">{item.description} &bull; </p>} 
                                <p className="text-xs text-slate-500">Cost: {formatCurrency(item.costPrice)} &bull; Sell: {formatCurrency(item.price)}</p>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Description (Optional)</label>
                        <textarea
                            rows={2}
                            placeholder="Additional details for this item..."
                            value={newLineItem.description}
                            onChange={e => handleNewLineItemChange('description', e.target.value)}
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-slate-100"
                            disabled={isReadOnly}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                        <input 
                            type={inputType}
                            inputMode={inputMode}
                            value={newLineItem.quantity} 
                            onChange={e => handleNewLineItemChange('quantity', e.target.value)} 
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Cost</label>
                            <input 
                                type={inputType}
                                inputMode={inputMode}
                                step={inputType === 'number' ? "0.01" : undefined}
                                value={newLineItem.costPrice} 
                                onChange={e => handleNewLineItemChange('costPrice', e.target.value)} 
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Markup (%)</label>
                            <input 
                                type={inputType}
                                inputMode={inputMode}
                                step={inputType === 'number' ? "0.01" : undefined}
                                value={newLineItem.markup} 
                                onChange={e => handleNewLineItemChange('markup', e.target.value)} 
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Sell</label>
                            <input 
                                type={inputType}
                                inputMode={inputMode}
                                step={inputType === 'number' ? "0.01" : undefined}
                                value={newLineItem.price} 
                                onChange={e => handleNewLineItemChange('price', e.target.value)} 
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                        </div>
                    </div>
                    
                    <button onClick={handleAddLineItem} disabled={isReadOnly} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400">
                        <PlusIcon /> Add Item to Document
                    </button>
                  </div>

                  <div className="space-y-4">
                    {lineItems.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-lg border space-y-2">
                          <div className="col-span-12">
                              <label className="block text-sm font-medium text-gray-600 mb-1">Item Name</label>
                              <input
                                  type="text"
                                  value={item.name}
                                  onChange={e => handleLineItemChange(item.id, 'name', e.target.value)}
                                  className="flex-grow w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                                  disabled={isReadOnly}
                              />
                          </div>
                          <div className="col-span-12">
                              <label className="block text-sm font-medium text-gray-600 mb-1">Description (Optional)</label>
                              <div className="flex gap-1">
                                  <textarea
                                      rows={2}
                                      value={item.description}
                                      onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                                      className="flex-grow w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-slate-100"
                                      disabled={isReadOnly}
                                  />
                                  <button
                                      onClick={() => handleGenerateDescription(item.id, item.name, item.description)}
                                      className="flex-shrink-0 p-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                      title="Generate description with AI"
                                      disabled={generatingStates[item.id] || isReadOnly}
                                  >
                                      <SparklesIcon isLoading={generatingStates[item.id]} />
                                  </button>
                              </div>
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Qty</label>
                                <input 
                                    type={inputType}
                                    inputMode={inputMode}
                                    value={item.quantity} 
                                    onChange={e => handleLineItemChange(item.id, 'quantity', e.target.value)} 
                                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                            </div>
                            <div className="col-span-4 sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Cost</label>
                                <input 
                                    type={inputType} inputMode={inputMode} step={inputType === 'number' ? "0.01" : undefined}
                                    value={item.costPrice} 
                                    onChange={e => handleLineItemChange(item.id, 'costPrice', e.target.value)} 
                                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                            </div>
                            <div className="col-span-4 sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Markup%</label>
                                <input 
                                    type={inputType} inputMode={inputMode} step={inputType === 'number' ? "0.01" : undefined}
                                    value={item.markup} 
                                    onChange={e => handleLineItemChange(item.id, 'markup', e.target.value)} 
                                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                            </div>
                            <div className="col-span-4 sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Selling</label>
                                <input 
                                    type={inputType} inputMode={inputMode} step={inputType === 'number' ? "0.01" : undefined}
                                    value={item.price} 
                                    onChange={e => handleLineItemChange(item.id, 'price', e.target.value)} 
                                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isReadOnly}/>
                            </div>
                            <div className="col-span-12 sm:col-span-1 flex items-end">
                                <button onClick={() => handleDeleteLineItem(item.id)} disabled={isReadOnly} className="w-full h-10 p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex justify-center items-center disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                                    <TrashIcon />
                                </button>
                            </div>
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
                      className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                      placeholder="Enter notes, terms and conditions, or payment instructions here..."
                      disabled={isReadOnly}
                  />
                </div>
              </div>

              {/* Preview and Actions Section */}
              <div className="lg:col-span-2">
                <div 
                  ref={previewContainerRef} 
                  data-print-container="true"
                  className="bg-white p-6 rounded-lg shadow-md sticky top-[132px]"
                >
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b pb-4 no-print">
                      <h2 className="text-xl font-bold text-gray-800">Preview</h2>
                      <div className="flex items-center gap-2">
                          <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-3 rounded-lg shadow-sm border hover:bg-slate-100 text-sm">
                              <PrinterIcon /> <span className="hidden sm:inline">Print</span>
                          </button>
                          <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-3 rounded-lg shadow-sm border hover:bg-slate-100 text-sm">
                              <DownloadIcon /> <span className="hidden sm:inline">PDF</span>
                          </button>
                      </div>
                    </div>
                    <div 
                      ref={previewScrollerRef}
                      data-print-scroller="true"
                      className="max-h-[70vh] overflow-y-auto pr-2"
                    >
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
                        quotationStatus={loadedDocumentInfo?.status as QuotationStatus}
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
      <header className="bg-white shadow-md sticky top-0 z-20 h-[68px] flex items-center no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">InvQuo</h1>
                {!isResponseMode && (
                    <nav className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setCurrentView('editor')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${currentView === 'editor' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Editor</button>
                        <button onClick={() => setCurrentView('quotations')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${currentView === 'quotations' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Quotations</button>
                        <button onClick={() => setCurrentView('invoices')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${currentView === 'invoices' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Invoices</button>
                        <button onClick={() => setCurrentView('items')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${currentView === 'items' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Items</button>
                        <button onClick={() => setCurrentView('clients')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${currentView === 'clients' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Clients</button>
                    </nav>
                )}
             </div>
             {!isResponseMode && (
                 <div className="flex items-center gap-2 sm:gap-4">
                    {firebaseUser && (
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-indigo-900 truncate max-w-[150px]">{activeCompany?.details.name}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{truncateEmail(firebaseUser.email, 25)}</span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={handleRefresh} disabled={isRefreshing} className={`p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} title="Refresh Data">
                            <RefreshIcon />
                        </button>
                        <button onClick={() => setCurrentView('setup')} className={`p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors ${currentView === 'setup' ? 'bg-indigo-50 text-indigo-600' : ''}`} title="Settings">
                            <CogIcon />
                        </button>
                        <button onClick={handleLogout} className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors" title="Logout">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                 </div>
             )}
          </div>
        </div>
      </header>
      
      {/* Mobile Bottom Navigation */}
      {!isResponseMode && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex justify-around items-center px-2 pb-safe no-print">
            <button onClick={() => setCurrentView('editor')} className={`flex flex-col items-center justify-center w-full py-2 ${currentView === 'editor' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <PlusIcon />
            <span className="text-[10px] font-medium mt-1">Create</span>
            </button>
            <button onClick={() => setCurrentView('quotations')} className={`flex flex-col items-center justify-center w-full py-2 ${currentView === 'quotations' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <DocumentIcon />
            <span className="text-[10px] font-medium mt-1">Quotes</span>
            </button>
            <button onClick={() => setCurrentView('invoices')} className={`flex flex-col items-center justify-center w-full py-2 ${currentView === 'invoices' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <FileTextIcon />
            <span className="text-[10px] font-medium mt-1">Invoices</span>
            </button>
            <button onClick={() => setCurrentView('items')} className={`flex flex-col items-center justify-center w-full py-2 ${currentView === 'items' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <ListIcon />
            <span className="text-[10px] font-medium mt-1">Items</span>
            </button>
            <button onClick={() => setCurrentView('clients')} className={`flex flex-col items-center justify-center w-full py-2 ${currentView === 'clients' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <UsersIcon />
            <span className="text-[10px] font-medium mt-1">Clients</span>
            </button>
        </nav>
      )}

      {/* Desktop Sidebar (visible only on large screens if desired, but top nav handles it well) */}
      
      {/* Main Content Area with padding for bottom nav on mobile */}
      <div className={isResponseMode ? '' : "pb-20 sm:pb-0"}>
        {renderCurrentView()}
      </div>
      
      {/* Modals */}
      <SaveItemsModal
        isOpen={isSaveItemsModalOpen}
        newItems={potentialNewItems}
        onConfirm={handleConfirmSaveNewItems}
        onDecline={handleDeclineSaveNewItems}
        onCancel={handleCancelSaveNewItems}
        formatCurrency={formatCurrency}
      />
      <SaveClientModal
        isOpen={isSaveClientModalOpen}
        newClient={potentialNewClient!}
        onConfirm={handleConfirmSaveNewClient}
        onDecline={handleDeclineSaveNewClient}
        onCancel={handleCancelSaveNewClient}
      />
       {isUpdateClientModalOpen && clientUpdateInfo && (
        <UpdateClientModal
          isOpen={isUpdateClientModalOpen}
          clientInfo={clientUpdateInfo}
          onConfirm={handleConfirmUpdateClient}
          onDecline={handleDeclineUpdateClient}
          onCancel={handleCancelUpdateClient}
        />
      )}
      <ShareDocumentModal
        isOpen={isShareModalOpen}
        documentType={documentType}
        documentNumber={documentNumber}
        onShareEmail={handleSendViaEmail}
        onShareWhatsApp={handleSendViaWhatsApp}
        onClose={handleShareModalClose}
      />
    </div>
  );
};

export default App;
