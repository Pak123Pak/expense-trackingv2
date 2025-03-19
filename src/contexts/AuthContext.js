import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    async function signup(email, password, displayName) {
        try {
            // Clear any previous errors
            setAuthError(null);
            
            // Create the user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Set the user's display name
            await updateProfile(userCredential.user, { displayName });
            
            // Check if user document already exists
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);
            
            // Create user document in Firestore if it doesn't exist
            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    email,
                    displayName,
                    homeCurrency: 'hkd',
                    createdAt: new Date().toISOString()
                });
            }
            
            return userCredential.user;
        } catch (error) {
            console.error("Signup error:", error);
            setAuthError(error);
            throw error;
        }
    }

    function login(email, password) {
        setAuthError(null);
        return signInWithEmailAndPassword(auth, email, password)
            .catch(error => {
                console.error("Login error:", error);
                setAuthError(error);
                throw error;
            });
    }

    function logout() {
        setAuthError(null);
        return signOut(auth)
            .catch(error => {
                console.error("Logout error:", error);
                setAuthError(error);
                throw error;
            });
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        }, error => {
            console.error("Auth state changed error:", error);
            setAuthError(error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        authError,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 