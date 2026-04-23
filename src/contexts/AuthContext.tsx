import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) return userDoc.data() as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const profile = await fetchUserProfile(auth.currentUser.uid);
      setUser(profile);
    }
  };

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchUserProfile(firebaseUser.uid);
      setUser(profile);
      return { error: null };
    } catch (error: any) {
      let errorMessage = "An error occurred during sign in.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { error: new Error(errorMessage) };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);

      let profile = await fetchUserProfile(firebaseUser.uid);

      if (!profile) {
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Student',
          role: 'student',
          created_at: new Date().toISOString(),
        } as User;

        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        profile = newUser;
      }

      setUser(profile);
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message || "An error occurred with Google Sign In.") };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user,
        loading,
        signIn,
        signInWithGoogle,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
