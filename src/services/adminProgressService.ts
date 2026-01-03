import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Progress } from '../models/Progress';
import { User } from '../models/User';
import { Skill } from '../models/Skill';

export const adminProgressService = {
  // Obtenir la progression par utilisateur
  async getProgressByUser(userId: string): Promise<Progress[]> {
    try {
      // Essayer d'abord avec orderBy
      const progressQuery = query(
        collection(db, 'progress'),
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc')
      );
      const progressSnapshot = await getDocs(progressQuery);
      return progressSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
      })) as Progress[];
    } catch (error: any) {
      // Si orderBy échoue (pas d'index), récupérer sans orderBy et trier manuellement
      if (error.code === 'failed-precondition' || error.code === 'unimplemented' || error.message?.includes('index')) {
        const progressQuery = query(
          collection(db, 'progress'),
          where('userId', '==', userId)
        );
        const progressSnapshot = await getDocs(progressQuery);
        const progress = progressSnapshot.docs.map(doc => ({
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

  // Obtenir la progression par compétence
  async getProgressBySkill(skillId: string): Promise<Array<Progress & { userName?: string }>> {
    // Récupérer tous les cours de cette compétence
    const coursesQuery = query(
      collection(db, 'courses'),
      where('skillId', '==', skillId)
    );
    const coursesSnapshot = await getDocs(coursesQuery);
    const courseIds = coursesSnapshot.docs.map(doc => doc.id);

    // Récupérer toutes les progressions pour ces cours
    const allProgress: Array<Progress & { userName?: string }> = [];
    
    for (const courseId of courseIds) {
      const progressQuery = query(
        collection(db, 'progress'),
        where('courseId', '==', courseId)
      );
      const progressSnapshot = await getDocs(progressQuery);
      
      for (const progressDoc of progressSnapshot.docs) {
        const progress = {
          id: progressDoc.id,
          ...progressDoc.data(),
          startedAt: progressDoc.data().startedAt?.toDate() || new Date(),
          completedAt: progressDoc.data().completedAt?.toDate(),
          lastAccessedAt: progressDoc.data().lastAccessedAt?.toDate() || new Date(),
        } as Progress;
        
        // Récupérer le nom de l'utilisateur
        try {
          const userDoc = await getDoc(doc(db, 'users', progress.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            allProgress.push({
              ...progress,
              userName: userData.name,
            });
          } else {
            allProgress.push(progress);
          }
        } catch (error) {
          allProgress.push(progress);
        }
      }
    }
    
    return allProgress;
  },

  // Obtenir les scores des quiz
  async getQuizScores(): Promise<Array<Progress & { userName?: string; quizTitle?: string }>> {
    try {
      // Essayer d'abord avec orderBy
      const progressQuery = query(
        collection(db, 'progress'),
        where('quizId', '!=', null),
        orderBy('quizId'),
        orderBy('percentage', 'desc')
      );
      const progressSnapshot = await getDocs(progressQuery);
    
      const results = await Promise.all(
        progressSnapshot.docs.map(async (doc) => {
          const progress = {
            id: doc.id,
            ...doc.data(),
            startedAt: doc.data().startedAt?.toDate() || new Date(),
            completedAt: doc.data().completedAt?.toDate(),
            lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
          } as Progress;
          
          // Récupérer les infos utilisateur et quiz
          try {
            const [userDoc, quizDoc] = await Promise.all([
              getDoc(doc(db, 'users', progress.userId)),
              progress.quizId ? getDoc(doc(db, 'quizzes', progress.quizId)) : null,
            ]);
            
            const result: Progress & { userName?: string; quizTitle?: string } = { ...progress };
            
            if (userDoc.exists()) {
              result.userName = userDoc.data().name;
            }
            
            if (quizDoc?.exists()) {
              result.quizTitle = quizDoc.data().title;
            }
            
            return result;
          } catch (error) {
            return progress;
          }
        })
      );
      
      return results;
    } catch (error: any) {
      // Si orderBy échoue (pas d'index), récupérer sans orderBy et trier manuellement
      if (error.code === 'failed-precondition' || error.code === 'unimplemented' || error.message?.includes('index')) {
        // Récupérer toutes les progressions avec quizId
        const allProgressSnapshot = await getDocs(collection(db, 'progress'));
        const quizProgress = allProgressSnapshot.docs
          .filter(doc => doc.data().quizId)
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            startedAt: doc.data().startedAt?.toDate() || new Date(),
            completedAt: doc.data().completedAt?.toDate(),
            lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
          })) as Progress[];
        
        const results = await Promise.all(
          quizProgress.map(async (progress) => {
            try {
              const [userDoc, quizDoc] = await Promise.all([
                getDoc(doc(db, 'users', progress.userId)),
                progress.quizId ? getDoc(doc(db, 'quizzes', progress.quizId)) : null,
              ]);
              
              const result: Progress & { userName?: string; quizTitle?: string } = { ...progress };
              
              if (userDoc.exists()) {
                result.userName = userDoc.data().name;
              }
              
              if (quizDoc?.exists()) {
                result.quizTitle = quizDoc.data().title;
              }
              
              return result;
            } catch (error) {
              return progress;
            }
          })
        );
        
        // Trier manuellement par quizId puis par percentage
        return results.sort((a, b) => {
          if (a.quizId !== b.quizId) {
            return (a.quizId || '').localeCompare(b.quizId || '');
          }
          return (b.percentage || 0) - (a.percentage || 0);
        });
      }
      throw error;
    }
  },

  // Obtenir l'historique d'apprentissage (toutes les progressions)
  async getLearningHistory(limit?: number): Promise<Array<Progress & { userName?: string; skillName?: string }>> {
    try {
      // Essayer d'abord avec orderBy
      const progressQuery = query(
        collection(db, 'progress'),
        orderBy('lastAccessedAt', 'desc')
      );
      const progressSnapshot = await getDocs(progressQuery);
      const docs = limit ? progressSnapshot.docs.slice(0, limit) : progressSnapshot.docs;
    
      const results = await Promise.all(
        docs.map(async (doc) => {
          const progress = {
            id: doc.id,
            ...doc.data(),
            startedAt: doc.data().startedAt?.toDate() || new Date(),
            completedAt: doc.data().completedAt?.toDate(),
            lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
          } as Progress;
          
          // Récupérer les infos utilisateur
          try {
            const userDoc = await getDoc(doc(db, 'users', progress.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...progress,
                userName: userData.name,
              };
            }
          } catch (error) {
            console.error('Erreur récupération utilisateur:', error);
          }
          
          return progress;
        })
      );
      
      return results;
    } catch (error: any) {
      // Si orderBy échoue (pas d'index), récupérer sans orderBy et trier manuellement
      if (error.code === 'failed-precondition' || error.code === 'unimplemented' || error.message?.includes('index')) {
        const progressSnapshot = await getDocs(collection(db, 'progress'));
        const allDocs = limit ? progressSnapshot.docs.slice(0, limit) : progressSnapshot.docs;
        
        const results = await Promise.all(
          allDocs.map(async (doc) => {
            const progress = {
              id: doc.id,
              ...doc.data(),
              startedAt: doc.data().startedAt?.toDate() || new Date(),
              completedAt: doc.data().completedAt?.toDate(),
              lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
            } as Progress;
            
            // Récupérer les infos utilisateur
            try {
              const userDoc = await getDoc(doc(db, 'users', progress.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...progress,
                  userName: userData.name,
                };
              }
            } catch (error) {
              console.error('Erreur récupération utilisateur:', error);
            }
            
            return progress;
          })
        );
        
        // Trier manuellement par lastAccessedAt
        return results.sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
      }
      throw error;
    }
  },
};

