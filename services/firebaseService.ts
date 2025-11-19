
import { Company, Client, Item, SavedDocument, DocumentType, LineItem, Details, Payment, Recurrence, QuotationStatus } from '../types';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, User as FirebaseUser } from 'firebase/auth';

interface UserData {
    email?: string;
    companies: Company[];
    clients: Client[];
    items: Item[];
    savedInvoices: SavedDocument[];
    savedQuotations: SavedDocument[];
    activeCompanyId: number;
    itemCategories: string[];
}

export const defaultUserData: Omit<UserData, 'email'> = {
    companies: [{
        id: 1,
        details: { name: 'My First Company', address: '123 Business Rd, Suite 100', email: 'contact@company.com', phone: '555-123-4567', bankName: '', accountNumber: '', website: '', taxId: '' },
        logo: null,
        bankQRCode: null,
        defaultNotes: 'Thank you for your business.',
        taxRate: 0,
        currency: '$',
        template: 'modern',
        accentColor: '#4f46e5',
    }],
    clients: [],
    items: [],
    savedInvoices: [],
    savedQuotations: [],
    activeCompanyId: 1,
    itemCategories: [],
};

export const createNewUserDocument = async (uid: string, email: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        const dataToSet: UserData = {
            ...defaultUserData,
            email,
        };
        await setDoc(userRef, dataToSet);
    } catch (error) {
        console.error("Error creating new user document:", error);
    }
};

const sanitizeDetails = (details: Partial<Details>): Details => ({
    name: typeof details.name === 'string' ? details.name : '',
    address: typeof details.address === 'string' ? details.address : '',
    email: typeof details.email === 'string' ? details.email : '',
    phone: typeof details.phone === 'string' ? details.phone : '',
    bankName: typeof details.bankName === 'string' ? details.bankName : '',
    accountNumber: typeof details.accountNumber === 'string' ? details.accountNumber : '',
    website: typeof details.website === 'string' ? details.website : '',
    taxId: typeof details.taxId === 'string' ? details.taxId : '',
});

const sanitizeCompany = (comp: any): Company | null => {
    if (typeof comp !== 'object' || comp === null) return null;
    return {
        id: typeof comp.id === 'number' ? comp.id : Date.now(),
        details: sanitizeDetails(comp.details || {}),
        logo: typeof comp.logo === 'string' ? comp.logo : null,
        bankQRCode: typeof comp.bankQRCode === 'string' ? comp.bankQRCode : null,
        defaultNotes: typeof comp.defaultNotes === 'string' ? comp.defaultNotes : 'Thank you for your business.',
        taxRate: typeof comp.taxRate === 'number' ? comp.taxRate : 0,
        currency: typeof comp.currency === 'string' ? comp.currency : '$',
        template: typeof comp.template === 'string' ? comp.template : 'classic',
        accentColor: typeof comp.accentColor === 'string' ? comp.accentColor : '#4f46e5',
    };
};

const sanitizeClient = (cli: any): Client | null => {
    if (typeof cli !== 'object' || cli === null) return null;
    return {
        id: typeof cli.id === 'number' ? cli.id : Date.now(),
        ...sanitizeDetails(cli),
    };
};

const sanitizeItem = (item: any): Item | null => {
    if (typeof item !== 'object' || item === null) return null;
    let itemName = typeof item.name === 'string' ? item.name : '';
    let itemDescription = typeof item.description === 'string' ? item.description : '';

    // Migration logic: If only 'description' exists from old data, use it as 'name'
    // and clear 'description'. If both exist, keep both.
    if (!itemName && typeof item.description === 'string') {
        itemName = item.description;
        itemDescription = ''; // Clear old description as it's now the name
    }

    return {
        id: typeof item.id === 'number' ? item.id : Date.now(),
        name: itemName,
        description: itemDescription,
        costPrice: typeof item.costPrice === 'number' ? item.costPrice : 0,
        price: typeof item.price === 'number' ? item.price : 0,
        category: typeof item.category === 'string' ? item.category : '',
    };
};

const sanitizePayment = (p: any): Payment | null => {
    if (typeof p !== 'object' || p === null) return null;
    return {
        id: typeof p.id === 'number' ? p.id : Date.now(),
        amount: typeof p.amount === 'number' ? p.amount : 0,
        date: typeof p.date === 'string' ? p.date : new Date().toISOString().split('T')[0],
        method: typeof p.method === 'string' ? p.method : 'Other',
        notes: typeof p.notes === 'string' ? p.notes : '',
    };
};

