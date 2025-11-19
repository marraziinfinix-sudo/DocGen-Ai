import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import { 
  fetchUserData, saveDocument, saveActiveCompanyId, saveCompanies, 
  saveClients, saveItems, saveItemCategories, saveInvoices, saveQuotations 
} from './services/firebaseService';
import { 
  Company, Client, Item, SavedDocument, DocumentType, 
  InvoiceStatus, QuotationStatus, LineItem, Details 
} from './types';
import { generateDescription } from './services/geminiService';

// Components
import LoginPage from './components/LoginPage';
import SetupPage from './components/SetupPage';
import ClientListPage from './components/ClientListPage';
import ItemListPage from './components/ItemListPage';
import DocumentListPage from './components/DocumentListPage';
import QuotationListPage from './components/QuotationListPage';
import DocumentPreview from './components/DocumentPreview';
import SaveItemsModal from './components/SaveItemsModal';
import SaveClientModal from './components/SaveClientModal';

// Icons
import { 
  PlusIcon, SparklesIcon, ListIcon, UsersIcon, 
  DocumentIcon, FileTextIcon, PrinterIcon, CogIcon, 
  DownloadIcon, SendIcon, TrashIcon, RefreshIcon,
  ChevronDownIcon
} from './components/Icons';

type Page = 'dashboard' | 'create' | 'invoices' | 'quotations' | 'clients' | 'items' | 'settings';

