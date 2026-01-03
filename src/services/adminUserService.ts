import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../models/User';
import { Progress } from '../models/Progress';

export const adminUserService = {
  // Obtenir tous les utilisateurs
  async getAllUsers(): Promise<User[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log('📊 Nombre total de documents dans users:', usersSnapshot.size);

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('👤 Utilisateur trouvé:', {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role
        });

        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      });

      console.log('✅ Total utilisateurs chargés:', users.length);
      return users;
    } catch (error) {
      console.error('❌ Erreur dans getAllUsers:', error);
      throw error;
    }
  },

  // Obtenir un utilisateur par ID
  async getUserById(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  },

  // Bloquer/Débloquer un utilisateur
  async toggleUserBlock(userId: string, blocked: boolean): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      blocked,
      updatedAt: new Date(),
    });
  },

  // Supprimer un utilisateur
  async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId));
  },

  // Obtenir la progression globale d'un utilisateur
  async getUserProgress(userId: string): Promise<Progress[]> {
    const progressQuery = query(collection(db, 'progress'), where('userId', '==', userId));
    const progressSnapshot = await getDocs(progressQuery);
    return progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate(),
      lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
    })) as Progress[];
  },
};







