import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Skill } from '../models/Skill';
import { adminSkillService } from './adminSkillService';
import { adminCourseService } from './adminCourseService';

export interface UserSkillProgress {
  id: string;
  userId: string;
  skillId: string;
  level: number; // 0-100
  enrolledAt: Date;
  lastAccessedAt: Date;
  coursesCompleted: number;
  totalCourses: number;
}

export interface AvailableSkill extends Skill {
  hasCourses: boolean;
  courseCount: number;
  userProgress?: UserSkillProgress;
}

export const userSkillService = {
  // Obtenir toutes les compétences disponibles (globales avec au moins un cours)
  async getAvailableSkills(userId: string): Promise<AvailableSkill[]> {
    // Récupérer toutes les compétences globales (créées par l'admin, sans userId, userId='' ou userId='admin')
    const allSkills = await adminSkillService.getAllSkills();
    const globalSkills = allSkills.filter(skill => !skill.userId || skill.userId === '' || skill.userId === 'admin');

    // Filtrer pour ne garder que celles qui ont au moins un cours
    const availableSkills: AvailableSkill[] = [];

    for (const skill of globalSkills) {
      const courses = await adminSkillService.getSkillCourses(skill.id);
      if (courses.length > 0) {
        // Récupérer la progression de l'utilisateur pour cette compétence
        const userProgress = await this.getUserSkillProgress(userId, skill.id);

        availableSkills.push({
          ...skill,
          hasCourses: true,
          courseCount: courses.length,
          userProgress: userProgress || undefined,
        });
      }
    }

    return availableSkills;
  },

  // Obtenir la progression d'un utilisateur pour une compétence
  async getUserSkillProgress(userId: string, skillId: string): Promise<UserSkillProgress | null> {
    const progressQuery = query(
      collection(db, 'userSkillProgress'),
      where('userId', '==', userId),
      where('skillId', '==', skillId)
    );
    const progressSnapshot = await getDocs(progressQuery);

    if (progressSnapshot.empty) {
      return null;
    }

    const progressDoc = progressSnapshot.docs[0];
    const data = progressDoc.data();

    // Optimisation N+1 : Récupérer TOUS les cours de la compétence d'abord
    const courses = await adminSkillService.getSkillCourses(skillId);

    // Si aucun cours, 0 progression
    if (courses.length === 0) {
      return {
        id: progressDoc.id,
        userId: data.userId,
        skillId: data.skillId,
        level: 0,
        enrolledAt: data.enrolledAt?.toDate() || new Date(),
        lastAccessedAt: data.lastAccessedAt?.toDate() || new Date(),
        coursesCompleted: 0,
        totalCourses: 0,
      };
    }

    const courseIds = courses.map(c => c.id);

    // Récupérer UNIQUEMENT les cours complétés par l'utilisateur qui appartiennent à cette compétence
    // Note: Firestore 'in' query supports up to 10 items. If courses > 10, strictly we should batch or fetch all user completed courses.
    // Pour une scalabilité simple ici, on récupère tous les cours complétés de l'user et on filtre en mémoire (meilleur que N requêtes).

    const allCompletedCoursesQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('completed', '==', true)
    );

    const allCompletedSnapshot = await getDocs(allCompletedCoursesQuery);

    // Filtrer en mémoire ceux qui appartiennent à cette skill
    const completedCount = allCompletedSnapshot.docs.filter(doc =>
      courseIds.includes(doc.data().courseId)
    ).length;

    // Calculer le niveau basé sur les cours complétés
    const level = courses.length > 0 ? Math.round((completedCount / courses.length) * 100) : 0;

    return {
      id: progressDoc.id,
      userId: data.userId,
      skillId: data.skillId,
      level: level,
      enrolledAt: data.enrolledAt?.toDate() || new Date(),
      lastAccessedAt: data.lastAccessedAt?.toDate() || new Date(),
      coursesCompleted: completedCount,
      totalCourses: courses.length,
    };
  },

  // S'abonner à une compétence (créer une progression utilisateur)
  async enrollInSkill(userId: string, skillId: string): Promise<string> {
    // Vérifier si l'utilisateur est déjà inscrit
    const existingProgress = await this.getUserSkillProgress(userId, skillId);
    if (existingProgress) {
      throw new Error('Vous êtes déjà inscrit à cette compétence');
    }

    // Vérifier que la compétence a des cours
    const courses = await adminSkillService.getSkillCourses(skillId);
    if (courses.length === 0) {
      throw new Error('Cette compétence n\'a pas encore de cours disponibles');
    }

    // Créer la progression utilisateur
    const progressData = {
      userId,
      skillId,
      level: 0,
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now(),
      coursesCompleted: 0,
      totalCourses: courses.length,
    };

    const docRef = await addDoc(collection(db, 'userSkillProgress'), progressData);
    return docRef.id;
  },

  // Mettre à jour la progression d'un utilisateur pour une compétence
  async updateUserSkillProgress(userId: string, skillId: string): Promise<void> {
    const progress = await this.getUserSkillProgress(userId, skillId);
    if (!progress) {
      return; // Pas de progression à mettre à jour
    }

    // Recalculer la progression
    const courses = await adminSkillService.getSkillCourses(skillId);
    const coursesProgress = await Promise.all(
      courses.map(async (course) => {
        const courseProgressQuery = query(
          collection(db, 'progress'),
          where('userId', '==', userId),
          where('courseId', '==', course.id),
          where('completed', '==', true)
        );
        const courseProgressSnapshot = await getDocs(courseProgressQuery);
        return courseProgressSnapshot.empty ? 0 : 1;
      })
    );
    const coursesCompleted = coursesProgress.reduce((sum, val) => sum + val, 0);
    const level = courses.length > 0 ? Math.round((coursesCompleted / courses.length) * 100) : 0;

    // Mettre à jour
    const progressDoc = query(
      collection(db, 'userSkillProgress'),
      where('userId', '==', userId),
      where('skillId', '==', skillId)
    );
    const progressSnapshot = await getDocs(progressDoc);

    if (!progressSnapshot.empty) {
      const docRef = progressSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        level,
        coursesCompleted,
        totalCourses: courses.length,
        lastAccessedAt: Timestamp.now(),
      });
    }
  },

  // Obtenir toutes les compétences auxquelles l'utilisateur est inscrit
  async getUserEnrolledSkills(userId: string): Promise<AvailableSkill[]> {
    const progressQuery = query(
      collection(db, 'userSkillProgress'),
      where('userId', '==', userId)
    );
    const progressSnapshot = await getDocs(progressQuery);

    const enrolledSkills: AvailableSkill[] = [];

    for (const progressDoc of progressSnapshot.docs) {
      const progressData = progressDoc.data();
      const skill = await adminSkillService.getSkillById(progressData.skillId);

      if (skill) {
        const courses = await adminSkillService.getSkillCourses(skill.id);
        const userProgress = await this.getUserSkillProgress(userId, skill.id);

        enrolledSkills.push({
          ...skill,
          hasCourses: true,
          courseCount: courses.length,
          userProgress: userProgress || undefined,
        });
      }
    }

    return enrolledSkills;
  },

  // Se désinscrire d'une compétence (supprimer la progression)
  async unenrollFromSkill(userId: string, skillId: string): Promise<void> {
    // Supprimer la progression de l'utilisateur pour cette compétence
    const progressQuery = query(
      collection(db, 'userSkillProgress'),
      where('userId', '==', userId),
      where('skillId', '==', skillId)
    );
    const progressSnapshot = await getDocs(progressQuery);

    if (!progressSnapshot.empty) {
      const progressDoc = progressSnapshot.docs[0];
      await progressDoc.ref.delete();
    }

    // Optionnel : Supprimer aussi toutes les progressions de cours liées
    const courseProgressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId)
    );
    const courseProgressSnapshot = await getDocs(courseProgressQuery);

    for (const doc of courseProgressSnapshot.docs) {
      const data = doc.data();
      // Vérifier si le cours appartient à cette compétence
      if (data.courseId) {
        const courses = await adminSkillService.getSkillCourses(skillId);
        const courseIds = courses.map(c => c.id);
        if (courseIds.includes(data.courseId)) {
          await doc.ref.delete();
        }
      }
    }
  },
};

