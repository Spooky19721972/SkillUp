import { collection, getDocs, getDoc, doc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Badge } from '../models/Badge';

export const badgeService = {
  // Obtenir tous les badges disponibles
  async getAllBadges(): Promise<Badge[]> {
    const querySnapshot = await getDocs(collection(db, 'badges'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      unlockedAt: doc.data().unlockedAt?.toDate(),
    })) as Badge[];
  },

  // Obtenir les badges d'un utilisateur
  async getUserBadges(userId: string): Promise<Badge[]> {
    const q = query(collection(db, 'badges'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      unlockedAt: doc.data().unlockedAt?.toDate(),
    })) as Badge[];
  },

  // Débloquer un badge pour un utilisateur
  async unlockBadge(userId: string, badgeId: string): Promise<void> {
    const badgeRef = doc(db, 'badges', badgeId);
    await updateDoc(badgeRef, {
      userId,
      unlockedAt: Timestamp.now(),
    });
  },
};
