import { collection, addDoc, getDocs, getDoc, doc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ValidatedSkill } from '../models/ValidatedSkill';
import { adminSkillService } from './adminSkillService';

export const validatedSkillService = {
  // Enregistrer une compétence validée
  async recordValidatedSkill(
    userId: string,
    skillId: string,
    quizScore: number,
    badgesUnlocked: string[] = []
  ): Promise<string> {
    // Vérifier si la compétence existe déjà comme validée
    const existingQuery = query(
      collection(db, 'validatedSkills'),
      where('userId', '==', userId),
      where('skillId', '==', skillId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    // Récupérer le nom de la compétence
    const skill = await adminSkillService.getSkillById(skillId);
    const skillName = skill?.name || 'Compétence inconnue';

    const validatedSkillData: Omit<ValidatedSkill, 'id'> = {
      userId,
      skillId,
      skillName,
      validatedAt: new Date(),
      quizScore,
      badgesUnlocked,
    };

    if (!existingSnapshot.empty) {
      // Mettre à jour l'enregistrement existant
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();
      await existingDoc.ref.update({
        validatedAt: Timestamp.now(),
        quizScore,
        badgesUnlocked: [...(existingData.badgesUnlocked || []), ...badgesUnlocked],
      });
      return existingDoc.id;
    } else {
      // Créer un nouvel enregistrement
      const docRef = await addDoc(collection(db, 'validatedSkills'), {
        ...validatedSkillData,
        validatedAt: Timestamp.now(),
      });
      return docRef.id;
    }
  },

  // Obtenir toutes les compétences validées d'un utilisateur
  async getUserValidatedSkills(userId: string): Promise<ValidatedSkill[]> {
    try {
      const validatedSkillsQuery = query(
        collection(db, 'validatedSkills'),
        where('userId', '==', userId),
        orderBy('validatedAt', 'desc')
      );
      const snapshot = await getDocs(validatedSkillsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validatedAt: doc.data().validatedAt?.toDate() || new Date(),
      })) as ValidatedSkill[];
    } catch (error: any) {
      // Si orderBy échoue (pas d'index), récupérer sans orderBy
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
        const validatedSkillsQuery = query(
          collection(db, 'validatedSkills'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(validatedSkillsQuery);
        const skills = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          validatedAt: doc.data().validatedAt?.toDate() || new Date(),
        })) as ValidatedSkill[];
        // Trier manuellement par date
        return skills.sort((a, b) => b.validatedAt.getTime() - a.validatedAt.getTime());
      }
      throw error;
    }
  },

  // Obtenir toutes les compétences validées (pour admin)
  async getAllValidatedSkills(): Promise<ValidatedSkill[]> {
    try {
      const validatedSkillsQuery = query(
        collection(db, 'validatedSkills'),
        orderBy('validatedAt', 'desc')
      );
      const snapshot = await getDocs(validatedSkillsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validatedAt: doc.data().validatedAt?.toDate() || new Date(),
      })) as ValidatedSkill[];
    } catch (error: any) {
      // Si orderBy échoue, récupérer sans orderBy
      if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
        const snapshot = await getDocs(collection(db, 'validatedSkills'));
        const skills = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          validatedAt: doc.data().validatedAt?.toDate() || new Date(),
        })) as ValidatedSkill[];
        return skills.sort((a, b) => b.validatedAt.getTime() - a.validatedAt.getTime());
      }
      throw error;
    }
  },

  // Obtenir les compétences validées par compétence (pour admin)
  async getValidatedSkillsBySkill(skillId: string): Promise<ValidatedSkill[]> {
    const validatedSkillsQuery = query(
      collection(db, 'validatedSkills'),
      where('skillId', '==', skillId)
    );
    const snapshot = await getDocs(validatedSkillsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      validatedAt: doc.data().validatedAt?.toDate() || new Date(),
    })) as ValidatedSkill[];
  },
};

