// src/screens/OnboardingScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Motion } from "@legendapp/motion";
import { Ionicons } from "@expo/vector-icons";

export default function OnboardingScreen({ navigation, onCompleted }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    packetsPerDay: null,
    canPrice: null,
    cansPerMonth: null,
    yearsUsing: null,
    triedBefore: null,
    quitStyle: null,
    reasons: [],
  });

  const [tempCanPrice, setTempCanPrice] = useState("");
  const [tempCansPerMonth, setTempCansPerMonth] = useState("");

  const questions = [
    {
      id: "packetsPerDay",
      question: "Сколько пакетиков снюса ты используешь в день?",
      options: ["1-3", "4-6", "7-10", "11-15", "Больше 15"],
      multiSelect: false,
    },
    {
      id: "canPrice",
      question: "Сколько стоит одна шайба (в рублях)?",
      isNumberInput: true,
      placeholder: "Например: 500",
    },
    {
      id: "cansPerMonth",
      question: "Сколько шайб ты покупаешь в месяц?",
      isNumberInput: true,
      placeholder: "Например: 4",
    },
    {
      id: "yearsUsing",
      question: "Как давно ты кидаешь снюс?",
      options: [
        "Меньше месяца",
        "1-6 месяцев",
        "6-12 месяцев",
        "Больше года",
        "Более 3 лет",
      ],
      multiSelect: false,
    },
    {
      id: "triedBefore",
      question: "Пытался ли ты уже бросить раньше?",
      options: ["Нет, первый раз", "Да, но сорвался", "Да, несколько раз"],
      multiSelect: false,
    },
    {
      id: "quitStyle",
      question: "Как хочешь бросить?",
      options: ["Резко - сразу перестать", "Постепенно - снижать количество"],
      multiSelect: false,
    },
    {
      id: "reasons",
      question: "Какие главные причины бросить? (можно выбрать несколько)",
      options: [
        "Здоровье",
        "Деньги",
        "Семья/отношения",
        "Спорт",
        "Надоело",
        "Самочувствие",
        "Внешность",
        "Будущее",
      ],
      multiSelect: true,
    },
  ];

  const saveAnswer = (questionId, answer) => {
    const currentQuestion = questions[step - 1];

    if (currentQuestion.multiSelect) {
      const currentReasons = answers.reasons || [];
      let newReasons;

      if (currentReasons.includes(answer)) {
        newReasons = currentReasons.filter((r) => r !== answer);
      } else {
        newReasons = [...currentReasons, answer];
      }

      setAnswers({ ...answers, [questionId]: newReasons });
    } else {
      const newAnswers = { ...answers, [questionId]: answer };
      setAnswers(newAnswers);

      if (step < questions.length) {
        setStep(step + 1);
      } else {
        finishOnboarding(newAnswers);
      }
    }
  };

  const saveNumberInput = (questionId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue <= 0) {
      Alert.alert("Ошибка", "Пожалуйста, введи положительное число");
      return;
    }

    const newAnswers = { ...answers, [questionId]: numValue };
    setAnswers(newAnswers);

    if (step < questions.length) {
      setStep(step + 1);
    } else {
      finishOnboarding(newAnswers);
    }
  };

  const goToNextStep = () => {
    const currentQuestion = questions[step - 1];

    if (
      currentQuestion.multiSelect &&
      (!answers.reasons || answers.reasons.length === 0)
    ) {
      Alert.alert("Выбери причину", "Пожалуйста, выбери хотя бы одну причину");
      return;
    }

    if (step < questions.length) {
      setStep(step + 1);
    } else {
      finishOnboarding(answers);
    }
  };

  const finishOnboarding = async (finalAnswers) => {
    try {
      await AsyncStorage.setItem("userAnswers", JSON.stringify(finalAnswers));

      const strategy =
        finalAnswers.quitStyle === "Резко - сразу перестать"
          ? "coldTurkey"
          : "gradual";

      await AsyncStorage.setItem("quitStrategy", strategy);
      await AsyncStorage.setItem("onboardingCompleted", "true");

      if (onCompleted) {
        onCompleted();
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить ответы");
    }
  };

  const skipOnboarding = async () => {
    const defaultAnswers = {
      packetsPerDay: "1-3",
      canPrice: 500,
      cansPerMonth: 4,
      yearsUsing: "Меньше месяца",
      triedBefore: "Нет, первый раз",
      quitStyle: "Резко - сразу перестать",
      reasons: [],
    };

    await AsyncStorage.setItem("userAnswers", JSON.stringify(defaultAnswers));
    await AsyncStorage.setItem("quitStrategy", "coldTurkey");
    await AsyncStorage.setItem("onboardingCompleted", "true");

    if (onCompleted) {
      onCompleted();
    }
  };

  const currentQuestion = questions[step - 1];
  const isLastStep = step === questions.length;
  const canGoNext =
    !currentQuestion.multiSelect ||
    (answers.reasons && answers.reasons.length > 0);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.header,
      paddingTop: Platform.OS === "ios" ? insets.top + 20 : 40,
      paddingBottom: 30,
      paddingHorizontal: 20,
      alignItems: "center",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    title: {
      fontSize: 32,
      fontFamily: "Montserrat-Bold",
      color: theme.headerText,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: theme.headerText + "CC",
      textAlign: "center",
    },
    progressContainer: {
      padding: 20,
      backgroundColor: theme.card,
      marginBottom: 10,
    },
    progressBar: {
      height: 10,
      backgroundColor: theme.border,
      borderRadius: 5,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.accent,
    },
    progressText: {
      textAlign: "center",
      marginTop: 10,
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
    },
    questionCard: {
      backgroundColor: theme.card,
      margin: 15,
      padding: 25,
      borderRadius: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    questionText: {
      fontSize: 22,
      fontFamily: "Montserrat-Bold",
      color: theme.text,
      marginBottom: 25,
      textAlign: "center",
      lineHeight: 30,
    },
    optionsContainer: {
      gap: 12,
    },
    optionButton: {
      backgroundColor: theme.background,
      padding: 18,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    optionButtonSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.accent + "10",
    },
    optionText: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: theme.text,
      flex: 1,
    },
    optionTextSelected: {
      color: theme.accent,
      fontFamily: "Montserrat-Bold",
    },
    checkIcon: {
      marginLeft: 10,
    },
    numberInput: {
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 15,
      padding: 18,
      fontSize: 18,
      fontFamily: "Montserrat-Regular",
      color: theme.text,
      backgroundColor: theme.background,
      marginBottom: 20,
      textAlign: "center",
    },
    nextButton: {
      margin: 15,
      marginTop: 0,
      borderRadius: 30,
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      opacity: canGoNext ? 1 : 0.5,
    },
    nextButtonGradient: {
      padding: 18,
      alignItems: "center",
    },
    nextButtonText: {
      color: "white",
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
    },
    skipButton: {
      margin: 15,
      padding: 15,
      alignItems: "center",
    },
    skipButtonText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
    },
    selectedCount: {
      textAlign: "center",
      marginTop: 10,
      color: theme.accent,
      fontSize: 14,
      fontFamily: "Montserrat-Bold",
    },
    inputNote: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: "Montserrat-Regular",
      textAlign: "center",
      marginTop: 10,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Небольшой тест</Text>
        <Text style={styles.subtitle}>
          Чтобы подобрать лучший способ для тебя
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Вопрос {step} из {questions.length}
        </Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.isNumberInput ? (
          <>
            <TextInput
              style={styles.numberInput}
              placeholder={currentQuestion.placeholder}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={
                currentQuestion.id === "canPrice"
                  ? tempCanPrice
                  : tempCansPerMonth
              }
              onChangeText={(text) => {
                if (currentQuestion.id === "canPrice") {
                  setTempCanPrice(text);
                } else {
                  setTempCansPerMonth(text);
                }
              }}
            />
            <TouchableOpacity
              style={[styles.nextButton, { opacity: 1, marginHorizontal: 0 }]}
              onPress={() => {
                const value =
                  currentQuestion.id === "canPrice"
                    ? tempCanPrice
                    : tempCansPerMonth;
                saveNumberInput(currentQuestion.id, value);
              }}
            >
              <LinearGradient
                colors={[theme.accent, theme.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>Далее →</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.inputNote}>
              Это поможет точно рассчитать сэкономленные деньги
            </Text>
          </>
        ) : (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = currentQuestion.multiSelect
                ? answers.reasons?.includes(option)
                : answers[currentQuestion.id] === option;

              return (
                <Motion.View
                  key={index}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring" }}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    onPress={() => saveAnswer(currentQuestion.id, option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.accent}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                </Motion.View>
              );
            })}
          </View>
        )}

        {currentQuestion.multiSelect && answers.reasons && (
          <Text style={styles.selectedCount}>
            Выбрано: {answers.reasons.length}
          </Text>
        )}
      </View>

      {isLastStep && !currentQuestion.isNumberInput && (
        <TouchableOpacity
          style={[styles.nextButton, !canGoNext && { opacity: 0.5 }]}
          onPress={goToNextStep}
          disabled={!canGoNext}
        >
          <LinearGradient
            colors={[theme.accent, theme.accentSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {canGoNext ? "Завершить ✓" : "Выбери причину"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipButtonText}>Пропустить тест →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
