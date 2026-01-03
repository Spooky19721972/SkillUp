import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { adminCourseService } from "../services/adminCourseService";
import { progressService } from "../services/progressService";
import { Course } from "../models/Course";
import { Lesson } from "../models/Lesson";
import { Progress } from "../models/Progress";

interface RouteParams {
  courseId: string;
  skillId: string;
}

export default function CourseDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { courseId, skillId } = (route.params as RouteParams) || {};
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseProgress, setCourseProgress] = useState<Progress | null>(null);
  const [lessonProgresses, setLessonProgresses] = useState<Map<string, Progress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId, user]);

  const loadCourseDetails = async () => {
    if (!user || !courseId) return;
    
    setLoading(true);
    try {
      // Charger le cours
      const courseData = await adminCourseService.getCourseById(courseId);
      if (!courseData) {
        Alert.alert("Erreur", "Cours introuvable");
        navigation.goBack();
        return;
      }
      setCourse(courseData);

      // Charger les leçons si c'est un cours interne
      if (courseData.type === "internal") {
        const lessonsData = await adminCourseService.getCourseLessons(courseId);
        // Filtrer les leçons invalides
        const validLessons = lessonsData.filter(lesson => lesson && lesson.id);
        setLessons(validLessons);

        // Charger la progression pour chaque leçon
        const progressesMap = new Map<string, Progress>();
        for (const lesson of validLessons) {
          if (!lesson || !lesson.id) continue;
          const lessonProgress = await progressService.getLessonProgress(user.uid, lesson.id);
          if (lessonProgress) {
            progressesMap.set(lesson.id, lessonProgress);
          }
        }
        setLessonProgresses(progressesMap);
      }

      // Charger la progression du cours
      const progress = await progressService.getCourseProgress(user.uid, courseId);
      setCourseProgress(progress);

      // Si pas de progression, démarrer le cours
      if (!progress) {
        await progressService.startCourse(user.uid, courseId);
        const newProgress = await progressService.getCourseProgress(user.uid, courseId);
        setCourseProgress(newProgress);
      }

    } catch (error: any) {
      console.error("Erreur lors du chargement:", error);
      Alert.alert("Erreur", error.message || "Impossible de charger les détails");
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    if (!lesson || !lesson.id) return;
    navigation.navigate("Lesson" as never, { lessonId: lesson.id, courseId, skillId } as never);
  };

  const getLessonStatus = (lesson: Lesson) => {
    if (!lesson || !lesson.id) return { label: "Non commencé", color: "#9CA3AF" };
    const progress = lessonProgresses.get(lesson.id);
    if (!progress) return { label: "Non commencé", color: "#9CA3AF" };
    if (progress.completed) return { label: "Complété", color: "#10B981" };
    return { label: "En cours", color: "#F59E0B" };
  };

  const calculateCourseProgress = () => {
    const validLessons = lessons.filter(lesson => lesson && lesson.id);
    if (validLessons.length === 0) return 0;
    const completedLessons = validLessons.filter(lesson => {
      const progress = lessonProgresses.get(lesson.id);
      return progress?.completed === true;
    }).length;
    return Math.round((completedLessons / validLessons.length) * 100);
  };

  const handleCompleteCourse = async () => {
    if (!user || !course) return;
    
    const validLessons = lessons.filter(lesson => lesson && lesson.id);
    const allLessonsCompleted = validLessons.length > 0 && validLessons.every(lesson => {
      const progress = lessonProgresses.get(lesson.id);
      return progress?.completed === true;
    });

    if (!allLessonsCompleted) {
      Alert.alert("Info", "Vous devez compléter toutes les leçons avant de terminer le cours");
      return;
    }

    try {
      await progressService.completeCourse(user.uid, courseId);
      Alert.alert("Félicitations !", "Vous avez complété ce cours !");
      loadCourseDetails();
      // Mettre à jour la progression de la compétence
      if (skillId) {
        await progressService.updateSkillProgress(user.uid, skillId);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de compléter le cours");
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!course) {
    return null;
  }

  const coursePercentage = course.type === "internal" ? calculateCourseProgress() : (courseProgress?.percentage ?? 0);
  const validLessons = lessons.filter(lesson => lesson && lesson.id);
  const allLessonsCompleted = validLessons.length > 0 && validLessons.every(lesson => {
    const progress = lessonProgresses.get(lesson.id);
    return progress?.completed === true;
  });

  return (
    <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.courseHeader}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>
        </View>

        {/* Progression */}
        {course.type === "internal" && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Votre progression</Text>
              <Text style={styles.progressPercentage}>{coursePercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${coursePercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {validLessons.filter(l => lessonProgresses.get(l.id)?.completed).length} / {validLessons.length} leçons complétées
            </Text>
          </View>
        )}

        {/* Liste des leçons */}
        {course.type === "internal" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leçons</Text>
            {lessons.length === 0 ? (
              <Text style={styles.emptyText}>Aucune leçon disponible</Text>
            ) : (
              lessons
                .filter(lesson => lesson && lesson.id)
                .map((lesson, index) => {
                  const status = getLessonStatus(lesson);
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                    style={styles.lessonCard}
                    onPress={() => handleLessonPress(lesson)}
                  >
                    <View style={styles.lessonInfo}>
                      <View style={styles.lessonHeader}>
                        <View style={styles.lessonNumber}>
                          <Text style={styles.lessonNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.lessonContent}>
                          <Text style={styles.lessonTitle}>{lesson.title}</Text>
                          <View style={styles.lessonMeta}>
                            <Text style={styles.lessonType}>
                              {lesson.contentType === "text" ? "📄 Texte" : 
                               lesson.contentType === "video" ? "🎥 Vidéo" : "📎 PDF"}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                              <Text style={styles.statusBadgeText}>{status.label}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Bouton compléter le cours */}
        {course.type === "internal" && allLessonsCompleted && !courseProgress?.completed && (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteCourse}>
            <Text style={styles.completeButtonText}>✅ Marquer le cours comme complété</Text>
          </TouchableOpacity>
        )}

        {course.type === "internal" && courseProgress?.completed && (
          <View style={styles.completedCard}>
            <Text style={styles.completedText}>✅ Cours complété !</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "500",
  },
  courseHeader: {
    marginBottom: 24,
  },
  courseTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  courseDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 24,
  },
  progressCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
  },
  lessonCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  lessonNumberText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  lessonMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonType: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(34, 197, 94, 0.5)",
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  completedCard: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

