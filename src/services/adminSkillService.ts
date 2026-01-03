import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Skill } from '../models/Skill';
import { Course } from '../models/Course';
import { Quiz } from '../models/Quiz';
import { Badge } from '../models/Badge';

export const adminSkillService = {
  // Obtenir toutes les compétences
  async getAllSkills(): Promise<Skill[]> {
    const skillsSnapshot = await getDocs(collection(db, 'skills'));
    return skillsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Skill[];
  },

  // Obtenir une compétence par ID
  async getSkillById(skillId: string): Promise<Skill | null> {
    const skillDoc = await getDoc(doc(db, 'skills', skillId));
    if (skillDoc.exists()) {
      return {
        id: skillDoc.id,
        ...skillDoc.data(),
        createdAt: skillDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: skillDoc.data().updatedAt?.toDate() || new Date(),
      } as Skill;
    }
    return null;
  },

  // Ajouter une compétence globale (pas liée à un utilisateur)
  async addSkill(skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const skillData = {
      ...skill,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'skills'), skillData);
    return docRef.id;
  },

  // Modifier une compétence
  async updateSkill(skillId: string, updates: Partial<Skill>): Promise<void> {
    await updateDoc(doc(db, 'skills', skillId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Supprimer une compétence
  async deleteSkill(skillId: string): Promise<void> {
    await deleteDoc(doc(db, 'skills', skillId));
  },

  // Obtenir les cours associés à une compétence
  async getSkillCourses(skillId: string): Promise<Course[]> {
    const coursesQuery = query(collection(db, 'courses'), where('skillId', '==', skillId));
    const coursesSnapshot = await getDocs(coursesQuery);
    return coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Course[];
  },

  // Obtenir les quiz associés à une compétence
  async getSkillQuizzes(skillId: string): Promise<Quiz[]> {
    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('skillId', '==', skillId)
    );
    const quizzesSnapshot = await getDocs(quizzesQuery);
    return quizzesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Quiz[];
  },

  // Obtenir les badges associés à une compétence
  async getSkillBadges(skillId: string): Promise<Badge[]> {
    const badgesQuery = query(collection(db, 'badges'), where('skillId', '==', skillId));
    const badgesSnapshot = await getDocs(badgesQuery);
    return badgesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      unlockedAt: doc.data().unlockedAt?.toDate(),
    })) as Badge[];
  },
};

