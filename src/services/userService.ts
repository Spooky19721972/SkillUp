import { getDoc, doc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserProfile } from '../models/User';

export const userService = {
  // ajouter profil dans le firestore
  async createUserProfile(userId: string, data: { name: string; email: string }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userData = {
        name: data.name,
        email: data.email,
        role: 'user', // Par défaut, les nouveaux utilisateurs sont des utilisateurs normaux
        skills: [],
        goals: [],
        badges: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(userRef, userData);
      console.log('✅ Profil utilisateur créé dans Firestore:', userId);
    } catch (error) {
      console.error('❌ Erreur création profil utilisateur:', error);
      throw error;
    }
  },

  // Obtenir le profil utilisateur
  async getUserProfile(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  },

  // Mettre à jour le profil
  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...profile,
      updatedAt: Timestamp.now(),
    });
  },
};
