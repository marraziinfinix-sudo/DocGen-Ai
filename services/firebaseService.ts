
import { User } from 'firebase/auth';
import { Company, Client, Item, SavedDocument } from '../types';

// This is a mock service to allow the app to run without a real Firebase backend.
// It simulates a logged-in user and provides some initial data.

const MOCK_USER: User = {
  uid: 'mock-user-id',
  email: 'user@example.com',
  displayName: 'Mock User',
  photoURL: null,
  emailVerified: true,
  phoneNumber: null,
  isAnonymous: false,
} as any as User;

let authStateCallback: ((user: User | null) => void) | null = null;
let currentUser: User | null = MOCK_USER; // Start as logged in to see the main app.

export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  authStateCallback = callback;
  // Simulate async nature of auth
  setTimeout(() => {
    if (authStateCallback) {
      authStateCallback(currentUser);
    }
  }, 50);
  
  return () => { // Return unsubscribe function
    authStateCallback = null;
  };
};

export const signInWithGoogle = async (): Promise<void> => {
  console.log('Mock sign in');
  currentUser = MOCK_USER;
  if (authStateCallback) {
    authStateCallback(currentUser);
  }
};

export const signOutUser = async (): Promise<void> => {
  console.log('Mock sign out');
  currentUser = null;
  if (authStateCallback) {
    authStateCallback(currentUser);
  }
};

// --- Mock Data ---
const MOCK_DATA = {
    companies: [{
        id: 1,
        details: { name: 'My Company', address: '123 Innovation Drive', email: 'hello@my.co', phone: '555-0101', bankName: 'First Mock Bank', accountNumber: '987654321', website: 'my.co', taxId: 'TAXID123' },
        logo: null,
        bankQRCode: null,
        defaultNotes: 'Thank you for your business. Please pay within 30 days.',
        taxRate: 8,
        currency: '$',
        template: 'modern',
        accentColor: '#4f46e5',
    }],
    clients: [] as Client[],
    items: [] as Item[],
    savedInvoices: [] as SavedDocument[],
    savedQuotations: [] as SavedDocument[],
    activeCompanyId: 1,
};

export const fetchUserData = async (userId: string) => {
  console.log(`Mock fetch user data for: ${userId}`);
  return Promise.resolve(MOCK_DATA);
};

// Mock save functions - they just log to the console
const mockSave = (type: string, userId: string, data: any) => {
  console.log(`Mock save [${type}] for user ${userId}:`, data);
  return Promise.resolve();
};

export const saveCompanies = (userId: string, companies: Company[]) => mockSave('Companies', userId, companies);
export const saveClients = (userId: string, clients: Client[]) => mockSave('Clients', userId, clients);
export const saveItems = (userId: string, items: Item[]) => mockSave('Items', userId, items);
export const saveInvoices = (userId: string, invoices: SavedDocument[]) => mockSave('Invoices', userId, invoices);
export const saveQuotations = (userId: string, quotations: SavedDocument[]) => mockSave('Quotations', userId, quotations);
export const saveActiveCompanyId = (userId: string, id: number) => mockSave('ActiveCompanyId', userId, id);

export const saveDocument = async (userId: string, collection: 'savedInvoices' | 'savedQuotations', document: SavedDocument) => {
  console.log(`Mock save document to [${collection}] for user ${userId}:`, document);
  return Promise.resolve();
};
