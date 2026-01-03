import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Skill } from '../models/Skill';

export const skillService = {
  // Ajouter une compétence
  async addSkill(userId: string, skill: Omit<Skill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const skillData = {
      ...skill,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'skills'), skillData);
    return docRef.id;
  },

  // Obtenir toutes les compétences d'un utilisateur
  async getUserSkills(userId: string): Promise<Skill[]> {
    const q = query(collection(db, 'skills'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Skill[];
  },

  // Obtenir une compétence par ID
  async getSkillById(skillId: string): Promise<Skill | null> {
    const docRef = doc(db, 'skills', skillId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Skill;
    }
    return null;
  },

  // Modifier une compétence
  async updateSkill(skillId: string, updates: Partial<Skill>): Promise<void> {
    const docRef = doc(db, 'skills', skillId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Supprimer une compétence
  async deleteSkill(skillId: string): Promise<void> {
    await deleteDoc(doc(db, 'skills', skillId));
  },
};
