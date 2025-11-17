
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  DocumentData,
  updateDoc
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { Company, Client, Item, SavedDocument } from '../types';

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- AUTH FUNCTIONS ---

export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = (): Promise<void> => {
  return signInWithPopup(auth, provider).then(() => {});
};

export const signOutUser = (): Promise<void> => {
  return signOut(auth);
};


// --- FIRESTORE FUNCTIONS ---

const defaultUserData = {
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

export const fetchUserData = async (userId: string) => {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    // Ensure all fields from defaultUserData exist on the fetched data
    const fetchedData = userDocSnap.data();
    return {
      ...defaultUserData,
      ...fetchedData
    };
  } else {
    // First time user, create their document
    await setDoc(userDocRef, defaultUserData);
    return defaultUserData;
  }
};

const saveData = async (userId: string, data: Partial<DocumentData>): Promise<void> => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, data, { merge: true });
};

export const saveCompanies = (userId: string, companies: Company[]) => saveData(userId, { companies });
export const saveClients = (userId: string, clients: Client[]) => saveData(userId, { clients });
export const saveItems = (userId: string, items: Item[]) => saveData(userId, { items });
export const saveInvoices = (userId: string, savedInvoices: SavedDocument[]) => saveData(userId, { savedInvoices });
export const saveQuotations = (userId: string, savedQuotations: SavedDocument[]) => saveData(userId, { savedQuotations });
export const saveActiveCompanyId = (userId: string, activeCompanyId: number) => saveData(userId, { activeCompanyId });

// This function will update a single document within its array in Firestore.
export const saveDocument = async (userId: string, collection: 'savedInvoices' | 'savedQuotations', documentToSave: SavedDocument) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const documentArray: SavedDocument[] = userData[collection] || [];
        
        const existingDocIndex = documentArray.findIndex(d => d.id === documentToSave.id);

        if (existingDocIndex > -1) {
            // Update existing document
            documentArray[existingDocIndex] = documentToSave;
        } else {
            // Add new document
            documentArray.unshift(documentToSave); // Add to the beginning
        }
        
        await updateDoc(userDocRef, { [collection]: documentArray });
    }
};
