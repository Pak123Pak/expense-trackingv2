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
    serverTimestamp,
    getDoc,
    updateDoc
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
                
                // Query for trips the user has created
                const createdTripsQuery = query(
                    collection(db, 'trips'),
                    where('creatorId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc')
                );
                
                // Query for trips where the user is a tripmate but not the creator
                const invitedTripsQuery = query(
                    collection(db, 'trips'),
                    where('tripmates', 'array-contains', currentUser.uid),
                    where('creatorId', '!=', currentUser.uid)
                );
                
                // Fetch both sets of trips
                const [createdSnapshot, invitedSnapshot] = await Promise.all([
                    getDocs(createdTripsQuery),
                    getDocs(invitedTripsQuery)
                ]);
                
                // Combine and process the results
                const createdTrips = createdSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    isCreator: true
                }));
                
                const invitedTrips = invitedSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    isCreator: false
                }));
                
                // Combine both sets of trips and sort by createdAt
                const allTrips = [...createdTrips, ...invitedTrips].sort((a, b) => {
                    // Convert Firestore timestamps to dates for comparison
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });
                
                setTrips(allTrips);
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
                updatedAt: new Date(),
                isCreator: true
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
            // Check if user is the creator first
            const tripDoc = await getDoc(doc(db, 'trips', tripId));
            if (!tripDoc.exists() || tripDoc.data().creatorId !== currentUser.uid) {
                throw new Error('Only the creator can delete a trip');
            }
            
            await deleteDoc(doc(db, 'trips', tripId));
            setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
            return true;
        } catch (error) {
            console.error('Error deleting trip:', error);
            return false;
        }
    }
    
    // Add a tripmate to a trip
    async function addTripmate(tripId, email) {
        if (!currentUser) return false;
        
        try {
            // Get the trip document
            const tripDoc = await getDoc(doc(db, 'trips', tripId));
            
            if (!tripDoc.exists()) {
                throw new Error('Trip not found');
            }
            
            // Only allow creator or tripmates to add new tripmates
            const tripData = tripDoc.data();
            if (tripData.creatorId !== currentUser.uid && !tripData.tripmates.includes(currentUser.uid)) {
                throw new Error('Not authorized to add tripmates');
            }
            
            return true;
        } catch (error) {
            console.error('Error adding tripmate:', error);
            throw error;
        }
    }
    
    // Get trip details including tripmates
    async function getTripDetails(tripId) {
        if (!currentUser) return null;
        
        try {
            const tripDoc = await getDoc(doc(db, 'trips', tripId));
            
            if (!tripDoc.exists()) {
                throw new Error('Trip not found');
            }
            
            const tripData = tripDoc.data();
            
            // Check if the user has access to this trip
            if (tripData.creatorId !== currentUser.uid && !tripData.tripmates.includes(currentUser.uid)) {
                throw new Error('Not authorized to view this trip');
            }
            
            // Fetch user email for each tripmate ID
            const tripmates = [];
            for (const uid of tripData.tripmates) {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    tripmates.push({
                        uid,
                        email: userDoc.data().email,
                        displayName: userDoc.data().displayName || userDoc.data().email
                    });
                }
            }
            
            return {
                id: tripDoc.id,
                ...tripData,
                tripmates,
                isCreator: tripData.creatorId === currentUser.uid
            };
        } catch (error) {
            console.error('Error getting trip details:', error);
            throw error;
        }
    }

    const value = {
        trips,
        loading,
        addTrip,
        deleteTrip,
        addTripmate,
        getTripDetails
    };

    return (
        <TripContext.Provider value={value}>
            {children}
        </TripContext.Provider>
    );
} 