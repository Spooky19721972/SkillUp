import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Goal } from '../models/Goal';

export const goalService = {
  // Ajouter un objectif
  async addGoal(userId: string, goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'completed'>): Promise<string> {
    const goalData = {
      ...goal,
      userId,
      completed: false,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'goals'), goalData);
    return docRef.id;
  },

  // Obtenir tous les objectifs d'un utilisateur
  async getUserGoals(userId: string): Promise<Goal[]> {
    const q = query(collection(db, 'goals'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      targetDate: doc.data().targetDate?.toDate(),
    })) as Goal[];
  },

  // Modifier un objectif
  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    await updateDoc(doc(db, 'goals', goalId), updates);
  },

  // Marquer un objectif comme complété
  async markGoalCompleted(goalId: string): Promise<void> {
    await updateDoc(doc(db, 'goals', goalId), { completed: true });
  },

  // Supprimer un objectif
  async deleteGoal(goalId: string): Promise<void> {
    await deleteDoc(doc(db, 'goals', goalId));
  },
};
