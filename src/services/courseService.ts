import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Course } from '../models/Course';
import { Lesson } from '../models/Lesson';

export const courseService = {
  // Obtenir tous les cours d'une compétence
  async getCoursesBySkill(skillId: string): Promise<Course[]> {
    const coursesQuery = query(
      collection(db, 'courses'),
      where('skillId', '==', skillId)
    );
    const coursesSnapshot = await getDocs(coursesQuery);
    return coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Course[];
  },

  // Obtenir un cours par ID
  async getCourseById(courseId: string): Promise<Course | null> {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (courseDoc.exists()) {
      return {
        id: courseDoc.id,
        ...courseDoc.data(),
        createdAt: courseDoc.data().createdAt?.toDate() || new Date(),
      } as Course;
    }
    return null;
  },

  // Obtenir les leçons d'un cours (triées par ordre)
  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    const lessonsQuery = query(
      collection(db, 'lessons'),
      where('courseId', '==', courseId)
    );
    const lessonsSnapshot = await getDocs(lessonsQuery);
    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Lesson[];
    
    // Trier par ordre
    return lessons.sort((a, b) => a.order - b.order);
  },
};

