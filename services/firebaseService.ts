import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { Company, Client, Item, SavedDocument } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { User };

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const onAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

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

export const fetchUserData = async (userId: string): Promise<UserData> => {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    // Merge with defaults to ensure all fields are present for robustness
    return {
      ...defaultUserData,
      ...data,
      companies: data.companies && data.companies.length > 0 ? data.companies : defaultUserData.companies,
      activeCompanyId: data.activeCompanyId || (data.companies && data.companies.length > 0 ? data.companies[0].id : 1),
    };
  } else {
    // If no data, create the document with default data
    await setDoc(userDocRef, defaultUserData);
    return defaultUserData;
  }
};

const saveData = async (userId: string, data: Partial<UserData>): Promise<void> => {
    if (!userId) {
        console.error("No user ID provided to saveData");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        // Use set with merge to create the doc if it doesn't exist, or update if it does.
        await setDoc(userDocRef, data, { merge: true });
    } catch (error: any) {
        console.error("Failed to save data to Firestore", error);
    }
};

export const saveCompanies = (userId: string, companies: Company[]) => saveData(userId, { companies });
export const saveClients = (userId: string, clients: Client[]) => saveData(userId, { clients });
export const saveItems = (userId: string, items: Item[]) => saveData(userId, { items });
export const saveInvoices = (userId: string, savedInvoices: SavedDocument[]) => saveData(userId, { savedInvoices });
export const saveQuotations = (userId: string, savedQuotations: SavedDocument[]) => saveData(userId, { savedQuotations });
export const saveActiveCompanyId = (userId: string, activeCompanyId: number) => saveData(userId, { activeCompanyId });

export const saveDocument = async (userId: string, collection: 'savedInvoices' | 'savedQuotations', documentToSave: SavedDocument) => {
    if (!userId) return;
    const currentData = await fetchUserData(userId);
    const documentArray: SavedDocument[] = currentData[collection] || [];
    
    const existingDocIndex = documentArray.findIndex(d => d.id === documentToSave.id);

    if (existingDocIndex > -1) {
        documentArray[existingDocIndex] = documentToSave;
    } else {
        documentArray.unshift(documentToSave);
    }
    
    await saveData(userId, { [collection]: documentArray });
};