const sanitizeLineItem = (li: any): LineItem | null => {
    if (typeof li !== 'object' || li === null) return null;
    let lineItemName = typeof li.name === 'string' ? li.name : '';
    let lineItemDescription = typeof li.description === 'string' ? li.description : '';

    // Migration logic for line items too
    if (!lineItemName && typeof li.description === 'string') {
        lineItemName = li.description;
        lineItemDescription = ''; // Clear old description as it's now the name
    }

    return {
        id: typeof li.id === 'number' ? li.id : Date.now(),
        name: lineItemName,
        description: lineItemDescription,
        quantity: typeof li.quantity === 'number' ? li.quantity : 1,
        costPrice: typeof li.costPrice === 'number' ? li.costPrice : 0,
        markup: typeof li.markup === 'number' ? li.markup : 0,
        price: typeof li.price === 'number' ? li.price : 0,
    };
};

const sanitizeRecurrence = (rec: any): Recurrence | null => {
    if (typeof rec !== 'object' || rec === null) return null;
    const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
    return {
        frequency: validFrequencies.includes(rec.frequency) ? rec.frequency : 'monthly',
        interval: typeof rec.interval === 'number' && rec.interval >= 1 ? rec.interval : 1,
        endDate: typeof rec.endDate === 'string' ? rec.endDate : null,
    };
};

const sanitizeDocument = (docData: any): SavedDocument | null => {
    if (typeof docData !== 'object' || docData === null) return null;
    const today = new Date().toISOString().split('T')[0];
    return {
        id: typeof docData.id === 'number' ? docData.id : Date.now(),
        documentNumber: typeof docData.documentNumber === 'string' ? docData.documentNumber : '',
        documentType: [DocumentType.Invoice, DocumentType.Quotation].includes(docData.documentType) ? docData.documentType : DocumentType.Quotation,
        clientDetails: sanitizeDetails(docData.clientDetails || {}),
        companyDetails: sanitizeDetails(docData.companyDetails || {}),
        companyLogo: typeof docData.companyLogo === 'string' ? docData.companyLogo : null,
        bankQRCode: typeof docData.bankQRCode === 'string' ? docData.bankQRCode : null,
        issueDate: typeof docData.issueDate === 'string' ? docData.issueDate : today,
        dueDate: typeof docData.dueDate === 'string' ? docData.dueDate : today,
        lineItems: Array.isArray(docData.lineItems) ? docData.lineItems.map(sanitizeLineItem).filter(Boolean) as LineItem[] : [],
        notes: typeof docData.notes === 'string' ? docData.notes : '',
        taxRate: typeof docData.taxRate === 'number' ? docData.taxRate : 0,
        currency: typeof docData.currency === 'string' ? docData.currency : '$',
        total: typeof docData.total === 'number' ? docData.total : 0,
        status: docData.status || null,
        quotationStatus: docData.quotationStatus || null,
        paidDate: typeof docData.paidDate === 'string' ? docData.paidDate : null,
        payments: Array.isArray(docData.payments) ? docData.payments.map(sanitizePayment).filter(Boolean) as Payment[] : [],
        template: typeof docData.template === 'string' ? docData.template : 'classic',
        accentColor: typeof docData.accentColor === 'string' ? docData.accentColor : '#4f46e5',
        recurrence: docData.recurrence ? sanitizeRecurrence(docData.recurrence) : null,
        recurrenceParentId: typeof docData.recurrenceParentId === 'number' ? docData.recurrenceParentId : null,
    };
};

