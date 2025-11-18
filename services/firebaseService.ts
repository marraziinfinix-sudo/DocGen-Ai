// NOTE: This service exclusively uses the browser's localStorage for data persistence.
// It is not connected to Firebase. The filename is a remnant from an earlier
// version of the application.
import { Company, Client, Item, SavedDocument, User, DocumentType, LineItem, Details, Payment } from '../types';

const LOCAL_STORAGE_KEY = 'invquo_data';

interface UserData {
    users: User[];
    companies: Company[];
    clients: Client[];
    items: Item[];
    savedInvoices: SavedDocument[];
    savedQuotations: SavedDocument[];
    activeCompanyId: number;
    itemCategories: string[];
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
    itemCategories: [],
};

// Fetches all data from local storage.
export const fetchUserData = (): UserData => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (parsedData && typeof parsedData === 'object') {
        const today = new Date().toISOString().split('T')[0];
        const defaultCompanyDetails = defaultUserData.companies[0].details;

        const sanitizeUser = (user: Partial<User>): User | null => {
            if (user && typeof user.username === 'string' && user.username && typeof user.password === 'string') {
                return {
                    username: user.username,
                    password: user.password,
                };
            }
            return null;
        }

        const sanitizeCompany = (comp: Partial<Company>): Company => {
            const companyId = typeof comp.id === 'number' ? comp.id : Date.now();
            return {
                id: companyId,
                details: { ...defaultCompanyDetails, ...(comp.details || {}) },
                logo: typeof comp.logo === 'string' ? comp.logo : null,
                bankQRCode: typeof comp.bankQRCode === 'string' ? comp.bankQRCode : null,
                defaultNotes: typeof comp.defaultNotes === 'string' ? comp.defaultNotes : defaultUserData.companies[0].defaultNotes,
                taxRate: typeof comp.taxRate === 'number' ? comp.taxRate : 0,
                currency: typeof comp.currency === 'string' ? comp.currency : '$',
                template: typeof comp.template === 'string' ? comp.template : 'classic',
                accentColor: typeof comp.accentColor === 'string' ? comp.accentColor : '#4f46e5',
            };
        };

        const sanitizeClient = (client: Partial<Client | Details>): Client => ({
            id: typeof (client as Client).id === 'number' ? (client as Client).id : Date.now(),
            name: typeof client.name === 'string' ? client.name : '',
            address: typeof client.address === 'string' ? client.address : '',
            email: typeof client.email === 'string' ? client.email : '',
            phone: typeof client.phone === 'string' ? client.phone : '',
        });

        const sanitizeItem = (item: Partial<Item>): Item => ({
            id: typeof item.id === 'number' ? item.id : Date.now(),
            description: typeof item.description === 'string' ? item.description : '',
            costPrice: typeof item.costPrice === 'number' ? item.costPrice : 0,
            price: typeof item.price === 'number' ? item.price : 0,
            category: typeof item.category === 'string' ? item.category : '',
        });
        
        const sanitizeLineItem = (li: Partial<LineItem>): LineItem => ({
            id: typeof li.id === 'number' ? li.id : Date.now(),
            description: typeof li.description === 'string' ? li.description : '',
            quantity: typeof li.quantity === 'number' ? li.quantity : 1,
            costPrice: typeof li.costPrice === 'number' ? li.costPrice : 0,
            markup: typeof li.markup === 'number' ? li.markup : 0,
            price: typeof li.price === 'number' ? li.price : 0,
        });
        
        const sanitizePayment = (p: Partial<Payment>): Payment => ({
            id: typeof p.id === 'number' ? p.id : Date.now(),
            amount: typeof p.amount === 'number' ? p.amount : 0,
            date: typeof p.date === 'string' ? p.date : today,
            method: typeof p.method === 'string' ? p.method : 'Other',
            notes: typeof p.notes === 'string' ? p.notes : '',
        });

        const sanitizeDoc = (doc: Partial<SavedDocument>): SavedDocument => {
            const docId = typeof doc.id === 'number' ? doc.id : Date.now();
            return {
                id: docId,
                documentNumber: typeof doc.documentNumber === 'string' ? doc.documentNumber : '',
                documentType: doc.documentType || DocumentType.Quotation,
                clientDetails: sanitizeClient(doc.clientDetails || {}),
                companyDetails: { ...defaultCompanyDetails, ...(doc.companyDetails || {}) },
                companyLogo: typeof doc.companyLogo === 'string' ? doc.companyLogo : null,
                bankQRCode: typeof doc.bankQRCode === 'string' ? doc.bankQRCode : null,
                issueDate: typeof doc.issueDate === 'string' ? doc.issueDate : today,
                dueDate: typeof doc.dueDate === 'string' ? doc.dueDate : today,
                lineItems: Array.isArray(doc.lineItems) ? doc.lineItems.filter(Boolean).map(sanitizeLineItem) : [],
                notes: typeof doc.notes === 'string' ? doc.notes : '',
                taxRate: typeof doc.taxRate === 'number' ? doc.taxRate : 0,
                currency: typeof doc.currency === 'string' ? doc.currency : '$',
                total: typeof doc.total === 'number' ? doc.total : 0,
                status: doc.status || null,
                quotationStatus: doc.quotationStatus || null,
                paidDate: doc.paidDate || null,
                payments: Array.isArray(doc.payments) ? doc.payments.filter(Boolean).map(sanitizePayment) : [],
                template: typeof doc.template === 'string' ? doc.template : 'classic',
                accentColor: typeof doc.accentColor === 'string' ? doc.accentColor : '#4f46e5',
                recurrence: doc.recurrence || null,
                recurrenceParentId: doc.recurrenceParentId || null,
            };
        };
        
        const loadedUsers = Array.isArray(parsedData.users)
          ? parsedData.users.map(sanitizeUser).filter(Boolean) as User[]
          : [];

        const loadedCompanies = Array.isArray(parsedData.companies) ? parsedData.companies.filter(Boolean).map(sanitizeCompany) : [];

        const completeData: Partial<UserData> = {
          ...defaultUserData,
          ...parsedData,
          users: loadedUsers.length > 0 ? loadedUsers : defaultUserData.users,
          companies: loadedCompanies.length > 0 ? loadedCompanies : defaultUserData.companies.map(sanitizeCompany),
          clients: Array.isArray(parsedData.clients) ? parsedData.clients.filter(Boolean).map(sanitizeClient) : defaultUserData.clients,
          items: Array.isArray(parsedData.items) ? parsedData.items.filter(Boolean).map(sanitizeItem) : defaultUserData.items,
          savedInvoices: Array.isArray(parsedData.savedInvoices) ? parsedData.savedInvoices.filter(Boolean).map(sanitizeDoc) : defaultUserData.savedInvoices,
          savedQuotations: Array.isArray(parsedData.savedQuotations) ? parsedData.savedQuotations.filter(Boolean).map(sanitizeDoc) : defaultUserData.savedQuotations,
          activeCompanyId: typeof parsedData.activeCompanyId === 'number' ? parsedData.activeCompanyId : defaultUserData.activeCompanyId,
          itemCategories: Array.isArray(parsedData.itemCategories) ? parsedData.itemCategories.filter(Boolean) : undefined,
        };
        
        if (completeData.itemCategories === undefined) {
            let migratedCategories: string[] | null = null;
            const oldCategoriesData = localStorage.getItem('itemCategories');
            if (oldCategoriesData) {
                try {
                    const oldCategories = JSON.parse(oldCategoriesData);
                    if (Array.isArray(oldCategories)) {
                        migratedCategories = oldCategories;
                        localStorage.removeItem('itemCategories');
                    }
                } catch (e) { console.error("Could not parse old itemCategories", e); }
            }

            if (migratedCategories === null && Array.isArray(completeData.items)) {
                const derivedCategories = Array.from(new Set(completeData.items.map(i => i.category).filter(Boolean) as string[]));
                migratedCategories = derivedCategories.sort();
            }
            completeData.itemCategories = migratedCategories || [];
        }

        const activeCompanyExists = completeData.companies.some(c => c.id === completeData.activeCompanyId);
        if (!activeCompanyExists && completeData.companies.length > 0) {
            completeData.activeCompanyId = completeData.companies[0].id;
        }

        return completeData as UserData;
      }
    }
  } catch (error) {
    console.error("Error fetching data from local storage, resetting to defaults.", error);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultUserData));
    return defaultUserData;
  }
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultUserData));
  return defaultUserData;
};


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

export const saveItemCategories = (itemCategories: string[]) => {
    const data = fetchUserData();
    saveAllUserData({ ...data, itemCategories });
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