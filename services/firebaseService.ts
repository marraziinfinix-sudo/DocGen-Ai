import { Company, Client, Item, SavedDocument, User } from '../types';

const LOCAL_STORAGE_KEY = 'invquo_data';

interface UserData {
    users: User[];
    companies: Company[];
    clients: Client[];
    items: Item[];
    savedInvoices: SavedDocument[];
    savedQuotations: SavedDocument[];
    activeCompanyId: number;
}

const defaultUserData: UserData = {
    users: [{ username: 'admin', password: 'password123' }],
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
      const parsedData = JSON.parse(savedData);
      if (parsedData && typeof parsedData === 'object' && 'companies' in parsedData) {
        // Ensure users array exists
        if (!parsedData.users) {
            parsedData.users = defaultUserData.users;
        }
        return parsedData;
      }
    }
  } catch (error) {
    console.error("Error fetching data from local storage:", error);
  }
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

export const fetchUsers = (): User[] => {
    const data = fetchUserData();
    return data.users;
};

export const saveUsers = (users: User[]) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, users });
};

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

// FIX: Add placeholder for missing signInWithGoogle function to resolve compilation error.
export const signInWithGoogle = async (): Promise<void> => {
  // This function is not fully implemented as the app currently uses local username/password authentication via LoginPage.tsx.
  // AuthPage.tsx, which uses this function, is not currently used in the application.
  console.warn("signInWithGoogle is a placeholder and has no effect.");
  return Promise.resolve();
};