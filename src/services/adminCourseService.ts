import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Course } from "../models/Course";
import { Lesson } from "../models/Lesson";

export const adminCourseService = {
  // Obtenir tous les cours
  async getAllCourses(): Promise<Course[]> {
    const coursesSnapshot = await getDocs(collection(db, "courses"));
    return coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Course[];
  },

  // Obtenir un cours par ID
  async getCourseById(courseId: string): Promise<Course | null> {
    const courseDoc = await getDoc(doc(db, "courses", courseId));
    if (courseDoc.exists()) {
      return {
        id: courseDoc.id,
        ...courseDoc.data(),
        createdAt: courseDoc.data().createdAt?.toDate() || new Date(),
      } as Course;
    }
    return null;
  },

  // Ajouter un cours
  async addCourse(course: Omit<Course, "id" | "createdAt">): Promise<string> {
    // Filtrer les champs undefined pour éviter les erreurs Firestore
    const courseData: any = {
      title: course.title,
      description: course.description,
      skillId: course.skillId,
      type: course.type,
      createdAt: Timestamp.now(),
    };

    // Ajouter les champs optionnels uniquement s'ils sont définis
    if (
      course.externalUrl !== undefined &&
      course.externalUrl !== null &&
      course.externalUrl !== ""
    ) {
      courseData.externalUrl = course.externalUrl;
    }
    if (course.lessons && course.lessons.length > 0) {
      courseData.lessons = course.lessons;
    }
    if (course.quizzes && course.quizzes.length > 0) {
      courseData.quizzes = course.quizzes;
    }
    if (course.resources && course.resources.length > 0) {
      courseData.resources = course.resources;
    }

    const docRef = await addDoc(collection(db, "courses"), courseData);
    return docRef.id;
  },

  // Modifier un cours
  async updateCourse(
    courseId: string,
    updates: Partial<Course>
  ): Promise<void> {
    // Filtrer les champs undefined pour éviter les erreurs Firestore
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.skillId !== undefined) updateData.skillId = updates.skillId;
    if (updates.type !== undefined) updateData.type = updates.type;

    // Gérer externalUrl : si c'est undefined, on ne l'inclut pas (ou on le supprime si nécessaire)
    if (updates.externalUrl !== undefined) {
      if (updates.externalUrl === null || updates.externalUrl === "") {
        // Supprimer le champ si on veut le retirer
        updateData.externalUrl = null;
      } else {
        updateData.externalUrl = updates.externalUrl;
      }
    }

    if (updates.lessons !== undefined) updateData.lessons = updates.lessons;
    if (updates.quizzes !== undefined) updateData.quizzes = updates.quizzes;
    if (updates.resources !== undefined)
      updateData.resources = updates.resources;

    await updateDoc(doc(db, "courses", courseId), updateData);
  },

  // Supprimer un cours
  async deleteCourse(courseId: string): Promise<void> {
    await deleteDoc(doc(db, "courses", courseId));
  },

  // Obtenir les leçons d'un cours (triées par ordre)
  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    try {
      // Essayer d'abord avec orderBy (nécessite un index Firestore)
      try {
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("courseId", "==", courseId),
          orderBy("order", "asc")
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);
        return lessonsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Lesson[];
      } catch (orderByError: any) {
        // Si orderBy échoue (index manquant), charger sans tri et trier en mémoire
        console.warn(
          "Index Firestore manquant pour orderBy, tri en mémoire:",
          orderByError.message
        );
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("courseId", "==", courseId)
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessons = lessonsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Lesson[];

        // Trier en mémoire par ordre
        return lessons.sort((a, b) => {
          const orderA = a.order ?? 999999;
          const orderB = b.order ?? 999999;
          return orderA - orderB;
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des leçons:", error);
      throw new Error(
        error.message ||
          "Impossible de charger les leçons. Vérifiez votre connexion."
      );
    }
  },

  // Ajouter une leçon
  async addLesson(lesson: Omit<Lesson, "id" | "createdAt">): Promise<string> {
    // Validation des champs requis
    if (!lesson.title || !lesson.title.trim()) {
      throw new Error("Le titre de la leçon est requis");
    }
    if (!lesson.courseId) {
      throw new Error("L'ID du cours est requis");
    }
    if (lesson.order === undefined || lesson.order === null) {
      throw new Error("L'ordre de la leçon est requis");
    }
    if (!lesson.contentType) {
      throw new Error("Le type de contenu est requis");
    }

    // Filtrer les champs undefined pour éviter les erreurs Firestore
    const lessonData: any = {
      title: lesson.title.trim(),
      content: lesson.content || "", // Toujours inclure content même si vide
      courseId: lesson.courseId,
      order: lesson.order,
      contentType: lesson.contentType,
      createdAt: Timestamp.now(),
    };

    // Ajouter les champs optionnels uniquement s'ils sont définis
    if (
      lesson.contentUrl !== undefined &&
      lesson.contentUrl !== null &&
      lesson.contentUrl !== ""
    ) {
      lessonData.contentUrl = lesson.contentUrl.trim();
    }
    if (lesson.duration !== undefined && lesson.duration !== null) {
      lessonData.duration = lesson.duration;
    }

    try {
      const docRef = await addDoc(collection(db, "lessons"), lessonData);

      // Mettre à jour le cours pour inclure cette leçon
      const course = await this.getCourseById(lesson.courseId);
      if (course) {
        const lessons = course.lessons || [];
        await this.updateCourse(lesson.courseId, {
          lessons: [...lessons, docRef.id],
        });
      }

      return docRef.id;
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la leçon:", error);
      throw new Error(
        error.message || "Impossible d'ajouter la leçon. Veuillez réessayer."
      );
    }
  },

  // Modifier une leçon
  async updateLesson(
    lessonId: string,
    updates: Partial<Lesson>
  ): Promise<void> {
    await updateDoc(doc(db, "lessons", lessonId), updates);
  },

  // Supprimer une leçon
  async deleteLesson(lessonId: string): Promise<void> {
    const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
    if (lessonDoc.exists()) {
      const lesson = lessonDoc.data() as Lesson;
      // Retirer la leçon de la liste des leçons du cours
      const course = await this.getCourseById(lesson.courseId);
      if (course && course.lessons) {
        await this.updateCourse(lesson.courseId, {
          lessons: course.lessons.filter((id) => id !== lessonId),
        });
      }
    }
    await deleteDoc(doc(db, "lessons", lessonId));
  },

  // Réorganiser l'ordre des leçons
  async reorderLessons(lessonIds: string[]): Promise<void> {
    const updatePromises = lessonIds.map((lessonId, index) =>
      this.updateLesson(lessonId, { order: index + 1 })
    );
    await Promise.all(updatePromises);
  },

  // Obtenir une leçon par ID
  async getLessonById(lessonId: string): Promise<Lesson | null> {
    const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
    if (lessonDoc.exists()) {
      return {
        id: lessonDoc.id,
        ...lessonDoc.data(),
        createdAt: lessonDoc.data().createdAt?.toDate() || new Date(),
      } as Lesson;
    }
    return null;
  },
};
