import { Company, Client, Item, SavedDocument, DocumentType, LineItem, Details, Payment } from '../types';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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

const defaultUserData: Omit<UserData, 'email'> = {
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

export const fetchUserData = async (uid: string): Promise<UserData> => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const parsedData = docSnap.data();
      // Basic sanitization/defaulting for robustness
      const today = new Date().toISOString().split('T')[0];
      const defaultCompanyDetails = defaultUserData.companies[0].details;

      const sanitizeCompany = (comp: Partial<Company>): Company => ({
          id: typeof comp.id === 'number' ? comp.id : Date.now(),
          details: { ...defaultCompanyDetails, ...(comp.details || {}) },
          logo: typeof comp.logo === 'string' ? comp.logo : null,
          bankQRCode: typeof comp.bankQRCode === 'string' ? comp.bankQRCode : null,
          defaultNotes: typeof comp.defaultNotes === 'string' ? comp.defaultNotes : defaultUserData.companies[0].defaultNotes,
          taxRate: typeof comp.taxRate === 'number' ? comp.taxRate : 0,
          currency: typeof comp.currency === 'string' ? comp.currency : '$',
          template: typeof comp.template === 'string' ? comp.template : 'classic',
          accentColor: typeof comp.accentColor === 'string' ? comp.accentColor : '#4f46e5',
      });
      
      const completeData: UserData = {
        companies: Array.isArray(parsedData.companies) ? parsedData.companies.map(sanitizeCompany) : defaultUserData.companies,
        clients: Array.isArray(parsedData.clients) ? parsedData.clients : defaultUserData.clients,
        items: Array.isArray(parsedData.items) ? parsedData.items : defaultUserData.items,
        savedInvoices: Array.isArray(parsedData.savedInvoices) ? parsedData.savedInvoices : defaultUserData.savedInvoices,
        savedQuotations: Array.isArray(parsedData.savedQuotations) ? parsedData.savedQuotations : defaultUserData.savedQuotations,
        activeCompanyId: typeof parsedData.activeCompanyId === 'number' ? parsedData.activeCompanyId : defaultUserData.activeCompanyId,
        itemCategories: Array.isArray(parsedData.itemCategories) ? parsedData.itemCategories : defaultUserData.itemCategories,
      };
      
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
