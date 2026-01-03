import React, { useEffect, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { adminService } from "../services/adminService";
import { StatCard } from "../components/StatCard";
import { ProgressBar } from "../components/ProgressBar";

interface Stats {
  totalUsers: number;
  totalSkills: number;
  totalCourses: number;
  totalQuizzes: number;
  totalBadges: number;
  newUsersThisWeek: number;
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSkills: 0,
    totalCourses: 0,
    totalQuizzes: 0,
    totalBadges: 0,
    newUsersThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<{ date: string; count: number }[]>([]);

  // Vérifier le rôle admin au chargement
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        navigation.navigate("AdminLogin" as never);
        return;
      }

      try {
        const userProfile = await userService.getUserProfile(user.uid);
        if (!userProfile || userProfile.role !== "admin") {
          Alert.alert(
            "Accès refusé",
            "Vous n'avez pas les permissions d'administrateur."
          );
          await signOut(auth);
          navigation.navigate("AdminLogin" as never);
        } else {
          loadDashboardData();
        }
      } catch (error) {
        console.error("Erreur vérification admin:", error);
        navigation.navigate("AdminLogin" as never);
      }
    };

    checkAdminRole();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        totalUsers,
        totalSkills,
        totalCourses,
        totalQuizzes,
        totalBadges,
        progress,
        newUsersThisWeek,
      ] = await Promise.all([
        adminService.getTotalUsers(),
        adminService.getTotalSkills(),
        adminService.getTotalCourses(),
        adminService.getTotalQuizzes(),
        adminService.getTotalBadges(),
        adminService.getProgressData(),
        adminService.getNewUsersThisWeek(),
      ]);

      setStats({
        totalUsers,
        totalSkills,
        totalCourses,
        totalQuizzes,
        totalBadges,
        newUsersThisWeek,
      });
      setProgressData(progress);
    } catch (error: any) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert(
        'Erreur de chargement',
        'Impossible de charger les statistiques du dashboard. Vérifiez votre connexion internet.',
        [
          { text: 'Réessayer', onPress: () => loadDashboardData() },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("AdminLogin" as never);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de se déconnecter");
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement du dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  const maxProgress = progressData.length > 0
    ? Math.max(...progressData.map(d => d.count))
    : 1;

  return (
    <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard Admin</Text>
          <Text style={styles.subtitle}>
            Vue globale de la plateforme
          </Text>
          {user && (
            <Text style={styles.email}>{user.email}</Text>
          )}
        </View>

        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Utilisateurs"
              value={stats.totalUsers}
              icon="👥"
              color="#3b82f6"
              onPress={() => navigation.navigate("AdminUsers" as never)}
              additionalInfo={stats.newUsersThisWeek > 0 ? `+${stats.newUsersThisWeek} cette semaine` : undefined}
              trend={stats.newUsersThisWeek > 0 ? 'up' : 'neutral'}
            />
            <StatCard title="Compétences" value={stats.totalSkills} icon="📚" color="#8b5cf6" />
            <StatCard title="Cours" value={stats.totalCourses} icon="🎓" color="#a855f7" />
            <StatCard title="Quiz" value={stats.totalQuizzes} icon="📝" color="#c084fc" />
            <StatCard title="Badges" value={stats.totalBadges} icon="🏆" color="#d946ef" />
          </View>
        </View>

        {/* Graphique d'activité */}
        {progressData.length > 0 && (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>📈 Activité (7 derniers jours)</Text>
            <View style={styles.chartContainer}>
              {progressData.map((item) => (
                <ProgressBar
                  key={item.date}
                  date={item.date}
                  count={item.count}
                  max={maxProgress}
                />
              ))}
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigationSection}>
          <Text style={styles.sectionTitle}>⚙️ Gestion</Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("AdminUsers" as never)}
          >
            <Text style={styles.navButtonIcon}>👥</Text>
            <Text style={styles.navButtonText}>Gérer Utilisateurs</Text>
            <Text style={styles.navButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("AdminSkills" as never)}
          >
            <Text style={styles.navButtonIcon}>📚</Text>
            <Text style={styles.navButtonText}>Gérer Compétences</Text>
            <Text style={styles.navButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("AdminCourses" as never)}
          >
            <Text style={styles.navButtonIcon}>🎓</Text>
            <Text style={styles.navButtonText}>Gérer Cours</Text>
            <Text style={styles.navButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("AdminQuizzes" as never)}
          >
            <Text style={styles.navButtonIcon}>📝</Text>
            <Text style={styles.navButtonText}>Gérer Quiz</Text>
            <Text style={styles.navButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("AdminBadges" as never)}
          >
            <Text style={styles.navButtonIcon}>🏆</Text>
            <Text style={styles.navButtonText}>Gérer Badges</Text>
            <Text style={styles.navButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("AdminProgress" as never)}
          >
            <Text style={styles.navButtonIcon}>📈</Text>
            <Text style={styles.navButtonText}>Voir Progression</Text>
            <Text style={styles.navButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 5,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 5,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  activitySection: {
    marginBottom: 30,
  },
  chartContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  navigationSection: {
    marginBottom: 30,
  },
  navButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  navButtonIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  navButtonText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  navButtonArrow: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.6)",
  },
  logoutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
