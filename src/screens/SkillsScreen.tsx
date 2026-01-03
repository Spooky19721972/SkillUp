import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { userSkillService, AvailableSkill } from "../services";

export default function SkillsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableSkills();
  }, [user]);

  const loadAvailableSkills = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const skills = await userSkillService.getAvailableSkills(user.uid);
      setAvailableSkills(skills);
    } catch (error) {
      console.error("Erreur lors du chargement des compétences:", error);
      Alert.alert("Erreur", "Impossible de charger les compétences disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollInSkill = async (skill: AvailableSkill) => {
    if (!user) return;

    if (skill.userProgress) {
      Alert.alert("Info", "Vous êtes déjà inscrit à cette compétence");
      return;
    }

    Alert.alert(
      "S'inscrire à la compétence",
      `Voulez-vous vous inscrire à la compétence "${skill.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "S'inscrire",
          onPress: async () => {
            try {
              await userSkillService.enrollInSkill(user.uid, skill.id);
              Alert.alert("Succès", "Inscription réussie !");
              loadAvailableSkills(); // Recharger pour mettre à jour l'état
            } catch (error: any) {
              Alert.alert("Erreur", error.message || "Impossible de s'inscrire à cette compétence");
            }
          },
        },
      ]
    );
  };

  const getLevelLabel = (level?: number) => {
    if (level === undefined || level === 0) return 'Débutant';
    if (level < 35) return 'Débutant';
    if (level < 70) return 'Intermédiaire';
    return 'Avancé';
  };

  const renderSkillItem = ({ item }: { item: AvailableSkill }) => {
    const isEnrolled = !!item.userProgress;
    const level = item.userProgress?.level ?? 0;
    const levelLabel = getLevelLabel(level);
    const coursesCompleted = item.userProgress?.coursesCompleted ?? 0;
    const totalCourses = item.courseCount;

    return (
      <View style={styles.skillCard}>
        <View style={styles.skillInfo}>
          <View style={styles.skillHeader}>
            <Text style={styles.skillName}>{item.name}</Text>
            {isEnrolled && (
              <View style={styles.enrolledBadge}>
                <Text style={styles.enrolledBadgeText}>Inscrit</Text>
              </View>
            )}
          </View>
          <Text style={styles.skillDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.courseInfo}>
            <Text style={styles.courseInfoText}>
              📚 {totalCourses} cours disponible{totalCourses > 1 ? 's' : ''}
            </Text>
          </View>

          {isEnrolled && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.levelText}>Niveau: {levelLabel}</Text>
                <Text style={styles.progressPercentage}>{level}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${level}%` }]}
                />
              </View>
              <Text style={styles.coursesProgressText}>
                {coursesCompleted} / {totalCourses} cours complétés
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isEnrolled ? styles.viewButton : styles.enrollButton,
          ]}
          onPress={() => {
            if (isEnrolled) {
              navigation.navigate("SkillDetails" as never, { skillId: item.id } as never);
            } else {
              handleEnrollInSkill(item);
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {isEnrolled ? "Voir les cours" : "S'inscrire"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Compétences Disponibles</Text>
        <Text style={styles.subtitle}>
          Choisissez une compétence pour commencer votre apprentissage
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={availableSkills.filter(skill => skill && skill.id && !skill.userProgress)}
          renderItem={renderSkillItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucune compétence disponible pour le moment.
              </Text>
              <Text style={styles.emptySubtext}>
                Les compétences apparaîtront ici une fois que l'administrateur aura créé des cours.
              </Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
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
  list: {
    padding: 20,
  },
  skillCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skillInfo: {
    marginBottom: 15,
  },
  skillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  skillName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  enrolledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  enrolledBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  skillDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 10,
  },
  courseInfo: {
    marginTop: 8,
    marginBottom: 10,
  },
  courseInfoText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  progressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  coursesProgressText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  enrollButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  viewButton: {
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
  },
});
