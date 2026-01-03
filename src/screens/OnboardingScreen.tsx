import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Apprends',
    description: 'Explore de nouvelles compétences et enrichis tes connaissances à ton rythme.',
    icon: '📚',
    color: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 2,
    title: 'Progresse',
    description: 'Suis ton évolution et visualise tes progrès avec des statistiques détaillées.',
    icon: '📈',
    color: ['#8b5cf6', '#a855f7'],
  },
  {
    id: 3,
    title: 'Partage',
    description: 'Partage tes réalisations et inspire-toi de la communauté SkillUp.',
    icon: '🤝',
    color: ['#a855f7', '#c084fc'],
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handlePageChange = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const goToNextPage = () => {
    if (currentPage < slides.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    }
  };

  const handleSkip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Login' as never);
    });
  };

  const handleGetStarted = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Login' as never);
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.page}>
            <LinearGradient
              colors={slide.color}
              style={styles.gradient}
            >
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>Passer</Text>
              </TouchableOpacity>

              <View style={styles.content}>
                <Text style={styles.icon}>{slide.icon}</Text>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>

              <View style={styles.pagination}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentPage && styles.dotActive,
                    ]}
                  />
                ))}
              </View>

              {index === slides.length - 1 ? (
                <TouchableOpacity
                  style={styles.getStartedButton}
                  onPress={handleGetStarted}
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F3F4F6']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.getStartedText}>Commencer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={goToNextPage}
                >
                  <Text style={styles.nextButtonText}>Suivant →</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        ))}
      </PagerView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    alignSelf: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  getStartedButton: {
    alignSelf: 'center',
    width: width - 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderRadius: 30,
  },
  getStartedText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
});













