import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Progress } from '../models/Progress';

export const progressService = {
  // Créer ou mettre à jour la progression
  async updateProgress(userId: string, progress: Omit<Progress, 'id' | 'userId' | 'startedAt' | 'lastAccessedAt'>): Promise<string> {
    // Vérifier si une progression existe déjà
    let progressQuery;
    if (progress.lessonId) {
      progressQuery = query(
        collection(db, 'progress'),
        where('userId', '==', userId),
        where('lessonId', '==', progress.lessonId)
      );
    } else if (progress.courseId) {
      progressQuery = query(
        collection(db, 'progress'),
        where('userId', '==', userId),
        where('courseId', '==', progress.courseId)
      );
    } else if (progress.quizId) {
      progressQuery = query(
        collection(db, 'progress'),
        where('userId', '==', userId),
        where('quizId', '==', progress.quizId)
      );
    } else {
      throw new Error('lessonId, courseId ou quizId requis');
    }

    const existingProgress = await getDocs(progressQuery);

    if (!existingProgress.empty) {
      // Mettre à jour la progression existante
      const docRef = existingProgress.docs[0].ref;
      await updateDoc(docRef, {
        ...progress,
        lastAccessedAt: Timestamp.now(),
        completedAt: progress.completed ? Timestamp.now() : null,
      });
      return docRef.id;
    } else {
      // Créer une nouvelle progression
      const progressData = {
        ...progress,
        userId,
        startedAt: Timestamp.now(),
        lastAccessedAt: Timestamp.now(),
        completedAt: progress.completed ? Timestamp.now() : null,
      };
      const docRef = await addDoc(collection(db, 'progress'), progressData);
      return docRef.id;
    }
  },

  // Obtenir la progression d'un utilisateur
  async getUserProgress(userId: string): Promise<Progress[]> {
    try {
      // Essayer d'abord avec orderBy
      const q = query(
        collection(db, 'progress'),
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
      })) as Progress[];
    } catch (error: any) {
      // Si orderBy échoue (pas d'index), récupérer sans orderBy et trier manuellement
      if (error.code === 'failed-precondition' || error.code === 'unimplemented' || error.message?.includes('index')) {
        const q = query(
          collection(db, 'progress'),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const progress = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startedAt: doc.data().startedAt?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate(),
          lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
        })) as Progress[];
        // Trier manuellement par lastAccessedAt
        return progress.sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
      }
      throw error;
    }
  },

  // Obtenir l'historique (progression complétée)
  async getUserHistory(userId: string): Promise<Progress[]> {
    try {
      // Essayer d'abord avec orderBy
      const q = query(
        collection(db, 'progress'),
        where('userId', '==', userId),
        where('completed', '==', true),
        orderBy('completedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
      })) as Progress[];
    } catch (error: any) {
      // Si orderBy échoue (pas d'index), récupérer sans orderBy et trier manuellement
      if (error.code === 'failed-precondition' || error.code === 'unimplemented' || error.message?.includes('index')) {
        const q = query(
          collection(db, 'progress'),
          where('userId', '==', userId),
          where('completed', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const progress = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startedAt: doc.data().startedAt?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate(),
          lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
        })) as Progress[];
        // Trier manuellement par completedAt
        return progress.sort((a, b) => {
          const aDate = a.completedAt?.getTime() || 0;
          const bDate = b.completedAt?.getTime() || 0;
          return bDate - aDate;
        });
      }
      throw error;
    }
  },

  // Démarrer un cours
  async startCourse(userId: string, courseId: string): Promise<string> {
    return this.updateProgress(userId, {
      courseId,
      percentage: 0,
      completed: false,
    });
  },

  // Obtenir la progression d'un cours
  async getCourseProgress(userId: string, courseId: string): Promise<Progress | null> {
    const q = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate(),
      lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
    } as Progress;
  },

  // Compléter un cours
  async completeCourse(userId: string, courseId: string): Promise<void> {
    await this.updateProgress(userId, {
      courseId,
      percentage: 100,
      completed: true,
    });
  },

  // Obtenir la progression d'une leçon
  async getLessonProgress(userId: string, lessonId: string): Promise<Progress | null> {
    const q = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('lessonId', '==', lessonId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate(),
      lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
    } as Progress;
  },

  // Démarrer une leçon
  async startLesson(userId: string, lessonId: string, courseId: string): Promise<string> {
    return this.updateProgress(userId, {
      lessonId,
      courseId,
      percentage: 0,
      completed: false,
    });
  },

  // Compléter une leçon
  async completeLesson(userId: string, lessonId: string, courseId: string): Promise<void> {
    await this.updateProgress(userId, {
      lessonId,
      courseId,
      percentage: 100,
      completed: true,
    });
  },

  // Mettre à jour la progression d'une compétence
  async updateSkillProgress(userId: string, skillId: string): Promise<void> {
    const { userSkillService } = await import('./userSkillService');
    await userSkillService.updateUserSkillProgress(userId, skillId);
  },
};
