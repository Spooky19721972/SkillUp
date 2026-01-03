import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { adminUserService } from '../services/adminUserService';
import { User } from '../models/User';
import { Progress } from '../models/Progress';

export default function AdminUsersScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<Progress[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des utilisateurs...');
      const allUsers = await adminUserService.getAllUsers();
      console.log('📋 Utilisateurs reçus:', allUsers.length);
      console.log('📋 Détails:', allUsers.map(u => ({ email: u.email, name: u.name })));
      setUsers(allUsers);

      if (allUsers.length === 0) {
        console.warn('⚠️ Aucun utilisateur trouvé dans Firestore');
        Alert.alert(
          'Aucun utilisateur',
          'Aucun utilisateur n\'a été trouvé dans la base de données. Assurez-vous que les utilisateurs sont bien créés dans Firestore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      Alert.alert(
        'Erreur de chargement',
        `Impossible de charger les utilisateurs: ${error.message}. Vérifiez votre connexion et les règles Firestore.`,
        [
          { text: 'Réessayer', onPress: () => loadUsers() },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const handleViewProgress = async (user: User) => {
    setActionLoading(true);
    try {
      const progress = await adminUserService.getUserProgress(user.id);
      setSelectedUser(user);
      setUserProgress(progress);
      setProgressModalVisible(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la progression');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlock = async (user: User) => {
    const isBlocked = (user as any).blocked || false;
    const action = isBlocked ? 'débloquer' : 'bloquer';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} l'utilisateur`,
      `Êtes-vous sûr de vouloir ${action} ${user.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminUserService.toggleUserBlock(user.id, !isBlocked);
              Alert.alert('Succès', `Utilisateur ${action} avec succès`);
              loadUsers();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de modifier le statut');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'admin') {
      Alert.alert('Erreur', 'Impossible de supprimer un administrateur');
      return;
    }

    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer ${user.name} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminUserService.deleteUser(user.id);
              Alert.alert('Succès', 'Utilisateur supprimé avec succès');
              loadUsers();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isBlocked = (item as any).blocked || false;
    const isAdmin = item.role === 'admin';

    return (
      <View style={[styles.userCard, isBlocked && styles.userCardBlocked]}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{item.name}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
            {isBlocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedBadgeText}>BLOQUÉ</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userDate}>
            Inscrit le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.actionButtonText}>Détails</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.progressButton]}
            onPress={() => handleViewProgress(item)}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Progression</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              isBlocked ? styles.unblockButton : styles.blockButton,
            ]}
            onPress={() => handleToggleBlock(item)}
            disabled={actionLoading || isAdmin}
          >
            <Text style={styles.actionButtonText}>
              {isBlocked ? 'Débloquer' : 'Bloquer'}
            </Text>
          </TouchableOpacity>

          {!isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteUser(item)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Gérer les Utilisateurs</Text>
        <Text style={styles.subtitle}>{users.length} utilisateur(s)</Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadUsers}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        }
      />

      {/* Modal Détails Utilisateur */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Détails Utilisateur</Text>
            {selectedUser && (
              <ScrollView>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nom:</Text>
                  <Text style={styles.detailValue}>{selectedUser.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rôle:</Text>
                  <Text style={styles.detailValue}>{selectedUser.role || 'user'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statut:</Text>
                  <Text style={styles.detailValue}>
                    {(selectedUser as any).blocked ? 'Bloqué' : 'Actif'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Inscrit le:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Compétences:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.skills?.length || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Objectifs:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.goals?.length || 0}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Badges:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.badges?.length || 0}
                  </Text>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Progression */}
      <Modal
        visible={progressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProgressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Progression - {selectedUser?.name}
            </Text>
            <ScrollView style={styles.progressList}>
              {userProgress.length === 0 ? (
                <Text style={styles.noProgressText}>
                  Aucune progression enregistrée
                </Text>
              ) : (
                userProgress.map((progress) => (
                  <View key={progress.id} style={styles.progressItem}>
                    <Text style={styles.progressType}>
                      {progress.lessonId ? 'Leçon' : progress.courseId ? 'Cours' : 'Quiz'}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress.percentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressPercentage}>
                      {progress.percentage}%
                    </Text>
                    {progress.completed && (
                      <Text style={styles.progressCompleted}>✓ Complété</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setProgressModalVisible(false)}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  list: {
    padding: 20,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userCardBlocked: {
    opacity: 0.6,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  userInfo: {
    marginBottom: 15,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  adminBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  blockedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  blockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  userDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  userActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  progressButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  blockButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  unblockButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressList: {
    maxHeight: 400,
  },
  noProgressText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 40,
  },
  progressItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressCompleted: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 5,
  },
});
