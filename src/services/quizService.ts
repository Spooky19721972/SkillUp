import { collection, addDoc, getDocs, getDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Quiz, Question, Response } from '../models';

export const quizService = {
  // Obtenir un quiz avec ses questions
  async getQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: Question[] } | null> {
    const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
    if (!quizDoc.exists()) return null;

    const quiz = {
      id: quizDoc.id,
      ...quizDoc.data(),
      createdAt: quizDoc.data().createdAt?.toDate() || new Date(),
    } as Quiz;

    // Récupérer les questions
    const questionsQuery = query(collection(db, 'questions'), where('quizId', '==', quizId));
    const questionsSnapshot = await getDocs(questionsQuery);
    const questions = questionsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0)) as Question[];

    return { quiz, questions };
  },

  // Soumettre une réponse
  async submitResponse(userId: string, response: Omit<Response, 'id' | 'submittedAt'>): Promise<string> {
    const responseData = {
      ...response,
      userId,
      submittedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'responses'), responseData);
    return docRef.id;
  },

  // Vérifier une réponse
  checkAnswer(question: Question, userAnswer: string): boolean {
    return question.correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
  },

  // Calculer le score d'un quiz
  async calculateQuizScore(quizId: string, userId: string): Promise<{ score: number; total: number; percentage: number }> {
    const responsesQuery = query(
      collection(db, 'responses'),
      where('quizId', '==', quizId),
      where('userId', '==', userId)
    );
    const responsesSnapshot = await getDocs(responsesQuery);
    const responses = responsesSnapshot.docs.map(doc => doc.data()) as Response[];

    const { quiz, questions } = await this.getQuizWithQuestions(quizId) || {};
    if (!quiz || !questions) return { score: 0, total: 0, percentage: 0 };

    let score = 0;
    let total = 0;

    questions.forEach(question => {
      total += question.points;
      const response = responses.find(r => r.questionId === question.id);
      if (response && response.isCorrect) {
        score += question.points;
      }
    });

    return {
      score,
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    };
  },
};
