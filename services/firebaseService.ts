import { Company, Client, Item, SavedDocument } from '../types';

// Fix: Add a placeholder for the missing `signInWithGoogle` function to resolve an import error.
export const signInWithGoogle = async () => {
  console.error("signInWithGoogle is not implemented.");
  // The UI in AuthPage.tsx has a try/catch that will handle this error gracefully.
  throw new Error("Sign-in functionality is not implemented yet.");
};

const LOCAL_STORAGE_KEY = 'invquo_ai_data';

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

// Fetches all data from local storage.
export const fetchUserData = (): UserData => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      // Basic validation to ensure the loaded data has the expected structure
      const parsedData = JSON.parse(savedData);
      if (parsedData && typeof parsedData === 'object' && 'companies' in parsedData) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error("Error fetching data from local storage:", error);
  }
  // If no data or data is corrupt, return default and save it
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultUserData));
  return defaultUserData;
};

// A generic save function that overwrites all data.
const saveAllUserData = (data: UserData): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data to local storage:", error);
  }
};

// The following functions get the current data, update a part of it, and save it back.
export const saveCompanies = (companies: Company[]) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, companies });
};

export const saveClients = (clients: Client[]) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, clients });
};

export const saveItems = (items: Item[]) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, items });
};

export const saveInvoices = (savedInvoices: SavedDocument[]) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, savedInvoices });
};

export const saveQuotations = (savedQuotations: SavedDocument[]) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, savedQuotations });
};

export const saveActiveCompanyId = (activeCompanyId: number) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, activeCompanyId });
};

export const saveDocument = (collection: 'savedInvoices' | 'savedQuotations', documentToSave: SavedDocument) => {
    const data = fetchUserData();
    const documentArray: SavedDocument[] = data[collection] || [];
    
    const existingDocIndex = documentArray.findIndex(d => d.id === documentToSave.id);

    if (existingDocIndex > -1) {
        documentArray[existingDocIndex] = documentToSave;
    } else {
        documentArray.unshift(documentToSave);
    }
    
    saveAllUserData({ ...data, [collection]: documentArray });
};
