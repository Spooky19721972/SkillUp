import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { adminCourseService } from "../services/adminCourseService";
import { adminSkillService } from "../services/adminSkillService";
import { Course } from "../models/Course";
import { Lesson } from "../models/Lesson";
import { Skill } from "../models/Skill";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export default function AdminCoursesScreen() {
  const navigation = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillId: "",
    type: "internal" as "internal" | "external",
    externalUrl: "",
  });
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content: "",
    contentType: "text" as "text" | "video" | "pdf",
    contentUrl: "",
    order: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCourses, allSkills] = await Promise.all([
        adminCourseService.getAllCourses(),
        adminSkillService.getAllSkills(),
      ]);
      setCourses(allCourses);
      setSkills(allSkills);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      const courseLessons = await adminCourseService.getCourseLessons(courseId);
      setLessons(courseLessons);
    } catch (error: any) {
      console.error("Erreur lors du chargement des leçons:", error);
      Alert.alert(
        "Erreur",
        error.message ||
          "Impossible de charger les leçons. Vérifiez votre connexion."
      );
    }
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      description: "",
      skillId: skills[0]?.id || "",
      type: "internal",
      externalUrl: "",
    });
    setModalVisible(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      skillId: course.skillId,
      type: course.type || "internal",
      externalUrl: course.externalUrl || "",
    });
    setModalVisible(true);
  };

  const handleSaveCourse = async () => {
    if (!formData.title || !formData.skillId) {
      Alert.alert("Erreur", "Le titre et la compétence sont requis");
      return;
    }

    if (formData.type === "external" && !formData.externalUrl) {
      Alert.alert(
        "Erreur",
        "L'URL externe est requise pour les cours externes"
      );
      return;
    }

    setActionLoading(true);
    try {
      // Construire l'objet courseData en excluant les champs undefined
      const courseData: any = {
        title: formData.title,
        description: formData.description,
        skillId: formData.skillId,
        type: formData.type,
      };

      // Ajouter externalUrl uniquement si le type est 'external' et que l'URL existe
      if (formData.type === "external" && formData.externalUrl) {
        courseData.externalUrl = formData.externalUrl;
      }

      if (editingCourse) {
        await adminCourseService.updateCourse(editingCourse.id, courseData);
        Alert.alert("Succès", "Cours modifié avec succès");
      } else {
        await adminCourseService.addCourse(courseData);
        Alert.alert("Succès", "Cours ajouté avec succès");
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      "Supprimer",
      `Êtes-vous sûr de vouloir supprimer le cours "${course.title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminCourseService.deleteCourse(course.id);
              Alert.alert("Succès", "Cours supprimé avec succès");
              loadData();
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleManageLessons = async (course: Course) => {
    setSelectedCourse(course);
    await loadLessons(course.id);
    setLessonModalVisible(true);
  };

  const handleAddLesson = () => {
    setLessonFormData({
      title: "",
      content: "",
      contentType: "text",
      contentUrl: "",
      order: lessons.length + 1,
    });
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) {
      Alert.alert("Erreur", "Aucun cours sélectionné");
      return;
    }

    if (!lessonFormData.title.trim()) {
      Alert.alert("Erreur", "Le titre de la leçon est requis");
      return;
    }

    // Validation selon le type de contenu
    if (
      lessonFormData.contentType === "text" &&
      !lessonFormData.content.trim()
    ) {
      Alert.alert(
        "Erreur",
        "Le contenu texte est requis pour une leçon de type texte"
      );
      return;
    }

    if (
      (lessonFormData.contentType === "video" ||
        lessonFormData.contentType === "pdf") &&
      !lessonFormData.contentUrl.trim()
    ) {
      Alert.alert(
        "Erreur",
        `L'URL est requise pour une leçon de type ${
          lessonFormData.contentType === "video" ? "vidéo" : "PDF"
        }`
      );
      return;
    }

    setActionLoading(true);
    try {
      // Préparer les données de la leçon
      const lessonData: any = {
        title: lessonFormData.title.trim(),
        content: lessonFormData.content.trim() || "", // Toujours inclure content même si vide pour vidéo/PDF
        courseId: selectedCourse.id,
        order: lessonFormData.order,
        contentType: lessonFormData.contentType,
      };

      // Ajouter contentUrl uniquement si nécessaire
      if (
        (lessonFormData.contentType === "video" ||
          lessonFormData.contentType === "pdf") &&
        lessonFormData.contentUrl.trim()
      ) {
        lessonData.contentUrl = lessonFormData.contentUrl.trim();
      }

      console.log("Ajout de la leçon avec les données:", lessonData);
      const lessonId = await adminCourseService.addLesson(lessonData);
      console.log("Leçon ajoutée avec succès, ID:", lessonId);

      Alert.alert("Succès", "Leçon ajoutée avec succès");

      // Recharger les leçons après un court délai pour laisser le temps à Firestore
      setTimeout(async () => {
        try {
          await loadLessons(selectedCourse.id);
        } catch (loadError: any) {
          console.error("Erreur lors du rechargement:", loadError);
          // Ne pas afficher d'erreur ici car la leçon a été ajoutée avec succès
          // Juste recharger sans orderBy en cas d'erreur
          try {
            const lessonsQuery = query(
              collection(db, "lessons"),
              where("courseId", "==", selectedCourse.id)
            );
            const lessonsSnapshot = await getDocs(lessonsQuery);
            const loadedLessons = lessonsSnapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Lesson[];
            setLessons(
              loadedLessons.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            );
          } catch (fallbackError) {
            console.error(
              "Erreur lors du rechargement de secours:",
              fallbackError
            );
          }
        }
      }, 500);

      setLessonFormData({
        title: "",
        content: "",
        contentType: "text",
        contentUrl: "",
        order: lessons.length + 2,
      });
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la leçon:", error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible d'ajouter la leçon. Veuillez réessayer."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!selectedCourse) return;

    Alert.alert(
      "Supprimer",
      `Êtes-vous sûr de vouloir supprimer la leçon "${lesson.title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminCourseService.deleteLesson(lesson.id);
              Alert.alert("Succès", "Leçon supprimée avec succès");
              await loadLessons(selectedCourse.id);
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReorderLessons = async (newOrder: string[]) => {
    if (!selectedCourse) return;

    setActionLoading(true);
    try {
      await adminCourseService.reorderLessons(newOrder);
      await loadLessons(selectedCourse.id);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const renderCourseItem = ({ item }: { item: Course }) => {
    const skill = skills.find((s) => s.id === item.skillId);

    return (
      <View style={styles.courseCard}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{item.title}</Text>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.courseSkill}>
            Compétence: {skill?.name || "Non définie"}
          </Text>
          <View style={styles.courseTypeBadge}>
            <Text style={styles.courseTypeBadgeText}>
              {item.type === "internal" ? "📚 Interne" : "🔗 Externe"}
            </Text>
          </View>
          {item.type === "internal" && (
            <Text style={styles.courseLessons}>
              {item.lessons?.length || 0} leçon(s)
            </Text>
          )}
          {item.type === "external" && item.externalUrl && (
            <Text style={styles.courseExternalUrl} numberOfLines={1}>
              {item.externalUrl}
            </Text>
          )}
        </View>

        <View style={styles.courseActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditCourse(item)}
          >
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>

          {item.type === "internal" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.lessonsButton]}
              onPress={() => handleManageLessons(item)}
            >
              <Text style={styles.actionButtonText}>Leçons</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteCourse(item)}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des cours...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Gérer les Cours</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{courses.length} cours</Text>
      </View>

      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun cours</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddCourse}
            >
              <Text style={styles.emptyButtonText}>Créer le premier cours</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Ajout/Modification Cours */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCourse ? "Modifier le cours" : "Ajouter un cours"}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Titre du cours"
              placeholderTextColor="#9CA3AF"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description"
              placeholderTextColor="#9CA3AF"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={4}
            />

            <Text style={styles.modalLabel}>Type de cours</Text>
            <View style={styles.courseTypeContainer}>
              {(["internal", "external"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.courseTypeOption,
                    formData.type === type && styles.courseTypeOptionSelected,
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      type,
                      externalUrl:
                        type === "internal" ? "" : formData.externalUrl,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.courseTypeOptionText,
                      formData.type === type &&
                        styles.courseTypeOptionTextSelected,
                    ]}
                  >
                    {type === "internal" ? "Interne" : "Externe (Coursera)"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.type === "external" && (
              <TextInput
                style={styles.modalInput}
                placeholder="URL du cours externe (ex: https://www.coursera.org/...)"
                placeholderTextColor="#9CA3AF"
                value={formData.externalUrl}
                onChangeText={(text) =>
                  setFormData({ ...formData, externalUrl: text })
                }
                autoCapitalize="none"
                keyboardType="url"
              />
            )}

            <Text style={styles.modalLabel}>Compétence associée</Text>
            <ScrollView style={styles.skillsList}>
              {skills.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={[
                    styles.skillOption,
                    formData.skillId === skill.id && styles.skillOptionSelected,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, skillId: skill.id })
                  }
                >
                  <Text
                    style={[
                      styles.skillOptionText,
                      formData.skillId === skill.id &&
                        styles.skillOptionTextSelected,
                    ]}
                  >
                    {skill.name}
                  </Text>
                  {formData.skillId === skill.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCourse}
                disabled={actionLoading}
              >
                <Text style={styles.saveButtonText}>
                  {actionLoading ? "Enregistrement..." : "Enregistrer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Gestion des Leçons */}
      <Modal
        visible={lessonModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLessonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.lessonModalContent]}>
            <Text style={styles.modalTitle}>
              Leçons - {selectedCourse?.title}
            </Text>

            <ScrollView style={styles.lessonsList}>
              {lessons.map((lesson, index) => (
                <View key={lesson.id} style={styles.lessonItem}>
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonOrder}>{index + 1}</Text>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.lessonType}>
                        Type:{" "}
                        {lesson.contentType === "text"
                          ? "Texte"
                          : lesson.contentType === "video"
                          ? "Vidéo"
                          : "PDF"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteLessonButton}
                      onPress={() => handleDeleteLesson(lesson)}
                    >
                      <Text style={styles.deleteLessonButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.addLessonSection}>
              <Text style={styles.sectionTitle}>Ajouter une leçon</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Titre de la leçon"
                placeholderTextColor="#9CA3AF"
                value={lessonFormData.title}
                onChangeText={(text) =>
                  setLessonFormData({ ...lessonFormData, title: text })
                }
              />

              <Text style={styles.modalLabel}>Type de contenu</Text>
              <View style={styles.contentTypeContainer}>
                {(["text", "video", "pdf"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.contentTypeOption,
                      lessonFormData.contentType === type &&
                        styles.contentTypeOptionSelected,
                    ]}
                    onPress={() =>
                      setLessonFormData({
                        ...lessonFormData,
                        contentType: type,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.contentTypeOptionText,
                        lessonFormData.contentType === type &&
                          styles.contentTypeOptionTextSelected,
                      ]}
                    >
                      {type === "text"
                        ? "Texte"
                        : type === "video"
                        ? "Vidéo (lien)"
                        : "PDF (lien)"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {lessonFormData.contentType !== "text" && (
                <TextInput
                  style={styles.modalInput}
                  placeholder="URL du contenu"
                  placeholderTextColor="#9CA3AF"
                  value={lessonFormData.contentUrl}
                  onChangeText={(text) =>
                    setLessonFormData({ ...lessonFormData, contentUrl: text })
                  }
                />
              )}

              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Contenu (texte)"
                placeholderTextColor="#9CA3AF"
                value={lessonFormData.content}
                onChangeText={(text) =>
                  setLessonFormData({ ...lessonFormData, content: text })
                }
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.addLessonButton}
                onPress={handleSaveLesson}
                disabled={actionLoading}
              >
                <Text style={styles.addLessonButtonText}>
                  {actionLoading ? "Ajout..." : "Ajouter la leçon"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setLessonModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  list: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  courseInfo: {
    marginBottom: 15,
  },
  courseName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  courseSkill: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  courseLessons: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  courseTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 8,
  },
  courseTypeBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  courseExternalUrl: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  courseActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  lessonsButton: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    width: "90%",
    maxHeight: "80%",
  },
  lessonModalContent: {
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  skillsList: {
    maxHeight: 150,
    marginBottom: 15,
  },
  courseTypeContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  courseTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  courseTypeOptionSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366f1",
  },
  courseTypeOptionText: {
    fontSize: 14,
    color: "#111827",
  },
  courseTypeOptionTextSelected: {
    color: "#6366f1",
    fontWeight: "600",
  },
  skillOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  skillOptionSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366f1",
  },
  skillOptionText: {
    fontSize: 16,
    color: "#111827",
  },
  skillOptionTextSelected: {
    color: "#6366f1",
    fontWeight: "600",
  },
  checkmark: {
    color: "#6366f1",
    fontSize: 18,
    fontWeight: "bold",
  },
  contentTypeContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  contentTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  contentTypeOptionSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366f1",
  },
  contentTypeOptionText: {
    fontSize: 14,
    color: "#111827",
  },
  contentTypeOptionTextSelected: {
    color: "#6366f1",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  lessonsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  lessonItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  lessonOrder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6366f1",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "bold",
    marginRight: 10,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  lessonType: {
    fontSize: 12,
    color: "#6B7280",
  },
  deleteLessonButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteLessonButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  addLessonSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 15,
  },
  addLessonButton: {
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
    marginTop: 10,
  },
  addLessonButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