export const fetchUserData = async (uid: string): Promise<UserData> => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const parsedData = docSnap.data() || {};
      
      const completeData: UserData = {
        companies: Array.isArray(parsedData.companies) ? parsedData.companies.map(sanitizeCompany).filter(Boolean) as Company[] : defaultUserData.companies,
        clients: Array.isArray(parsedData.clients) ? parsedData.clients.map(sanitizeClient).filter(Boolean) as Client[] : defaultUserData.clients,
        items: Array.isArray(parsedData.items) ? parsedData.items.map(sanitizeItem).filter(Boolean) as Item[] : defaultUserData.items,
        savedInvoices: Array.isArray(parsedData.savedInvoices) ? parsedData.savedInvoices.map(sanitizeDocument).filter(Boolean) as SavedDocument[] : defaultUserData.savedInvoices,
        savedQuotations: Array.isArray(parsedData.savedQuotations) 
            ? parsedData.savedQuotations.map(sanitizeDocument).filter(Boolean) as SavedDocument[] 
            : (Array.isArray(parsedData.quotations) 
                ? parsedData.quotations.map(sanitizeDocument).filter(Boolean) as SavedDocument[] 
                : defaultUserData.savedQuotations),
        activeCompanyId: typeof parsedData.activeCompanyId === 'number' ? parsedData.activeCompanyId : defaultUserData.activeCompanyId,
        itemCategories: Array.isArray(parsedData.itemCategories) ? parsedData.itemCategories.filter((cat): cat is string => typeof cat === 'string') : defaultUserData.itemCategories,
      };
      
      // Ensure there is at least one company
      if (completeData.companies.length === 0) {
          completeData.companies = defaultUserData.companies;
          completeData.activeCompanyId = defaultUserData.activeCompanyId;
      }
      // Ensure activeCompanyId is valid
      if (!completeData.companies.some(c => c.id === completeData.activeCompanyId)) {
          completeData.activeCompanyId = completeData.companies[0]?.id || 1;
      }
      
      return completeData;
    } else {
        console.log("No such document! Creating one for new user.");
        const user = auth.currentUser;
        if (user) {
            await createNewUserDocument(user.uid, user.email || 'unknown');
        }
        return defaultUserData;
    }
  } catch (error) {
    console.error("Error fetching user data from Firestore:", error);
    return defaultUserData;
  }
};

const updateUserData = async (dataToUpdate: Partial<UserData>) => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in to save data.");
      return;
    }
    try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, dataToUpdate);
    } catch (error) {
        console.error("Error updating user data in Firestore:", error);
    }
};

// --- External Response Functions ---

export const fetchQuotationForResponse = async (uid: string, docId: number): Promise<SavedDocument | null> => {
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const quotations = Array.isArray(data.savedQuotations) ? data.savedQuotations : [];
            const targetDoc = quotations.find((q: any) => q.id === docId);
            return targetDoc ? sanitizeDocument(targetDoc) : null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching quotation for response:", error);
        return null;
    }
};

export const respondToQuotation = async (uid: string, docId: number, status: QuotationStatus) => {
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const quotations = Array.isArray(data.savedQuotations) ? data.savedQuotations : [];
            
            const updatedQuotations = quotations.map((q: any) => {
                if (q.id === docId) {
                    return { ...q, quotationStatus: status };
                }
                return q;
            });

            await updateDoc(userRef, { savedQuotations: updatedQuotations });
        }
    } catch (error) {
        console.error("Error saving response:", error);
        throw error;
    }
};

// --- End External Response Functions ---

export const saveCompanies = (companies: Company[]) => {
    updateUserData({ companies });
};

export const saveClients = (clients: Client[]) => {
    updateUserData({ clients });
};

export const saveItems = (items: Item[]) => {
    updateUserData({ items });
};

export const saveItemCategories = (itemCategories: string[]) => {
    updateUserData({ itemCategories });
};

export const saveInvoices = (savedInvoices: SavedDocument[]) => {
    updateUserData({ savedInvoices });
};

export const saveQuotations = (savedQuotations: SavedDocument[]) => {
    updateUserData({ savedQuotations });
};

export const saveActiveCompanyId = (activeCompanyId: number) => {
    updateUserData({ activeCompanyId });
};

export const saveDocument = async (collection: 'savedInvoices' | 'savedQuotations', documentToSave: SavedDocument) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const userData = await fetchUserData(user.uid);
    const documentArray: SavedDocument[] = userData[collection] || [];
    
    const existingDocIndex = documentArray.findIndex(d => d.id === documentToSave.id);

    if (existingDocIndex > -1) {
        documentArray[existingDocIndex] = documentToSave;
    } else {
        documentArray.unshift(documentToSave);
    }
    
    await updateUserData({ [collection]: documentArray });
};

export const resetUserData = async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        companies: defaultUserData.companies,
        clients: defaultUserData.clients,
        items: defaultUserData.items,
        savedInvoices: defaultUserData.savedInvoices,
        savedQuotations: defaultUserData.savedQuotations,
        activeCompanyId: defaultUserData.activeCompanyId,
        itemCategories: defaultUserData.itemCategories,
    });
};

export const deleteAccount = async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser) throw new Error("No user provided for deletion.");

    try {
        // 1. Delete user data document from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await deleteDoc(userDocRef);
        console.log("User data deleted from Firestore.");

        // 2. Delete the user account from Firebase Authentication
        await deleteUser(firebaseUser);
        console.log("User account deleted from Firebase Auth.");

        // The onAuthStateChanged listener in App.tsx will handle the logout
    } catch (error) {
        console.error("Error deleting user account:", error);
        throw error; // Re-throw to be caught by UI
    }
};
