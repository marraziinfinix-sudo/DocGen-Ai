import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { Company, Client, Item, SavedDocument, User } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

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

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // Check if user document exists, if not, create it
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, defaultUserData);
    }
  } catch (error) {
    console.error("Error during sign-in:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export const fetchUserData = async (uid: string): Promise<UserData> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserData;
  } else {
    // This case should ideally be handled at sign-in, but as a fallback:
    await setDoc(userDocRef, defaultUserData);
    return defaultUserData;
  }
};

const saveUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, data);
};


export const saveCompanies = (uid: string, companies: Company[]) => saveUserData(uid, { companies });
export const saveClients = (uid: string, clients: Client[]) => saveUserData(uid, { clients });
export const saveItems = (uid: string, items: Item[]) => saveUserData(uid, { items });
export const saveInvoices = (uid: string, savedInvoices: SavedDocument[]) => saveUserData(uid, { savedInvoices });
export const saveQuotations = (uid: string, savedQuotations: SavedDocument[]) => saveUserData(uid, { savedQuotations });
export const saveActiveCompanyId = (uid: string, activeCompanyId: number) => saveUserData(uid, { activeCompanyId });

export const saveDocument = async (uid: string, collection: 'savedInvoices' | 'savedQuotations', documentToSave: SavedDocument) => {
    const userData = await fetchUserData(uid);
    const documentArray: SavedDocument[] = userData[collection] || [];
    
    const existingDocIndex = documentArray.findIndex(d => d.id === documentToSave.id);

    if (existingDocIndex > -1) {
        documentArray[existingDocIndex] = documentToSave;
    } else {
        documentArray.unshift(documentToSave);
    }
    
    await saveUserData(uid, { [collection]: documentArray });
};
