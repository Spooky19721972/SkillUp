import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService, validatedSkillService } from '../services';
import { UserProfile } from '../models/User';
import { ValidatedSkill } from '../models/ValidatedSkill';

export default function ProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [validatedSkills, setValidatedSkills] = useState<ValidatedSkill[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    loadProfile();
    loadValidatedSkills();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userData = await userService.getUserProfile(user.uid);
      if (userData) {
        setProfile({
          name: userData.name,
          email: userData.email,
          bio: userData.bio || '',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const loadValidatedSkills = async () => {
    if (!user) return;
    setLoadingResults(true);
    try {
      const skills = await validatedSkillService.getUserValidatedSkills(user.uid);
      setValidatedSkills(skills);
    } catch (error) {
      console.error('Erreur lors du chargement des compétences validées:', error);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!profile.name || !profile.email) {
      Alert.alert('Erreur', 'Le nom et l\'email sont requis');
      return;
    }

    setLoading(true);
    try {
      await userService.updateProfile(user.uid, profile);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon Profil</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Votre nom"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder="Votre email"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="Parlez-nous de vous..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F3F4F6']}
              style={styles.buttonGradient}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 10 }]}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.buttonGradient}
            >
              <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                Déconnexion
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Section Résultats */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Résultats</Text>
          <Text style={styles.sectionSubtitle}>Compétences validées</Text>

          {loadingResults ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />
          ) : validatedSkills.length === 0 ? (
            <View style={styles.emptyResultsContainer}>
              <Text style={styles.emptyResultsText}>
                Aucune compétence validée pour le moment
              </Text>
            </View>
          ) : (
            <FlatList
              data={validatedSkills}
              renderItem={({ item }) => (
                <View style={styles.validatedSkillCard}>
                  <View style={styles.validatedSkillHeader}>
                    <Text style={styles.validatedSkillName}>{item.skillName}</Text>
                    <View style={styles.validatedBadge}>
                      <Text style={styles.validatedBadgeText}>✅ Validée</Text>
                    </View>
                  </View>
                  <View style={styles.validatedSkillDetails}>
                    <Text style={styles.validatedSkillScore}>
                      Score: {item.quizScore}%
                    </Text>
                    <Text style={styles.validatedSkillDate}>
                      {new Date(item.validatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  {item.badgesUnlocked && item.badgesUnlocked.length > 0 && (
                    <View style={styles.badgesContainer}>
                      <Text style={styles.badgesLabel}>
                        🏆 {item.badgesUnlocked.length} badge(s) débloqué(s)
                      </Text>
                    </View>
                  )}
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsSection: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  emptyResultsContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyResultsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  validatedSkillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  validatedSkillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  validatedSkillName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  validatedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  validatedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  validatedSkillDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validatedSkillScore: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  validatedSkillDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  badgesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgesLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});













