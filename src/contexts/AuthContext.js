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

    // Add function to update display name
    async function updateDisplayName(newDisplayName) {
        if (!currentUser) return Promise.reject(new Error('No user is logged in'));
        
        try {
            // Update display name in Firebase Auth
            await updateProfile(currentUser, { displayName: newDisplayName });
            
            // Also update in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { displayName: newDisplayName });
            
            // Update local state
            setCurrentUser({ ...currentUser });
            
            return Promise.resolve();
        } catch (error) {
            console.error('Error updating display name:', error);
            return Promise.reject(error);
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
        updateDisplayName
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 