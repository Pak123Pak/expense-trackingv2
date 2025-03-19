import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    getDocs, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const TripContext = createContext();

export function useTrip() {
    return useContext(TripContext);
}

export function TripProvider({ children }) {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    // Fetch trips whenever the user changes
    useEffect(() => {
        async function fetchTrips() {
            if (!currentUser) {
                setTrips([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const tripsQuery = query(
                    collection(db, 'trips'),
                    where('creatorId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(tripsQuery);
                const tripsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTrips(tripsData);
            } catch (error) {
                console.error('Error fetching trips:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchTrips();
    }, [currentUser]);

    // Add a new trip
    async function addTrip(name) {
        if (!currentUser) return null;

        const newTrip = {
            name,
            creatorId: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            tripmates: [currentUser.uid]
        };

        try {
            const docRef = await addDoc(collection(db, 'trips'), newTrip);
            const tripWithId = {
                id: docRef.id,
                ...newTrip,
                createdAt: new Date(), // Use local date as serverTimestamp is not immediately available
                updatedAt: new Date()
            };
            setTrips(prevTrips => [tripWithId, ...prevTrips]);
            return tripWithId;
        } catch (error) {
            console.error('Error adding trip:', error);
            return null;
        }
    }

    // Delete a trip
    async function deleteTrip(tripId) {
        if (!currentUser) return false;

        try {
            await deleteDoc(doc(db, 'trips', tripId));
            setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
            return true;
        } catch (error) {
            console.error('Error deleting trip:', error);
            return false;
        }
    }

    const value = {
        trips,
        loading,
        addTrip,
        deleteTrip
    };

    return (
        <TripContext.Provider value={value}>
            {children}
        </TripContext.Provider>
    );
} 