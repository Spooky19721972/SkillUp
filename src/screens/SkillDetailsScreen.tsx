import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { adminSkillService } from "../services/adminSkillService";
import { adminCourseService } from "../services/adminCourseService";
import { userSkillService } from "../services/userSkillService";
import { progressService } from "../services/progressService";
import { Course } from "../models/Course";
import { Skill } from "../models/Skill";
import { Progress } from "../models/Progress";

interface RouteParams {
  skillId: string;
}

export default function SkillDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { skillId } = (route.params as RouteParams) || {};

  const [skill, setSkill] = useState<Skill | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [courseProgresses, setCourseProgresses] = useState<
    Map<string, Progress>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [canTakeQuiz, setCanTakeQuiz] = useState(false);

  useEffect(() => {
    loadSkillDetails();
  }, [skillId, user]);

  const loadSkillDetails = async () => {
    if (!user || !skillId) return;

    setLoading(true);
    try {
      // Charger la compétence
      const skillData = await adminSkillService.getSkillById(skillId);
      if (!skillData) {
        Alert.alert("Erreur", "Compétence introuvable");
        navigation.goBack();
        return;
      }
      setSkill(skillData);

      // Charger les cours associés
      const coursesData = await adminSkillService.getSkillCourses(skillId);
      // Filtrer les cours invalides
      const validCourses = coursesData.filter((course) => course && course.id);
      setCourses(validCourses);

      // Charger la progression utilisateur
      const progress = await userSkillService.getUserSkillProgress(
        user.uid,
        skillId
      );
      setUserProgress(progress);

      // Charger la progression pour chaque cours
      const progressesMap = new Map<string, Progress>();
      for (const course of validCourses) {
        if (!course || !course.id) continue;
        const courseProgress = await progressService.getCourseProgress(
          user.uid,
          course.id
        );
        if (courseProgress) {
          progressesMap.set(course.id, courseProgress);
        }
      }
      setCourseProgresses(progressesMap);

      // Vérifier si tous les cours sont complétés
      const allCoursesCompleted =
        validCourses.length > 0 &&
        validCourses.every((course) => {
          const progress = progressesMap.get(course.id);
          return progress?.completed === true;
        });
      setCanTakeQuiz(allCoursesCompleted && validCourses.length > 0);
    } catch (error: any) {
      console.error("Erreur lors du chargement:", error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible de charger les détails"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePress = (course: Course) => {
    if (!course || !course.id) return;
    navigation.navigate(
      "CourseDetails" as never,
      { courseId: course.id, skillId } as never
    );
  };

  const handleExternalCourse = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        // Marquer le cours comme démarré
        if (user && skill) {
          const course = courses.find(
            (c) => c && c.id && c.externalUrl === url
          );
          if (course && course.id) {
            await progressService.startCourse(user.uid, course.id);
            loadSkillDetails(); // Recharger pour mettre à jour la progression
          }
        }
      } else {
        Alert.alert("Erreur", "Impossible d'ouvrir ce lien");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ouvrir le lien");
    }
  };

  const handleTakeQuiz = () => {
    if (!canTakeQuiz) {
      Alert.alert(
        "Info",
        "Vous devez compléter tous les cours avant de passer le quiz"
      );
      return;
    }

    // Trouver le quiz associé à cette compétence
    navigation.navigate("Quiz" as never, { skillId } as never);
  };

  const getCourseStatus = (course: Course) => {
    if (!course || !course.id)
      return { label: "Non commencé", color: "#9CA3AF" };
    const progress = courseProgresses.get(course.id);
    if (!progress) return { label: "Non commencé", color: "#9CA3AF" };
    if (progress.completed) return { label: "Complété", color: "#10B981" };
    return { label: "En cours", color: "#F59E0B" };
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

  if (!skill) {
    return null;
  }

  const level = userProgress?.level ?? 0;
  const coursesCompleted = userProgress?.coursesCompleted ?? 0;
  const totalCourses = courses.length;

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

        <View style={styles.skillHeader}>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.skillDescription}>{skill.description}</Text>
        </View>

        {/* Progression */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Votre progression</Text>
            <Text style={styles.progressPercentage}>{level}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${level}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {coursesCompleted} / {totalCourses} cours complétés
          </Text>
        </View>

        {/* Liste des cours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cours disponibles</Text>
          {courses.length === 0 ? (
            <Text style={styles.emptyText}>Aucun cours disponible</Text>
          ) : (
            courses
              .filter((course) => course && course.id)
              .map((course) => {
                const status = getCourseStatus(course);
                return (
                  <TouchableOpacity
                    key={course.id}
                    style={styles.courseCard}
                    onPress={() => {
                      if (course.type === "external") {
                        handleExternalCourse(course.externalUrl || "");
                      } else {
                        handleCoursePress(course);
                      }
                    }}
                  >
                    <View style={styles.courseInfo}>
                      <View style={styles.courseHeader}>
                        <Text style={styles.courseTitle}>{course.title}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: status.color },
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.courseDescription} numberOfLines={2}>
                        {course.description}
                      </Text>
                      <View style={styles.courseMeta}>
                        <Text style={styles.courseType}>
                          {course.type === "internal"
                            ? "📚 Cours interne"
                            : "🔗 Cours externe"}
                        </Text>
                        {course.type === "external" && course.externalUrl && (
                          <Text style={styles.courseUrl} numberOfLines={1}>
                            {course.externalUrl}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
          )}
        </View>

        {/* Bouton Quiz */}
        {canTakeQuiz && (
          <TouchableOpacity style={styles.quizButton} onPress={handleTakeQuiz}>
            <Text style={styles.quizButtonText}>📝 Passer le quiz</Text>
            <Text style={styles.quizButtonSubtext}>
              Valider votre compétence
            </Text>
          </TouchableOpacity>
        )}

        {!canTakeQuiz && totalCourses > 0 && (
          <View style={styles.quizLockedCard}>
            <Text style={styles.quizLockedText}>
              🔒 Complétez tous les cours pour débloquer le quiz
            </Text>
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
  skillHeader: {
    marginBottom: 24,
  },
  skillName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  skillDescription: {
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
  courseCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  courseInfo: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  courseDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  courseMeta: {
    marginTop: 8,
  },
  courseType: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  courseUrl: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
  },
  quizButton: {
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(34, 197, 94, 0.5)",
    marginTop: 8,
  },
  quizButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  quizButtonSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  quizLockedCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  quizLockedText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
});
