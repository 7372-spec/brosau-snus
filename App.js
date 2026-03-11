// App.js
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { CardStyleInterpolators } from "@react-navigation/stack";
import { View, Platform, Text, TouchableOpacity } from "react-native";

// Импорты экранов
import HomeScreen from "./src/screens/HomeScreen";
import DiaryScreen from "./src/screens/DiaryScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import InstallGuideScreen from "./src/screens/InstallGuideScreen";

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Кастомный заголовок
function CustomHeader({ title, theme, navigation, route, showBack = false }) {
  const canGoBack = navigation.canGoBack();

  return (
    <View
      style={{
        backgroundColor: theme.card,
        paddingTop: Platform.OS === "ios" ? 70 : 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ width: canGoBack || showBack ? 30 : 30 }}>
        {(canGoBack || showBack) && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={{
          fontSize: 20,
          fontFamily: "Montserrat-Bold",
          color: theme.text,
          textAlign: "center",
          flex: 1,
        }}
      >
        {title}
      </Text>

      <View style={{ width: 30 }} />
    </View>
  );
}

// Главное приложение с тремя табами
function MainApp() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Главная") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Дневник") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Прогресс") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 25 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontFamily: "Montserrat-Regular",
          fontSize: 12,
          marginBottom: Platform.OS === "ios" ? 5 : 0,
        },
        header: ({ navigation, route }) => (
          <CustomHeader
            title={
              route.name === "Главная"
                ? "Главная"
                : route.name === "Дневник"
                  ? "Дневник"
                  : "Прогресс"
            }
            theme={theme}
            navigation={navigation}
            route={route}
          />
        ),
        headerShown: true,
      })}
    >
      <Tab.Screen name="Главная" component={HomeScreen} />
      <Tab.Screen name="Дневник" component={DiaryScreen} />
      <Tab.Screen name="Прогресс" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

// Корневое приложение
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [installGuideShown, setInstallGuideShown] = useState(false);

  const [fontsLoaded] = useFonts({
    "Montserrat-Bold": require("./assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-Regular": require("./assets/fonts/Montserrat-Regular.ttf"),
    "Montserrat-Light": require("./assets/fonts/Montserrat-Light.ttf"),
  });

  useEffect(() => {
    checkOnboarding();
    checkInstallGuide();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem("onboardingCompleted");
      setOnboardingCompleted(completed === "true");
    } catch (error) {
      console.error("Ошибка проверки:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkInstallGuide = async () => {
    try {
      const shown = await AsyncStorage.getItem("installGuideShown");
      setInstallGuideShown(shown === "true");
    } catch (error) {
      console.error("Ошибка проверки инструкции:", error);
    }
  };

  const handleInstallGuideComplete = () => {
    setInstallGuideShown(true);
  };

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
    // ✅ Убрал Alert с предложением создать аккаунт
  };

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
              transitionSpec: {
                open: {
                  animation: "spring",
                  config: { damping: 15, stiffness: 120 },
                },
                close: {
                  animation: "spring",
                  config: { damping: 15, stiffness: 120 },
                },
              },
            }}
          >
            {!installGuideShown ? (
              <Stack.Screen name="InstallGuide">
                {(props) => (
                  <InstallGuideScreen
                    {...props}
                    onCompleted={handleInstallGuideComplete}
                  />
                )}
              </Stack.Screen>
            ) : !onboardingCompleted ? (
              <Stack.Screen name="Onboarding">
                {(props) => (
                  <OnboardingScreen
                    {...props}
                    onCompleted={handleOnboardingComplete}
                  />
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="Main" component={MainApp} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
