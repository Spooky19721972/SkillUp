import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Quiz } from '../models/Quiz';
import { Question } from '../models/Question';
import { Progress } from '../models/Progress';

export const adminQuizService = {
  // Obtenir tous les quiz
  async getAllQuizzes(): Promise<Quiz[]> {
    const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
    return quizzesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Quiz[];
  },

  // Obtenir un quiz par ID
  async getQuizById(quizId: string): Promise<Quiz | null> {
    const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
    if (quizDoc.exists()) {
      return {
        id: quizDoc.id,
        ...quizDoc.data(),
        createdAt: quizDoc.data().createdAt?.toDate() || new Date(),
      } as Quiz;
    }
    return null;
  },

  // Ajouter un quiz
  async addQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<string> {
    const quizData = {
      ...quiz,
      passingScore: quiz.passingScore || 80, // Score minimum par défaut: 80%
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'quizzes'), quizData);
    return docRef.id;
  },

  // Modifier un quiz
  async updateQuiz(quizId: string, updates: Partial<Quiz>): Promise<void> {
    await updateDoc(doc(db, 'quizzes', quizId), updates);
  },

  // Supprimer un quiz
  async deleteQuiz(quizId: string): Promise<void> {
    await deleteDoc(doc(db, 'quizzes', quizId));
  },

  // Obtenir les questions d'un quiz
  async getQuizQuestions(quizId: string): Promise<Question[]> {
    if (!quizId) {
      console.warn('getQuizQuestions: quizId est vide');
      return [];
    }

    try {
      // Essayer d'abord avec orderBy
      try {
        const questionsQuery = query(
          collection(db, 'questions'),
          where('quizId', '==', quizId),
          orderBy('order', 'asc')
        );
        const questionsSnapshot = await getDocs(questionsQuery);
        const questions = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Question[];
        return questions;
      } catch (orderByError: any) {
        // Si orderBy échoue (pas d'index), récupérer sans orderBy et trier manuellement
        if (orderByError.code === 'failed-precondition' ||
          orderByError.code === 'unimplemented' ||
          orderByError.message?.includes('index') ||
          orderByError.message?.includes('requires an index')) {
          console.log('Index manquant, récupération sans orderBy');
          const questionsQuery = query(
            collection(db, 'questions'),
            where('quizId', '==', quizId)
          );
          const questionsSnapshot = await getDocs(questionsQuery);
          const questions = questionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Question[];
          // Trier manuellement par order
          return questions.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        // Si ce n'est pas une erreur d'index, relancer l'erreur
        throw orderByError;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des questions:', error);
      // Si c'est juste qu'il n'y a pas de questions, retourner un tableau vide
      if (error.code === 'not-found' || error.message?.includes('not found')) {
        return [];
      }
      // Pour les autres erreurs, retourner un tableau vide plutôt que de lancer une erreur
      // Cela permet d'ouvrir le modal même s'il n'y a pas encore de questions
      console.warn('Erreur lors du chargement des questions, retour d\'un tableau vide:', error.message);
      return [];
    }
  },

  // Ajouter une question
  async addQuestion(question: Omit<Question, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'questions'), question);

    // Mettre à jour le quiz pour inclure cette question
    const quiz = await this.getQuizById(question.quizId);
    if (quiz) {
      const questions = quiz.questions || [];
      await this.updateQuiz(question.quizId, {
        questions: [...questions, docRef.id],
      });
    }

    return docRef.id;
  },

  // Modifier une question
  async updateQuestion(questionId: string, updates: Partial<Question>): Promise<void> {
    await updateDoc(doc(db, 'questions', questionId), updates);
  },

  // Supprimer une question
  async deleteQuestion(questionId: string): Promise<void> {
    const questionDoc = await getDoc(doc(db, 'questions', questionId));
    if (questionDoc.exists()) {
      const question = questionDoc.data() as Question;
      // Retirer la question de la liste des questions du quiz
      const quiz = await this.getQuizById(question.quizId);
      if (quiz && quiz.questions) {
        await this.updateQuiz(question.quizId, {
          questions: quiz.questions.filter(id => id !== questionId),
        });
      }
    }
    await deleteDoc(doc(db, 'questions', questionId));
  },

  // Obtenir les résultats des utilisateurs pour un quiz
  async getQuizResults(quizId: string): Promise<Array<Progress & { userName?: string; userEmail?: string }>> {
    const progressQuery = query(
      collection(db, 'progress'),
      where('quizId', '==', quizId)
    );
    const progressSnapshot = await getDocs(progressQuery);

    const results = await Promise.all(
      progressSnapshot.docs.map(async (progressDoc) => {
        const progress = {
          id: progressDoc.id,
          ...progressDoc.data(),
          startedAt: progressDoc.data().startedAt?.toDate() || new Date(),
          completedAt: progressDoc.data().completedAt?.toDate(),
          lastAccessedAt: progressDoc.data().lastAccessedAt?.toDate() || new Date(),
        } as Progress;

        // Récupérer les infos utilisateur
        try {
          const userDoc = await getDoc(doc(db, 'users', progress.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              ...progress,
              userName: userData.name,
              userEmail: userData.email,
            };
          }
        } catch (error) {
          console.error('Erreur récupération utilisateur:', error);
        }

        return progress;
      })
    );

    return results;
  },
};







