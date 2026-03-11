// src/screens/InstallGuideScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Motion } from "@legendapp/motion";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function InstallGuideScreen({ navigation, onCompleted }) {
  const { theme } = useTheme();
  const [isAndroid, setIsAndroid] = useState(Platform.OS === "android");
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    checkIfShown();
  }, []);

  const checkIfShown = async () => {
    try {
      const shown = await AsyncStorage.getItem("installGuideShown");
      console.log("installGuideShown:", shown);
      if (shown === "true" && onCompleted) {
        onCompleted();
      }
    } catch (error) {
      console.error("Error checking install guide:", error);
    }
  };

  const handleDontShowAgain = async () => {
    try {
      if (dontShowAgain) {
        await AsyncStorage.setItem("installGuideShown", "true");
        console.log("Set installGuideShown = true");
      }
      if (onCompleted) {
        onCompleted();
      }
    } catch (error) {
      console.error("Error in handleDontShowAgain:", error);
    }
  };

  const handleSkip = async () => {
    try {
      console.log("Skip clicked");
      if (onCompleted) {
        onCompleted();
      }
    } catch (error) {
      console.error("Error in handleSkip:", error);
    }
  };

  const openBrowser = () => {
    const url = "https://твой-логин.github.io/brosau-snus/";
    console.log("Opening URL:", url);
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
      Alert.alert("Ошибка", "Не могу открыть браузер");
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.accent,
      padding: 30,
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      alignItems: "center",
      justifyContent: "center",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    // ✅ Улучшенный заголовок с эмодзи
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    titleIcon: {
      fontSize: 32,
      marginRight: 10,
    },
    title: {
      fontSize: 28,
      fontFamily: "Montserrat-Bold",
      color: "white",
    },
    subtitle: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: "rgba(255,255,255,0.9)",
      textAlign: "center",
      paddingHorizontal: 20,
    },
    content: {
      padding: 20,
    },
    stepCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    stepNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    stepNumberText: {
      color: "white",
      fontFamily: "Montserrat-Bold",
      fontSize: 16,
    },
    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    stepTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      color: theme.text,
      flex: 1,
    },
    stepDescription: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
      lineHeight: 20,
      marginLeft: 45,
    },
    instructionBox: {
      backgroundColor: theme.background,
      borderRadius: 15,
      padding: 15,
      marginTop: 10,
      marginLeft: 45,
    },
    instructionText: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.text,
      lineHeight: 22,
    },
    highlight: {
      color: theme.accent,
      fontFamily: "Montserrat-Bold",
    },
    iconRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginVertical: 15,
    },
    iconItem: {
      alignItems: "center",
    },
    iconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.accent + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 5,
    },
    iconLabel: {
      fontSize: 12,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 15,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.accent,
      marginRight: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxChecked: {
      backgroundColor: theme.accent,
    },
    checkboxText: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.text,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    button: {
      flex: 1,
      padding: 15,
      borderRadius: 15,
      alignItems: "center",
      marginHorizontal: 5,
    },
    primaryButton: {
      backgroundColor: theme.accent,
    },
    secondaryButton: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    primaryButtonText: {
      color: "white",
      fontFamily: "Montserrat-Bold",
      fontSize: 16,
    },
    secondaryButtonText: {
      color: theme.text,
      fontFamily: "Montserrat-Bold",
      fontSize: 16,
    },
    note: {
      fontSize: 12,
      fontFamily: "Montserrat-Light",
      color: theme.textSecondary,
      textAlign: "center",
      marginTop: 20,
      fontStyle: "italic",
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Motion.View
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 120 }}
        style={styles.header}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.titleIcon}>📲</Text>
          <Text style={styles.title}>На телефон!</Text>
        </View>
        <Text style={styles.subtitle}>
          Установи приложение на рабочий стол всего за минуту
        </Text>
      </Motion.View>

      <View style={styles.content}>
        {/* Шаг 1 */}
        <Motion.View
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={styles.stepCard}
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Открой в браузере</Text>
          </View>
          <Text style={styles.stepDescription}>
            Нажми на кнопку ниже, чтобы открыть приложение в браузере
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { marginLeft: 45, marginTop: 10 },
            ]}
            onPress={openBrowser}
          >
            <Text style={styles.primaryButtonText}>🌐 Открыть в браузере</Text>
          </TouchableOpacity>
        </Motion.View>

        {/* Шаг 2 - для Android */}
        {isAndroid && (
          <Motion.View
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={styles.stepCard}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Установи на Android</Text>
            </View>
            <Text style={styles.stepDescription}>
              Когда откроется приложение в браузере Chrome:
            </Text>

            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                1. Нажми на <Text style={styles.highlight}>три точки</Text> в
                правом верхнем углу{"\n"}
                2. Выбери{" "}
                <Text style={styles.highlight}>"Установить приложение"</Text>
                {"\n"}
                3. Подтверди установку
              </Text>

              <View style={styles.iconRow}>
                <View style={styles.iconItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="menu" size={24} color={theme.accent} />
                  </View>
                  <Text style={styles.iconLabel}>Меню</Text>
                </View>
                <View style={styles.iconItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="download-outline"
                      size={24}
                      color={theme.accent}
                    />
                  </View>
                  <Text style={styles.iconLabel}>Установить</Text>
                </View>
                <View style={styles.iconItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="checkmark" size={24} color={theme.accent} />
                  </View>
                  <Text style={styles.iconLabel}>Готово</Text>
                </View>
              </View>
            </View>
          </Motion.View>
        )}

        {/* Шаг 2 - для iPhone */}
        {!isAndroid && (
          <Motion.View
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={styles.stepCard}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Установи на iPhone</Text>
            </View>
            <Text style={styles.stepDescription}>
              Когда откроется приложение в Safari:
            </Text>

            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                1. Нажми на{" "}
                <Text style={styles.highlight}>кнопку "Поделиться"</Text>{" "}
                (квадратик со стрелкой){"\n"}
                2. Пролистай вниз и выбери{" "}
                <Text style={styles.highlight}>"На экран «Домой»"</Text>
                {"\n"}
                3. Нажми <Text style={styles.highlight}>"Добавить"</Text>
              </Text>

              <View style={styles.iconRow}>
                <View style={styles.iconItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="share-outline"
                      size={24}
                      color={theme.accent}
                    />
                  </View>
                  <Text style={styles.iconLabel}>Поделиться</Text>
                </View>
                <View style={styles.iconItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="home-outline"
                      size={24}
                      color={theme.accent}
                    />
                  </View>
                  <Text style={styles.iconLabel}>На экран домой</Text>
                </View>
                <View style={styles.iconItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="add" size={24} color={theme.accent} />
                  </View>
                  <Text style={styles.iconLabel}>Добавить</Text>
                </View>
              </View>
            </View>
          </Motion.View>
        )}

        {/* Чекбокс "Больше не показывать" */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setDontShowAgain(!dontShowAgain)}
        >
          <View
            style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}
          >
            {dontShowAgain && (
              <Ionicons name="checkmark" size={18} color="white" />
            )}
          </View>
          <Text style={styles.checkboxText}>
            Больше не показывать эту подсказку
          </Text>
        </TouchableOpacity>

        {/* Кнопки */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkip}
          >
            <Text style={styles.secondaryButtonText}>Пропустить</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleDontShowAgain}
          >
            <Text style={styles.primaryButtonText}>Продолжить</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          После установки приложение будет открываться как обычное, без браузера
        </Text>
      </View>
    </ScrollView>
  );
}