const defaultCompanyDetails: Details = { name: '', address: '', email: '', phone: '', bankName: '', accountNumber: '', website: '', taxId: '' };
const emptyClient: Details = { name: '', address: '', email: '', phone: '' };

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  // App Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number>(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [savedInvoices, setSavedInvoices] = useState<SavedDocument[]>([]);
  const [savedQuotations, setSavedQuotations] = useState<SavedDocument[]>([]);
  const [itemCategories, setItemCategories] = useState<string[]>([]);

  // Editor State
  const [editorDocType, setEditorDocType] = useState<DocumentType>(DocumentType.Invoice);
  const [editorClient, setEditorClient] = useState<Details>(emptyClient);
  const [editorIssueDate, setEditorIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [editorDueDate, setEditorDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // +7 days
  const [editorLineItems, setEditorLineItems] = useState<LineItem[]>([{ id: Date.now(), name: '', description: '', quantity: 1, costPrice: 0, markup: 0, price: 0 }]);
  const [editorNotes, setEditorNotes] = useState('');
  const [editorDocNumber, setEditorDocNumber] = useState('');
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  
  const [generatingDescIndex, setGeneratingDescIndex] = useState<number | null>(null);
  
  // Modals
  const [saveItemsModalOpen, setSaveItemsModalOpen] = useState(false);
  const [saveClientModalOpen, setSaveClientModalOpen] = useState(false);
  const [pendingSaveDoc, setPendingSaveDoc] = useState<SavedDocument | null>(null);

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0] || { 
      id: 0, details: defaultCompanyDetails, logo: null, bankQRCode: null, 
      defaultNotes: '', taxRate: 0, currency: '$', template: 'modern', accentColor: '#4f46e5' 
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        const userData = await fetchUserData(currentUser.uid);
        setCompanies(userData.companies);
        setClients(userData.clients);
        setItems(userData.items);
        setSavedInvoices(userData.savedInvoices);
        setSavedQuotations(userData.savedQuotations);
        setActiveCompanyId(userData.activeCompanyId);
        setItemCategories(userData.itemCategories);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-set notes and currency when company changes
  useEffect(() => {
    if (activeCompany && !editingDocId) {
        setEditorNotes(activeCompany.defaultNotes);
    }
  }, [activeCompanyId, editingDocId]);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentPage('dashboard');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' // Simplified for this example, usually derived from activeCompany.currency
    }).format(amount).replace('$', activeCompany.currency || '$');
  };

  const calculateTotals = () => {
    const subtotal = editorLineItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = subtotal * (activeCompany.taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  // --- Editor Actions ---

  const handleAddItem = () => {
    setEditorLineItems([...editorLineItems, { id: Date.now(), name: '', description: '', quantity: 1, costPrice: 0, markup: 0, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...editorLineItems];
    newItems.splice(index, 1);
    setEditorLineItems(newItems);
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...editorLineItems];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'costPrice' || field === 'markup') {
        const cost = Number(item.costPrice);
        const markup = Number(item.markup);
        item.price = cost * (1 + markup / 100);
    } else if (field === 'price') {
        const cost = Number(item.costPrice);
        const price = Number(item.price);
        if (cost > 0) {
            item.markup = ((price / cost) - 1) * 100;
        }
    }

    newItems[index] = item;
    setEditorLineItems(newItems);
  };

  const handleSelectItem = (index: number, savedItem: Item) => {
    const newItems = [...editorLineItems];
    const cost = savedItem.costPrice || 0;
    const sell = savedItem.price || 0;
    const markup = cost > 0 ? ((sell - cost) / cost) * 100 : 0;
    
    newItems[index] = {
      ...newItems[index],
      name: savedItem.name,
      description: savedItem.description,
      costPrice: cost,
      price: sell,
      markup: markup,
    };
    setEditorLineItems(newItems);
  };

  const handleGenerateDescription = async (index: number) => {
    const item = editorLineItems[index];
    if (!item.name) return;
    setGeneratingDescIndex(index);
    const desc = await generateDescription(item.name);
    if (desc) {
      handleUpdateItem(index, 'description', desc);
    }
    setGeneratingDescIndex(null);
  };

  const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = Number(e.target.value);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setEditorClient(client);
    } else {
      setEditorClient(emptyClient);
    }
  };
  
  const handleClientDetailChange = (field: keyof Details, value: string) => {
      setEditorClient(prev => ({ ...prev, [field]: value }));
  }

  // --- Saving Logic ---

  const handleSaveDocumentInit = () => {
    if (!editorClient.name) {
      alert('Please enter a client name.');
      return;
    }
    
    const docToSave: SavedDocument = {
      id: editingDocId || Date.now(),
      documentNumber: editorDocNumber || `${Date.now()}`,
      documentType: editorDocType,
      clientDetails: editorClient,
      companyDetails: activeCompany.details,
      companyLogo: activeCompany.logo,
      bankQRCode: activeCompany.bankQRCode,
      issueDate: editorIssueDate,
      dueDate: editorDueDate,
      lineItems: editorLineItems,
      notes: editorNotes,
      taxRate: activeCompany.taxRate,
      currency: activeCompany.currency,
      total: total,
      status: editorDocType === DocumentType.Invoice ? (editingDocId ? undefined : InvoiceStatus.Pending) : null,
      quotationStatus: editorDocType === DocumentType.Quotation ? (editingDocId ? undefined : QuotationStatus.Active) : null,
      template: activeCompany.template,
      accentColor: activeCompany.accentColor,
    };
    
    // Restore existing status/payments if editing
    if (editingDocId) {
        const existingDocs = editorDocType === DocumentType.Invoice ? savedInvoices : savedQuotations;
        const original = existingDocs.find(d => d.id === editingDocId);
        if (original) {
            docToSave.status = original.status;
            docToSave.quotationStatus = original.quotationStatus;
            docToSave.payments = original.payments;
            docToSave.paidDate = original.paidDate;
        }
    }

    setPendingSaveDoc(docToSave);

    // Check for new items/client to save
    const newItems = editorLineItems.filter(li => 
      li.name && !items.some(i => i.name.toLowerCase() === li.name.toLowerCase())
    );

    const isNewClient = editorClient.name && !clients.some(c => c.name.toLowerCase() === editorClient.name.toLowerCase());

    if (newItems.length > 0) {
      setSaveItemsModalOpen(true);
    } else if (isNewClient) {
      setSaveClientModalOpen(true);
    } else {
      finalizeSave(docToSave);
    }
  };

  const finalizeSave = async (doc: SavedDocument, saveExtra?: { newItems?: boolean, newClient?: boolean }) => {
    if (saveExtra?.newItems) {
      const itemsToSave = editorLineItems.filter(li => li.name && !items.some(i => i.name === li.name)).map(li => ({
        id: Date.now() + Math.random(),
        name: li.name,
        description: li.description,
        costPrice: li.costPrice,
        price: li.price,
        category: ''
      }));
      const updatedItems = [...items, ...itemsToSave];
      setItems(updatedItems);
      saveItems(updatedItems);
    }

    if (saveExtra?.newClient) {
      const clientToSave: Client = { id: Date.now(), ...editorClient };
      const updatedClients = [...clients, clientToSave];
      setClients(updatedClients);
      saveClients(updatedClients);
    }

    if (doc.documentType === DocumentType.Invoice) {
      saveDocument('savedInvoices', doc);
      setSavedInvoices(prev => {
        const idx = prev.findIndex(d => d.id === doc.id);
        if (idx > -1) {
            const newArr = [...prev];
            newArr[idx] = doc;
            return newArr;
        }
        return [doc, ...prev];
      });
      setCurrentPage('invoices');
    } else {
      saveDocument('savedQuotations', doc);
      setSavedQuotations(prev => {
        const idx = prev.findIndex(d => d.id === doc.id);
        if (idx > -1) {
            const newArr = [...prev];
            newArr[idx] = doc;
            return newArr;
        }
        return [doc, ...prev];
      });
      setCurrentPage('quotations');
    }
    
    setPendingSaveDoc(null);
    setSaveItemsModalOpen(false);
    setSaveClientModalOpen(false);
    clearEditor();
  };

  const clearEditor = () => {
    setEditorClient(emptyClient);
    setEditorLineItems([{ id: Date.now(), name: '', description: '', quantity: 1, costPrice: 0, markup: 0, price: 0 }]);
    setEditorDocNumber('');
    setEditorNotes(activeCompany.defaultNotes);
    setEditingDocId(null);
  };

  const loadDocumentIntoEditor = (doc: SavedDocument) => {
    setEditorDocType(doc.documentType);
    setEditorClient(doc.clientDetails);
    setEditorIssueDate(doc.issueDate);
    setEditorDueDate(doc.dueDate);
    setEditorLineItems(doc.lineItems.length ? doc.lineItems : [{ id: Date.now(), name: '', description: '', quantity: 1, costPrice: 0, markup: 0, price: 0 }]);
    setEditorNotes(doc.notes);
    setEditorDocNumber(doc.documentNumber);
    setEditingDocId(doc.id);
    setCurrentPage('create');
  };
  
  const createInvoiceFromQuote = (quote: SavedDocument) => {
      loadDocumentIntoEditor(quote);
      setEditorDocType(DocumentType.Invoice);
      setEditingDocId(null); // New ID for the invoice
      setEditorDocNumber(`INV-${Date.now().toString().slice(-6)}`);
      setEditorIssueDate(new Date().toISOString().split('T')[0]);
  };
  
  const handleSendReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    const subject = `Invoice #${doc.documentNumber} from ${doc.companyDetails.name}`;
    const emailBody = `Dear ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding invoice #${doc.documentNumber}, due on ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\nThe remaining balance is ${formatCurrency(doc.total - (doc.payments?.reduce((acc, p) => acc + p.amount, 0) || 0))}.\n\nPlease let us know if you have any questions.\n\nThank you,\n${doc.companyDetails.name}`;
    
    const whatsappMessage = `Hello ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding invoice #${doc.documentNumber}, due on ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\nThe remaining balance is ${formatCurrency(doc.total - (doc.payments?.reduce((acc, p) => acc + p.amount, 0) || 0))}.\n\nPlease let us know if you have any questions.\n\nThank you,\n${doc.companyDetails.name}`;

    if (channel === 'email') {
      window.open(`mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    }
  };
  
  const handleSendQuotationReminder = (doc: SavedDocument, channel: 'email' | 'whatsapp') => {
    const subject = `Quotation #${doc.documentNumber} from ${doc.companyDetails.name}`;
    const emailBody = `Dear ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding quotation #${doc.documentNumber}, valid until ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\nThe total amount is ${formatCurrency(doc.total)}.\n\nPlease let us know if you have any questions.\n\nThank you,\n${doc.companyDetails.name}`;

    const whatsappMessage = `Hello ${doc.clientDetails.name},\n\nThis is a friendly reminder regarding quotation #${doc.documentNumber}, valid until ${new Date(doc.dueDate + 'T00:00:00').toLocaleDateString()}.\nThe total amount is ${formatCurrency(doc.total)}.\n\nPlease let us know if you have any questions.\n\nThank you,\n${doc.companyDetails.name}`;
  
    if (channel === 'email') {
      window.open(`mailto:${doc.clientDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    }
  };

  if (!user) {
    return <LoginPage />;
  }

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
      );
  }

  const navButtonClasses = "flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-md transition-colors text-sm font-medium";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
            <h1 className="text-xl font-bold text-indigo-600">InvQuo</h1>
            <button onClick={() => setNavOpen(!navOpen)} className="text-gray-600">
                <ListIcon />
            </button>
        </div>

      {/* Navigation */}
      <nav className={`bg-white shadow-lg w-full md:w-64 flex-shrink-0 flex flex-col justify-between fixed md:relative z-10 h-full transition-transform duration-300 ${navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
            <div className="p-6 hidden md:block">
                <h1 className="text-2xl font-bold text-indigo-600">InvQuo</h1>
            </div>
            <div className="px-4 py-2 space-y-2">
                <button onClick={() => { setCurrentPage('dashboard'); setNavOpen(false); }} className={`${navButtonClasses} ${currentPage === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <ListIcon /> Dashboard
                </button>
                <button onClick={() => { clearEditor(); setCurrentPage('create'); setNavOpen(false); }} className={`${navButtonClasses} ${currentPage === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <PlusIcon /> Create New
                </button>
                <button onClick={() => { setCurrentPage('invoices'); setNavOpen(false); }} className={`${navButtonClasses} ${currentPage === 'invoices' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <FileTextIcon /> Invoices
                </button>
                <button onClick={() => { setCurrentPage('quotations'); setNavOpen(false); }} className={`${navButtonClasses} ${currentPage === 'quotations' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <DocumentIcon /> Quotations
                </button>
                <button onClick={() => { setCurrentPage('clients'); setNavOpen(false); }} className={`${navButtonClasses} ${currentPage === 'clients' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <UsersIcon /> Clients
                </button>
                <button onClick={() => { setCurrentPage('items'); setNavOpen(false); }} className={`${navButtonClasses} ${currentPage === 'items' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <CogIcon /> Items
                </button>
            </div>
        </div>
        <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {user.email?.[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    <p className="text-xs text-gray-500 truncate">{activeCompany.details.name}</p>
                </div>
            </div>
            <button onClick={() => { setCurrentPage('settings'); setNavOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 font-medium">
                Settings
            </button>
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium">
                Sign Out
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto h-screen">
        {currentPage === 'dashboard' && (
            <main className="p-4 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
                        <p className="text-sm text-gray-500 font-medium uppercase">Total Revenue</p>
                        <p className="text-3xl font-bold text-indigo-600 mt-2">
                            {formatCurrency(savedInvoices.reduce((sum, doc) => sum + (doc.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0), 0))}
                        </p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                        <p className="text-sm text-gray-500 font-medium uppercase">Pending Invoices</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                            {savedInvoices.filter(i => i.status !== InvoiceStatus.Paid).length}
                        </p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                        <p className="text-sm text-gray-500 font-medium uppercase">Active Quotes</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {savedQuotations.filter(q => q.quotationStatus === QuotationStatus.Active).length}
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Invoices</h3>
                        {savedInvoices.length > 0 ? (
                            <div className="space-y-3">
                                {savedInvoices.slice(0, 5).map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => loadDocumentIntoEditor(inv)}>
                                        <div>
                                            <p className="font-semibold text-gray-800">#{inv.documentNumber}</p>
                                            <p className="text-sm text-gray-500">{inv.clientDetails.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-700">{formatCurrency(inv.total)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === InvoiceStatus.Paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-400 text-sm">No invoices yet.</p>}
                        <button onClick={() => setCurrentPage('invoices')} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">View All Invoices &rarr;</button>
                    </div>
                    
                     <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button onClick={() => { clearEditor(); setEditorDocType(DocumentType.Invoice); setCurrentPage('create'); }} className="w-full p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 font-medium flex items-center gap-3">
                                <PlusIcon /> Create New Invoice
                            </button>
                             <button onClick={() => { clearEditor(); setEditorDocType(DocumentType.Quotation); setCurrentPage('create'); }} className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium flex items-center gap-3">
                                <DocumentIcon /> Create New Quotation
                            </button>
                            <button onClick={() => setCurrentPage('clients')} className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium flex items-center gap-3">
                                <UsersIcon /> Manage Clients
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        )}

        {currentPage === 'create' && (
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
                {/* Editor Form */}
                <div className="w-full lg:w-1/2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingDocId ? `Edit ${editorDocType}` : `New ${editorDocType}`}
                            </h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setEditorDocType(DocumentType.Invoice)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${editorDocType === DocumentType.Invoice ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Invoice
                                </button>
                                <button 
                                    onClick={() => setEditorDocType(DocumentType.Quotation)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${editorDocType === DocumentType.Quotation ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Quote
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Document No.</label>
                                <input type="text" value={editorDocNumber} onChange={e => setEditorDocNumber(e.target.value)} placeholder="Auto-generated" className="w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Client</label>
                                <select onChange={handleSelectClient} className="w-full p-2 border rounded-md mb-2">
                                    <option value="">Select Client...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <input 
                                    type="text" 
                                    placeholder="Or type Client Name" 
                                    value={editorClient.name} 
                                    onChange={e => handleClientDetailChange('name', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                             {editorClient.name && (
                                <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                                    <input type="text" placeholder="Address" value={editorClient.address} onChange={e => handleClientDetailChange('address', e.target.value)} className="p-2 border rounded-md text-sm" />
                                    <input type="email" placeholder="Email" value={editorClient.email} onChange={e => handleClientDetailChange('email', e.target.value)} className="p-2 border rounded-md text-sm" />
                                </div>
                            )}
                        </div>

                         <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Issue Date</label>
                                <input type="date" value={editorIssueDate} onChange={e => setEditorIssueDate(e.target.value)} className="w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{editorDocType === DocumentType.Invoice ? 'Due Date' : 'Valid Until'}</label>
                                <input type="date" value={editorDueDate} onChange={e => setEditorDueDate(e.target.value)} className="w-full p-2 border rounded-md" />
                            </div>
                        </div>

                        <div className="mb-6">
                             <label className="block text-sm font-medium text-gray-600 mb-2">Line Items</label>
                             <div className="space-y-4">
                                {editorLineItems.map((item, index) => (
                                    <div key={item.id} className="bg-gray-50 p-3 rounded-md border relative group">
                                        <button onClick={() => handleRemoveItem(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                                        <div className="grid grid-cols-12 gap-2 mb-2">
                                            <div className="col-span-12 sm:col-span-6">
                                                <input 
                                                    type="text" 
                                                    placeholder="Item Name" 
                                                    value={item.name} 
                                                    onChange={e => handleUpdateItem(index, 'name', e.target.value)} 
                                                    className="w-full p-1.5 border rounded-md font-medium text-sm"
                                                    list={`items-list-${index}`}
                                                />
                                                <datalist id={`items-list-${index}`}>
                                                    {items.map(i => <option key={i.id} value={i.name} />)}
                                                </datalist>
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleUpdateItem(index, 'quantity', Number(e.target.value))} className="w-full p-1.5 border rounded-md text-sm text-center" />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <input type="number" placeholder="Price" value={item.price} onChange={e => handleUpdateItem(index, 'price', Number(e.target.value))} className="w-full p-1.5 border rounded-md text-sm text-right" />
                                            </div>
                                             <div className="col-span-4 sm:col-span-2 flex items-center justify-end text-sm font-bold text-gray-700">
                                                {formatCurrency(item.price * item.quantity)}
                                            </div>
                                        </div>
                                        <div className="relative">
                                             <textarea 
                                                placeholder="Description" 
                                                value={item.description} 
                                                onChange={e => handleUpdateItem(index, 'description', e.target.value)} 
                                                className="w-full p-1.5 border rounded-md text-sm pr-8"
                                                rows={1}
                                             />
                                             <button 
                                                onClick={() => handleGenerateDescription(index)}
                                                disabled={generatingDescIndex === index}
                                                className="absolute right-2 top-1.5 text-indigo-400 hover:text-indigo-600 disabled:text-gray-300"
                                                title="Generate description with AI"
                                             >
                                                <SparklesIcon isLoading={generatingDescIndex === index} />
                                             </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                             <button onClick={handleAddItem} className="mt-2 text-sm text-indigo-600 font-medium flex items-center gap-1 hover:underline">
                                <PlusIcon /> Add Item
                             </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Notes / Terms</label>
                            <textarea value={editorNotes} onChange={e => setEditorNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-md text-sm" />
                        </div>
                    </div>
                </div>

                {/* Preview & Actions */}
                <div className="w-full lg:w-1/2 flex flex-col gap-6">
                     <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <DocumentPreview 
                            documentType={editorDocType}
                            companyDetails={activeCompany.details}
                            clientDetails={editorClient}
                            documentNumber={editorDocNumber || 'DRAFT'}
                            issueDate={editorIssueDate}
                            dueDate={editorDueDate}
                            lineItems={editorLineItems}
                            notes={editorNotes}
                            subtotal={subtotal}
                            taxAmount={taxAmount}
                            taxRate={activeCompany.taxRate}
                            total={total}
                            companyLogo={activeCompany.logo}
                            bankQRCode={activeCompany.bankQRCode}
                            formatCurrency={formatCurrency}
                            status={null}
                            template={activeCompany.template}
                            accentColor={activeCompany.accentColor}
                        />
                     </div>
                     <div className="flex gap-4 justify-end">
                         <button onClick={() => setCurrentPage('dashboard')} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50">
                             Cancel
                         </button>
                         <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2">
                             <PrinterIcon /> Print
                         </button>
                         <button onClick={handleSaveDocumentInit} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2">
                             <DownloadIcon /> Save Document
                         </button>
                     </div>
                </div>
            </div>
        )}

        {currentPage === 'invoices' && (
            <DocumentListPage 
                documents={savedInvoices}
                setDocuments={setSavedInvoices}
                formatCurrency={formatCurrency}
                handleSendReminder={handleSendReminder}
                handleLoadDocument={loadDocumentIntoEditor}
            />
        )}
        
        {currentPage === 'quotations' && (
            <QuotationListPage 
                documents={savedQuotations}
                setDocuments={setSavedQuotations}
                formatCurrency={formatCurrency}
                handleCreateInvoiceFromQuote={createInvoiceFromQuote}
                handleLoadDocument={loadDocumentIntoEditor}
                handleSendQuotationReminder={handleSendQuotationReminder}
            />
        )}

        {currentPage === 'clients' && (
            <ClientListPage clients={clients} setClients={(newClients) => { setClients(newClients as Client[]); saveClients(newClients as Client[]); }} onDone={() => setCurrentPage('dashboard')} />
        )}
        
        {currentPage === 'items' && (
            <ItemListPage 
                items={items} 
                setItems={(newItems) => { setItems(newItems as Item[]); saveItems(newItems as Item[]); }} 
                categories={itemCategories}
                setCategories={(newCats) => { setItemCategories(newCats as string[]); saveItemCategories(newCats as string[]); }}
                formatCurrency={formatCurrency}
                onDone={() => setCurrentPage('dashboard')} 
            />
        )}
        
        {currentPage === 'settings' && user && (
            <SetupPage 
                user={user}
                companies={companies} 
                setCompanies={(newComps) => { setCompanies(newComps as Company[]); saveCompanies(newComps as Company[]); }} 
                onDone={() => setCurrentPage('dashboard')}
                activeCompanyId={activeCompanyId}
                setActiveCompanyId={(id) => { setActiveCompanyId(id as number); saveActiveCompanyId(id as number); }}
                setClients={(c) => { setClients(c as Client[]); saveClients(c as Client[]); }}
                setItems={(i) => { setItems(i as Item[]); saveItems(i as Item[]); }}
                setItemCategories={(ic) => { setItemCategories(ic as string[]); saveItemCategories(ic as string[]); }}
                setSavedInvoices={(si) => { setSavedInvoices(si as SavedDocument[]); saveInvoices(si as SavedDocument[]); }}
                setSavedQuotations={(sq) => { setSavedQuotations(sq as SavedDocument[]); saveQuotations(sq as SavedDocument[]); }}
                defaultUserData={{
                    companies: [], clients: [], items: [], savedInvoices: [], savedQuotations: [], activeCompanyId: 0, itemCategories: []
                }}
            />
        )}
      </div>

      <SaveItemsModal
        isOpen={saveItemsModalOpen}
        newItems={editorLineItems.filter(li => li.name && !items.some(i => i.name === li.name))}
        onConfirm={() => { if(pendingSaveDoc) finalizeSave(pendingSaveDoc, { newItems: true, newClient: !clients.some(c => c.name === editorClient.name) }); }}
        onDecline={() => { if(pendingSaveDoc) finalizeSave(pendingSaveDoc, { newItems: false, newClient: !clients.some(c => c.name === editorClient.name) }); }}
        onCancel={() => { setSaveItemsModalOpen(false); setPendingSaveDoc(null); }}
        formatCurrency={formatCurrency}
      />
      
      <SaveClientModal
        isOpen={saveClientModalOpen}
        newClient={editorClient}
        onConfirm={() => { if(pendingSaveDoc) finalizeSave(pendingSaveDoc, { newClient: true }); }}
        onDecline={() => { if(pendingSaveDoc) finalizeSave(pendingSaveDoc, { newClient: false }); }}
        onCancel={() => { setSaveClientModalOpen(false); setPendingSaveDoc(null); }}
      />
    </div>
  );
}

export default App;