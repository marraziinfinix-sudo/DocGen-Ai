import { Company, Client, Item, SavedDocument } from '../types';

const STORAGE_KEY = 'invquo_userData';

// FIX: Added UserData interface to ensure type consistency between the default user data object and the `Company` type, which has optional properties.
interface UserData {
    companies: Company[];
    clients: Client[];
    items: Item[];
    savedInvoices: SavedDocument[];
    savedQuotations: SavedDocument[];
    activeCompanyId: number;
}

const defaultUserData: UserData = {
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
};

export const fetchUserData = (): UserData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsedData = JSON.parse(data);
      // Ensure all default fields are present for robustness
      return {
        ...defaultUserData,
        ...parsedData,
        companies: parsedData.companies && parsedData.companies.length > 0 ? parsedData.companies : defaultUserData.companies,
        activeCompanyId: parsedData.activeCompanyId || defaultUserData.activeCompanyId
      };
    }
  } catch (error) {
    console.error("Failed to load data from localStorage", error);
  }
  // If no data or an error occurs, set default data in localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUserData));
  return defaultUserData;
};

const saveData = (data: Partial<UserData>): void => {
    try {
        const currentData = fetchUserData();
        const newData = { ...currentData, ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
};

// FIX: Added placeholder for signInWithGoogle to fix the module export error in AuthPage.tsx.
export const signInWithGoogle = () => {
    return Promise.reject('Sign in functionality is not implemented.');
};

export const saveCompanies = (companies: Company[]) => saveData({ companies });
export const saveClients = (clients: Client[]) => saveData({ clients });
export const saveItems = (items: Item[]) => saveData({ items });
export const saveInvoices = (savedInvoices: SavedDocument[]) => saveData({ savedInvoices });
export const saveQuotations = (savedQuotations: SavedDocument[]) => saveData({ savedQuotations });
export const saveActiveCompanyId = (activeCompanyId: number) => saveData({ activeCompanyId });

export const saveDocument = (collection: 'savedInvoices' | 'savedQuotations', documentToSave: SavedDocument) => {
    const currentData = fetchUserData();
    const documentArray: SavedDocument[] = currentData[collection] || [];
    
    const existingDocIndex = documentArray.findIndex(d => d.id === documentToSave.id);

    if (existingDocIndex > -1) {
        documentArray[existingDocIndex] = documentToSave;
    } else {
        documentArray.unshift(documentToSave);
    }
    
    saveData({ [collection]: documentArray });
};
