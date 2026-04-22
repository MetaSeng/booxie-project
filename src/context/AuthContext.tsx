import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial setup for document if it doesn't exist
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists() && !firebaseUser.isAnonymous) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'user',
              rewardPoints: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.warn("AuthContext: Error checking/creating user doc", error);
        }

        // Real-time listener for profile
        unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data());
          } else if (firebaseUser.isAnonymous) {
            // Virtual profile for anonymous users
            setProfile({
              uid: firebaseUser.uid,
              name: 'Guest User',
              role: 'guest',
              rewardPoints: 0,
              isAnonymous: true
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("AuthContext: Profile listener error", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
