import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const adminService = {
  // Obtenir le nombre total d'utilisateurs
  async getTotalUsers(): Promise<number> {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.size;
  },

  // Obtenir le nombre total de compétences
  async getTotalSkills(): Promise<number> {
    const skillsSnapshot = await getDocs(collection(db, 'skills'));
    return skillsSnapshot.size;
  },

  // Obtenir le nombre total de cours
  async getTotalCourses(): Promise<number> {
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    return coursesSnapshot.size;
  },

  // Obtenir le nombre total de quiz
  async getTotalQuizzes(): Promise<number> {
    const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
    return quizzesSnapshot.size;
  },

  // Obtenir le nombre total de badges
  async getTotalBadges(): Promise<number> {
    const badgesSnapshot = await getDocs(collection(db, 'badges'));
    return badgesSnapshot.size;
  },

  // Obtenir les données de progression pour le graphique
  async getProgressData(): Promise<{ date: string; count: number }[]> {
    const progressSnapshot = await getDocs(collection(db, 'progress'));
    const progressData = progressSnapshot.docs.map(doc => ({
      date: doc.data().createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      completed: doc.data().completed || false,
    }));

    // Grouper par date
    const grouped: Record<string, number> = {};
    progressData.forEach(item => {
      if (item.completed) {
        grouped[item.date] = (grouped[item.date] || 0) + 1;
      }
    });

    // Convertir en tableau et trier par date
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Derniers 7 jours
  },

  // Obtenir le nombre de nouveaux utilisateurs cette semaine
  async getNewUsersThisWeek(): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const newUsers = usersSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt >= oneWeekAgo;
    });

    return newUsers.length;
  },
};







