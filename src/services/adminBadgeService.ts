import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Badge, BadgeCondition } from '../models/Badge';

export const adminBadgeService = {
  // Obtenir tous les badges
  async getAllBadges(): Promise<Badge[]> {
    const badgesSnapshot = await getDocs(collection(db, 'badges'));
    return badgesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      unlockedAt: doc.data().unlockedAt?.toDate(),
    })) as Badge[];
  },

  // Obtenir un badge par ID
  async getBadgeById(badgeId: string): Promise<Badge | null> {
    const badgeDoc = await getDoc(doc(db, 'badges', badgeId));
    if (badgeDoc.exists()) {
      return {
        id: badgeDoc.id,
        ...badgeDoc.data(),
        unlockedAt: badgeDoc.data().unlockedAt?.toDate(),
      } as Badge;
    }
    return null;
  },

  // Créer un badge
  async createBadge(badge: Omit<Badge, 'id' | 'unlockedAt'>): Promise<string> {
    // Filtrer les champs undefined pour éviter les erreurs Firestore
    const badgeData: any = {
      title: badge.title,
      description: badge.description,
    };

    // Ajouter les champs optionnels uniquement s'ils sont définis
    if (badge.icon !== undefined && badge.icon !== null && badge.icon !== '') {
      badgeData.icon = badge.icon;
    }
    if (badge.color !== undefined && badge.color !== null && badge.color !== '') {
      badgeData.color = badge.color;
    }
    if (badge.image !== undefined && badge.image !== null && badge.image !== '') {
      badgeData.image = badge.image;
    }
    if (badge.skillId !== undefined && badge.skillId !== null && badge.skillId !== '') {
      badgeData.skillId = badge.skillId;
    }
    if (badge.conditions !== undefined && badge.conditions !== null) {
      const conditions: any = {
        type: badge.conditions.type,
        value: badge.conditions.value,
      };
      if (badge.conditions.skillIds !== undefined && badge.conditions.skillIds !== null && badge.conditions.skillIds.length > 0) {
        conditions.skillIds = badge.conditions.skillIds;
      }
      if (badge.conditions.quizId !== undefined && badge.conditions.quizId !== null && badge.conditions.quizId !== '') {
        conditions.quizId = badge.conditions.quizId;
      }
      badgeData.conditions = conditions;
    }

    const docRef = await addDoc(collection(db, 'badges'), badgeData);
    return docRef.id;
  },

  // Modifier un badge
  async updateBadge(badgeId: string, updates: Partial<Badge>): Promise<void> {
    await updateDoc(doc(db, 'badges', badgeId), updates);
  },

  // Supprimer un badge
  async deleteBadge(badgeId: string): Promise<void> {
    await deleteDoc(doc(db, 'badges', badgeId));
  },
};







