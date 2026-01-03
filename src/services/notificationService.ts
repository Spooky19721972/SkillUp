import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification } from '../models/Notification';

export const notificationService = {
  // Créer une notification
  async createNotification(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>): Promise<string> {
    const notificationData = {
      ...notification,
      userId,
      read: false,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  },

  // Obtenir les notifications d'un utilisateur
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Notification[];

    // Tri côté client pour éviter l'erreur d'index manquant Firestore
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  },
};
