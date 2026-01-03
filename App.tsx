import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { View, StyleSheet } from "react-native";

import SplashScreenComponent from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SkillsScreen from "./src/screens/SkillsScreen";
import GoalsScreen from "./src/screens/GoalsScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import BadgesScreen from "./src/screens/BadgesScreen";
import QuizScreen from "./src/screens/QuizScreen";
import QuizListScreen from "./src/screens/QuizListScreen";
import ResourcesScreen from "./src/screens/ResourcesScreen";
import SkillDetailsScreen from "./src/screens/SkillDetailsScreen";
import CourseDetailsScreen from "./src/screens/CourseDetailsScreen";
import LessonScreen from "./src/screens/LessonScreen";
import AdminLoginScreen from "./src/screens/AdminLoginScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";
import AdminUsersScreen from "./src/screens/AdminUsersScreen";
import AdminSkillsScreen from "./src/screens/AdminSkillsScreen";
import AdminCoursesScreen from "./src/screens/AdminCoursesScreen";
import AdminQuizzesScreen from "./src/screens/AdminQuizzesScreen";
import AdminBadgesScreen from "./src/screens/AdminBadgesScreen";
import AdminProgressScreen from "./src/screens/AdminProgressScreen";

import { AuthProvider } from "./src/context/AuthContext";

const Stack = createStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: ({ current, next, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreenComponent} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Skills" component={SkillsScreen} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="Progress" component={ProgressScreen} />
          <Stack.Screen name="Badges" component={BadgesScreen} />
          <Stack.Screen name="QuizList" component={QuizListScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Resources" component={ResourcesScreen} />
          <Stack.Screen name="SkillDetails" component={SkillDetailsScreen} />
          <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
          <Stack.Screen name="Lesson" component={LessonScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
          />
          <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
          <Stack.Screen name="AdminSkills" component={AdminSkillsScreen} />
          <Stack.Screen name="AdminCourses" component={AdminCoursesScreen} />
          <Stack.Screen name="AdminQuizzes" component={AdminQuizzesScreen} />
          <Stack.Screen name="AdminBadges" component={AdminBadgesScreen} />
          <Stack.Screen name="AdminProgress" component={AdminProgressScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
