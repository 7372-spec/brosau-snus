// src/screens/DiaryScreen.js
import React, { useState, useEffect, useRef } from "react"; // ⬅️ ДОБАВИЛ useRef
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView, // ⬅️ ДОБАВИЛ
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { Motion } from "@legendapp/motion";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused } from "@react-navigation/native";

export default function DiaryScreen() {
  const { theme } = useTheme();
  const [animationKey, setAnimationKey] = useState(0);
  const isFocused = useIsFocused();
  const [cravingLevel, setCravingLevel] = useState(0);
  const [cravingNote, setCravingNote] = useState("");
  const [cravingHistory, setCravingHistory] = useState([]);
  const scrollViewRef = useRef(); // ⬅️ ДОБАВИЛ для скролла

  useEffect(() => {
    if (isFocused) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isFocused]);

  useEffect(() => {
    loadCravingHistory();
  }, []);

  const loadCravingHistory = async () => {
    try {
      const history = await AsyncStorage.getItem("cravingHistory");
      if (history) {
        setCravingHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Ошибка загрузки истории:", error);
    }
  };

  const getCravingTip = () => {
    const tips = [
      "Сделай 10 глубоких вдохов",
      "Выпей стакан холодной воды",
      "Выйди на короткую прогулку",
      "Пожуй жвачку",
      "Сделай 20 приседаний",
      "Позвони другу",
      "Напиши свои мысли",
      "Послушай музыку",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const saveCravingRecord = async () => {
    if (cravingLevel === 0) {
      Alert.alert("Оцени тягу", "Пожалуйста, укажи уровень тяги");
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateString = now.toLocaleDateString("ru-RU");

    const newRecord = {
      id: Date.now().toString(),
      level: cravingLevel,
      note: cravingNote,
      date: dateString,
      time: timeString,
      fullDate: now.toISOString(),
      conquered: false,
    };

    const updatedHistory = [newRecord, ...cravingHistory];
    setCravingHistory(updatedHistory);

    await AsyncStorage.setItem(
      "cravingHistory",
      JSON.stringify(updatedHistory),
    );

    setCravingLevel(0);
    setCravingNote("");
    Alert.alert("Молодец!", "Запись добавлена в дневник!");
  };

  const deleteRecord = async (id) => {
    Alert.alert("Удалить запись", "Ты уверен?", [
      { text: "Нет", style: "cancel" },
      {
        text: "Да",
        onPress: async () => {
          const updatedHistory = cravingHistory.filter(
            (item) => item.id !== id,
          );
          setCravingHistory(updatedHistory);
          await AsyncStorage.setItem(
            "cravingHistory",
            JSON.stringify(updatedHistory),
          );
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: "#e67e22",
      padding: 20,
      paddingTop: Platform.OS === "ios" ? 50 : 30,
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
      fontSize: 28,
      fontFamily: "Montserrat-Bold",
      color: "white",
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    tipCard: {
      backgroundColor: theme.warning,
      margin: 15,
      padding: 20,
      borderRadius: 20,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tipTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      color: "white",
      marginBottom: 10,
    },
    tipText: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: "white",
    },
    cravingCard: {
      backgroundColor: theme.card,
      margin: 15,
      marginTop: 0,
      padding: 20,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    cravingTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      marginBottom: 15,
      color: theme.text,
    },
    levelButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: 15,
    },
    levelButton: {
      width: 45,
      height: 45,
      borderRadius: 23,
      borderWidth: 2,
      borderColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
      margin: 5,
      backgroundColor: theme.background,
    },
    levelButtonActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    levelButtonText: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      color: theme.textSecondary,
    },
    noteInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 15,
      padding: 15,
      marginBottom: 20,
      color: theme.text,
      backgroundColor: theme.background,
      fontFamily: "Montserrat-Regular",
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: "top",
    },
    saveButton: {
      borderRadius: 15,
      overflow: "hidden",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    gradientButton: {
      padding: 18,
      alignItems: "center",
    },
    saveButtonText: {
      color: "white",
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
    },
    historyCard: {
      backgroundColor: theme.card,
      margin: 15,
      marginTop: 0,
      padding: 20,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    historyTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      marginBottom: 15,
      color: theme.text,
    },
    historyItem: {
      backgroundColor: theme.background,
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    historyItemContent: {
      flex: 1,
    },
    historyItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
    },
    historyDateTime: {
      flexDirection: "row",
      alignItems: "center",
    },
    historyDate: {
      fontSize: 12,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
      marginRight: 8,
    },
    historyTime: {
      fontSize: 12,
      fontFamily: "Montserrat-Regular",
      color: theme.accent,
      fontWeight: "bold",
    },
    historyLevel: {
      fontSize: 14,
      fontFamily: "Montserrat-Bold",
      color: theme.accent,
    },
    historyNote: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.text,
      marginTop: 5,
    },
    deleteButton: {
      padding: 8,
    },
    bottomSpace: {
      height: 20, // Дополнительное пространство внизу
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Motion.View
          key={`header-${animationKey}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 120 }}
          style={styles.header}
        >
          <Text style={styles.title}>📔 Дневник</Text>
        </Motion.View>

        <Motion.View
          key={`tip-${animationKey}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          style={styles.tipCard}
        >
          <Text style={styles.tipTitle}>💡 Совет дня:</Text>
          <Text style={styles.tipText}>{getCravingTip()}</Text>
        </Motion.View>

        <Motion.View
          key={`craving-${animationKey}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={styles.cravingCard}
        >
          <Text style={styles.cravingTitle}>Записать тягу (1-10):</Text>

          <View style={styles.levelButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <Motion.View
                key={level}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring" }}
              >
                <TouchableOpacity
                  style={[
                    styles.levelButton,
                    cravingLevel === level && styles.levelButtonActive,
                  ]}
                  onPress={() => setCravingLevel(level)}
                >
                  <Text
                    style={[
                      styles.levelButtonText,
                      cravingLevel === level && { color: "white" },
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              </Motion.View>
            ))}
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Что вызвало тягу? Опиши свои ощущения..."
            placeholderTextColor={theme.textSecondary}
            value={cravingNote}
            onChangeText={setCravingNote}
            multiline
            textAlignVertical="top"
            onFocus={() => {
              // Скроллим к полю ввода, когда оно получает фокус
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveCravingRecord}
          >
            <LinearGradient
              colors={[theme.accent, theme.accentSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.saveButtonText}>Записать в дневник 📝</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Motion.View>

        {cravingHistory.length > 0 && (
          <Motion.View
            key={`history-${animationKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={styles.historyCard}
          >
            <Text style={styles.historyTitle}>📋 История записей</Text>
            {cravingHistory.slice(0, 10).map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <View style={styles.historyItemContent}>
                  <View style={styles.historyItemHeader}>
                    <View style={styles.historyDateTime}>
                      <Text style={styles.historyDate}>{record.date}</Text>
                      <Text style={styles.historyTime}>{record.time}</Text>
                    </View>
                    <Text style={styles.historyLevel}>
                      Уровень: {record.level}/10
                    </Text>
                  </View>
                  {record.note ? (
                    <Text style={styles.historyNote}>{record.note}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteRecord(record.id)}
                >
                  <Ionicons name="close" size={20} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </Motion.View>
        )}

        {/* Дополнительное пространство внизу для удобства скролла */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
