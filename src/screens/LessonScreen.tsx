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
import { adminCourseService } from "../services/adminCourseService";
import { progressService } from "../services/progressService";
import { Lesson } from "../models/Lesson";

interface RouteParams {
  lessonId: string;
  courseId: string;
  skillId: string;
}

export default function LessonScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId, courseId, skillId } = (route.params as RouteParams) || {};
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [lessonId, user]);

  const loadLesson = async () => {
    if (!user || !lessonId) return;
    
    setLoading(true);
    try {
      // Charger la leçon
      const lessonDoc = await adminCourseService.getLessonById(lessonId);
      if (!lessonDoc) {
        Alert.alert("Erreur", "Leçon introuvable");
        navigation.goBack();
        return;
      }
      setLesson(lessonDoc);

      // Vérifier si la leçon est complétée
      const progress = await progressService.getLessonProgress(user.uid, lessonId);
      setIsCompleted(progress?.completed ?? false);

      // Démarrer la leçon si pas encore commencée
      if (!progress) {
        await progressService.startLesson(user.uid, lessonId, courseId);
      }

    } catch (error: any) {
      console.error("Erreur lors du chargement:", error);
      Alert.alert("Erreur", error.message || "Impossible de charger la leçon");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExternalContent = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Erreur", "Impossible d'ouvrir ce lien");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ouvrir le lien");
    }
  };

  const handleCompleteLesson = async () => {
    if (!user || !lesson) return;

    try {
      await progressService.completeLesson(user.uid, lessonId, courseId);
      setIsCompleted(true);
      Alert.alert("Félicitations !", "Vous avez complété cette leçon !");
      
      // Mettre à jour la progression du cours
      const courseProgress = await progressService.getCourseProgress(user.uid, courseId);
      if (courseProgress) {
        // Recalculer le pourcentage basé sur les leçons complétées
        const lessons = await adminCourseService.getCourseLessons(courseId);
        const validLessons = lessons.filter(l => l && l.id);
        const completedLessons = await Promise.all(
          validLessons.map(async (l) => {
            const p = await progressService.getLessonProgress(user.uid, l.id);
            return p?.completed === true;
          })
        );
        const completedCount = completedLessons.filter(Boolean).length;
        const percentage = validLessons.length > 0 ? Math.round((completedCount / validLessons.length) * 100) : 0;
        
        await progressService.updateProgress(user.uid, {
          courseId,
          percentage,
          completed: percentage === 100,
        });
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de compléter la leçon");
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

  if (!lesson) {
    return null;
  }

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

        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <View style={styles.lessonTypeBadge}>
            <Text style={styles.lessonTypeText}>
              {lesson.contentType === "text" ? "📄 Texte" : 
               lesson.contentType === "video" ? "🎥 Vidéo" : "📎 PDF"}
            </Text>
          </View>
        </View>

        {/* Contenu selon le type */}
        {lesson.contentType === "text" && (
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{lesson.content}</Text>
          </View>
        )}

        {(lesson.contentType === "video" || lesson.contentType === "pdf") && lesson.contentUrl && (
          <View style={styles.contentCard}>
            <Text style={styles.contentLabel}>
              {lesson.contentType === "video" ? "Vidéo" : "Document PDF"}
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleOpenExternalContent(lesson.contentUrl!)}
            >
              <Text style={styles.linkButtonText}>Ouvrir le contenu</Text>
            </TouchableOpacity>
            {lesson.content && (
              <Text style={styles.contentText}>{lesson.content}</Text>
            )}
          </View>
        )}

        {/* Bouton compléter */}
        {!isCompleted && (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteLesson}>
            <Text style={styles.completeButtonText}>✅ Marquer comme complété</Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={styles.completedCard}>
            <Text style={styles.completedText}>✅ Leçon complétée !</Text>
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
  lessonHeader: {
    marginBottom: 24,
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  lessonTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  lessonTypeText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  contentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 24,
  },
  linkButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  completeButton: {
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(34, 197, 94, 0.5)",
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
  },
  completedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

