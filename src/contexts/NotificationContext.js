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
    updateDoc,
    onSnapshot,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function useNotification() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const { currentUser } = useAuth();

    // Subscribe to notifications whenever the user changes
    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);
        const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
        const q = query(
            notificationsRef,
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notificationsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            
            setNotifications(notificationsData);
            // Count unread notifications
            const unread = notificationsData.filter(notification => !notification.read).length;
            setUnreadCount(unread);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Send a trip invitation notification
    async function sendTripInvitation(tripId, tripName, recipientEmail) {
        if (!currentUser) return null;

        try {
            // First, find the user by email
            const usersQuery = query(
                collection(db, 'users'),
                where('email', '==', recipientEmail)
            );
            
            const querySnapshot = await getDocs(usersQuery);
            
            if (querySnapshot.empty) {
                throw new Error('User not found');
            }
            
            const recipientId = querySnapshot.docs[0].id;
            
            // Create notification
            const notification = {
                type: 'tripInvitation',
                fromUser: currentUser.uid,
                fromUserEmail: currentUser.email,
                tripId,
                tripName,
                status: 'pending',
                read: false,
                createdAt: serverTimestamp()
            };
            
            await addDoc(
                collection(db, 'users', recipientId, 'notifications'),
                notification
            );
            
            return true;
        } catch (error) {
            console.error('Error sending trip invitation:', error);
            throw error;
        }
    }

    // Respond to a trip invitation
    async function respondToInvitation(notificationId, accepted) {
        if (!currentUser) return false;

        try {
            const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notificationId);
            
            // Mark as read and update status
            await updateDoc(notificationRef, {
                read: true,
                status: accepted ? 'accepted' : 'declined'
            });
            
            if (accepted) {
                // Find the notification data from state
                const notification = notifications.find(n => n.id === notificationId);
                
                if (!notification) {
                    throw new Error('Notification not found');
                }
                
                // Add user to trip's tripmates
                const tripRef = doc(db, 'trips', notification.tripId);
                
                // Get current tripmates
                const tripDoc = await getDoc(doc(db, 'trips', notification.tripId));
                if (!tripDoc.exists()) {
                    throw new Error('Trip not found');
                }
                
                const tripData = tripDoc.data();
                const updatedTripmates = [...(tripData.tripmates || []), currentUser.uid];
                
                // Update tripmates
                await updateDoc(tripRef, {
                    tripmates: updatedTripmates,
                    updatedAt: serverTimestamp()
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error responding to invitation:', error);
            throw error;
        }
    }

    // Delete a notification
    async function deleteNotification(notificationId) {
        if (!currentUser) return false;

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', notificationId));
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }

    // Mark a notification as read
    async function markAsRead(notificationId) {
        if (!currentUser) return false;

        try {
            const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true
            });
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    const value = {
        notifications,
        unreadCount,
        loading,
        sendTripInvitation,
        respondToInvitation,
        deleteNotification,
        markAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
} 