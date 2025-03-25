import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password, displayName) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Set the user's display name
                return updateProfile(userCredential.user, { displayName })
                    .then(() => {
                        // Create user document in Firestore
                        return setDoc(doc(db, 'users', userCredential.user.uid), {
                            email,
                            displayName,
                            homeCurrency: 'hkd',
                            expenseSortPreference: 'modifiedDesc', // Default sort preference
                            createdAt: new Date().toISOString()
                        });
                    })
                    .then(() => userCredential.user);
            });
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    // Function to update display name
    async function updateDisplayName(newDisplayName) {
        if (!currentUser) return;
        
        try {
            // Update in Firebase Authentication
            await updateProfile(currentUser, { displayName: newDisplayName });
            
            // Update in Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: newDisplayName
            });
            
            // Update the local user state with the new display name
            setCurrentUser({
                ...currentUser,
                displayName: newDisplayName
            });
            
            return true;
        } catch (error) {
            console.error('Error updating display name:', error);
            throw error;
        }
    }

    // Function to update expense sort preference
    async function updateExpenseSortPreference(sortMethod) {
        if (!currentUser) return false;
        
        try {
            // Update in Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                expenseSortPreference: sortMethod
            });
            
            return true;
        } catch (error) {
            console.error('Error updating expense sort preference:', error);
            return false;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        updateDisplayName,
        updateExpenseSortPreference
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 