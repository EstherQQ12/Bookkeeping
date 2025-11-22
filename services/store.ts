
import { v4 as uuidv4 } from 'uuid';
import { Transaction, UserProfile, TransactionType } from '../types';
import { auth, db, isFirebaseConfigured } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';

// --- AUTHENTICATION ---

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full profile from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as UserProfile);
        } else {
            // Fallback if doc missing
           callback(null);
        }
      } else {
        callback(null);
      }
    });
  } else {
    // Offline Mode: Check LocalStorage once
    const saved = localStorage.getItem('pocketbook_user');
    callback(saved ? JSON.parse(saved) : null);
    return () => {}; // no-op unsubscribe
  }
};

export const loginUser = async (emailOrName: string, password: string): Promise<UserProfile> => {
  if (isFirebaseConfigured && auth) {
    // For Firebase, we need strictly Email. 
    // If the app only took a name before, we might need to change AuthScreen to enforce Email.
    // For now, we assume the input is an email if online.
    const userCredential = await signInWithEmailAndPassword(auth, emailOrName, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    return userDoc.data() as UserProfile;
  } else {
    // Offline Mock
    const saved = localStorage.getItem('pocketbook_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user.name === emailOrName || user.guardianEmail === emailOrName) { // Simple loose check
         return user;
      }
    }
    throw new Error("Offline user not found or password mismatch.");
  }
};

export const registerUser = async (profile: UserProfile): Promise<UserProfile> => {
  if (isFirebaseConfigured && auth && db) {
    // Create Auth User. We need an email. 
    // If profile.guardianEmail exists, we use that as the 'account' email for simplicity in this hybrid logic,
    // OR we generate a fake one for the student if they didn't provide one.
    const emailToRegister = profile.guardianEmail || `${profile.name.replace(/\s/g, '').toLowerCase()}@pocketbook.app`;
    
    const userCredential = await createUserWithEmailAndPassword(auth, emailToRegister, profile.password);
    
    // Save Profile to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
        ...profile,
        id: userCredential.user.uid
    });
    
    return profile;
  } else {
    // Offline Save
    localStorage.setItem('pocketbook_user', JSON.stringify(profile));
    return profile;
  }
};

export const logoutUser = async () => {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem('pocketbook_user');
  }
};

export const updateUserProfile = async (profile: UserProfile) => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { ...profile });
    } else {
        localStorage.setItem('pocketbook_user', JSON.stringify(profile));
    }
}

// --- TRANSACTIONS ---

export const subscribeToTransactions = (user: UserProfile, callback: (transactions: Transaction[]) => void) => {
  if (isFirebaseConfigured && db && auth && auth.currentUser) {
    const q = query(
        collection(db, "transactions"), 
        where("userId", "==", auth.currentUser.uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      // Sort locally by date desc
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(txs);
    });
  } else {
    // Offline Mode
    const load = () => {
        const saved = localStorage.getItem('pocketbook_data');
        const txs = saved ? JSON.parse(saved) : [];
        callback(txs);
    };
    load();
    // We return a dummy unsubscribe
    return () => {};
  }
};

export const addTransaction = async (data: Omit<Transaction, 'id'>) => {
  if (isFirebaseConfigured && db && auth && auth.currentUser) {
    await addDoc(collection(db, "transactions"), {
      ...data,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    });
  } else {
    const saved = localStorage.getItem('pocketbook_data');
    const current = saved ? JSON.parse(saved) : [];
    const newItem = { id: uuidv4(), ...data };
    localStorage.setItem('pocketbook_data', JSON.stringify([newItem, ...current]));
    // Trigger a reload in the UI is tricky with strictly offline storage without an event system, 
    // but App.tsx handles its own state for offline mostly.
    // However, passing the new item back helps.
    return newItem; 
  }
};

export const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, "transactions", id), data);
    } else {
        const saved = localStorage.getItem('pocketbook_data');
        let current = saved ? JSON.parse(saved) : [];
        current = current.map((t: Transaction) => t.id === id ? { ...t, ...data } : t);
        localStorage.setItem('pocketbook_data', JSON.stringify(current));
    }
};

export const deleteTransaction = async (id: string) => {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "transactions", id));
  } else {
    const saved = localStorage.getItem('pocketbook_data');
    const current = saved ? JSON.parse(saved) : [];
    const filtered = current.filter((t: Transaction) => t.id !== id);
    localStorage.setItem('pocketbook_data', JSON.stringify(filtered));
  }
};
