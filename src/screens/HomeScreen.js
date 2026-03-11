// src/screens/HomeScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "../utils/notifications";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../context/ThemeContext";
import { Motion } from "@legendapp/motion";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

export default function HomeScreen() {
  const [quitDate, setQuitDate] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [animationKey, setAnimationKey] = useState(0);
  const isFocused = useIsFocused();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [canPrice, setCanPrice] = useState(0);
  const [cansPerMonth, setCansPerMonth] = useState(0);
  const [packetsPerDay, setPacketsPerDay] = useState("1-3");
  const [exactMoneySaved, setExactMoneySaved] = useState(0);
  const [expectedQuitDate, setExpectedQuitDate] = useState(null);
  const [reductionPlan, setReductionPlan] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [todaysLimit, setTodaysLimit] = useState(0);
  const [strategy, setStrategy] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [customLimit, setCustomLimit] = useState("5");
  const [todayPacks, setTodayPacks] = useState(0);
  const [userAnswers, setUserAnswers] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState({ hour: 20, minute: 0 });
  const [tempLimit, setTempLimit] = useState("5");
  const [packHistory, setPackHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setAnimationKey((prev) => prev + 1);
      loadPackHistory();
    }
  }, [isFocused]);

  useEffect(() => {
    if (notificationsEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [notificationsEnabled]);

  const calculateExactSavings = () => {
    if (!quitDate || !canPrice || !cansPerMonth) return 0;
    const daysPassed = Math.floor(
      (new Date() - quitDate) / (1000 * 60 * 60 * 24),
    );
    const monthsPassed = daysPassed / 30;
    return (monthsPassed * cansPerMonth * canPrice).toFixed(2);
  };

  const getPacketCount = (packetsStr) => {
    if (packetsStr === "1-3") return 3;
    if (packetsStr === "4-6") return 6;
    if (packetsStr === "7-10") return 10;
    if (packetsStr === "11-15") return 15;
    if (packetsStr === "Больше 15") return 20;
    return 3;
  };

  const createReductionPlan = (packetsStr) => {
    const plan = [];
    let current = getPacketCount(packetsStr);
    let weeks = 0;

    while (current > 0) {
      weeks++;
      const reduction = Math.max(1, Math.floor(current * 0.15));
      current = Math.max(0, current - reduction);
      const date = new Date();
      date.setDate(date.getDate() + weeks * 7);
      plan.push({
        week: weeks,
        packetsPerDay: current,
        date: date.toLocaleDateString("ru-RU"),
        limit: current,
      });
      if (current === 0) setExpectedQuitDate(date);
    }
    return plan;
  };

  const getCurrentWeek = () => {
    if (!quitDate || !reductionPlan.length) return 0;
    const daysPassed = Math.floor(
      (new Date() - quitDate) / (1000 * 60 * 60 * 24),
    );
    const weeksPassed = Math.floor(daysPassed / 7);
    return Math.min(weeksPassed, reductionPlan.length - 1);
  };

  const getCurrentWeekLimit = () => {
    const week = getCurrentWeek();
    return reductionPlan[week]?.packetsPerDay || dailyLimit;
  };

  const loadNotificationSettings = async () => {
    const enabled = await Notifications.areNotificationsEnabled();
    setNotificationsEnabled(enabled);
    const time = await Notifications.getReminderTime();
    if (time) setReminderTime(time);
  };

  const toggleNotifications = async (enabled) => {
    if (enabled) {
      const granted = await Notifications.requestNotificationPermissions();
      if (granted) {
        await Notifications.scheduleDailyReminder(
          reminderTime.hour,
          reminderTime.minute,
        );
        setNotificationsEnabled(true);
        Alert.alert(
          "✅ Уведомления включены",
          "Мы будем напоминать тебе каждый день",
        );
      } else {
        Alert.alert(
          "❌ Нет разрешения",
          "Разреши уведомления в настройках телефона",
        );
      }
    } else {
      await Notifications.cancelAllReminders();
      setNotificationsEnabled(false);
      Alert.alert("🔕 Уведомления отключены");
    }
  };

  const changeReminderTime = async (hour, minute) => {
    setReminderTime({ hour, minute });
    if (notificationsEnabled)
      await Notifications.scheduleDailyReminder(hour, minute);
  };

  const loadDailyLimit = async () => {
    try {
      const savedLimit = await AsyncStorage.getItem("dailyLimit");
      if (savedLimit) {
        setDailyLimit(parseInt(savedLimit));
        setCustomLimit(savedLimit);
      }
    } catch (error) {
      console.error("Ошибка загрузки лимита:", error);
    }
  };

  const saveDailyLimit = async () => {
    const newLimit = parseInt(tempLimit);
    if (isNaN(newLimit) || newLimit <= 0) {
      Alert.alert("Ошибка", "Введи положительное число");
      return;
    }
    setDailyLimit(newLimit);
    setCustomLimit(tempLimit);
    await AsyncStorage.setItem("dailyLimit", newLimit.toString());
    setSettingsVisible(false);
    Alert.alert("✅ Готово", `Лимит установлен: ${newLimit} пакетиков в день`);
  };

  const loadUserStrategy = async () => {
    try {
      const savedStrategy = await AsyncStorage.getItem("quitStrategy");
      setStrategy(savedStrategy);
      const savedAnswers = await AsyncStorage.getItem("userAnswers");
      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers);
        if (answers && typeof answers === "object") {
          setUserAnswers(answers);
          setCanPrice(answers.canPrice || 500);
          setCansPerMonth(answers.cansPerMonth || 4);
          setPacketsPerDay(answers.packetsPerDay || "1-3");
          if (answers.quitStyle === "Постепенно - снижать количество") {
            const plan = createReductionPlan(answers.packetsPerDay);
            setReductionPlan(plan);
            setDailyLimit(getPacketCount(answers.packetsPerDay));
          }
        } else {
          setUserAnswers(null);
        }
      } else {
        setUserAnswers(null);
        setCanPrice(500);
        setCansPerMonth(4);
        setPacketsPerDay("1-3");
      }
      const today = new Date().toDateString();
      const savedToday = await AsyncStorage.getItem(`packs_${today}`);
      setTodayPacks(savedToday ? parseInt(savedToday) : 0);
    } catch (error) {
      console.error("Ошибка загрузки стратегии:", error);
      setUserAnswers(null);
    }
  };

  const loadPackHistory = async () => {
    try {
      const history = await AsyncStorage.getItem("packHistory");
      if (history) {
        setPackHistory(JSON.parse(history));
      } else {
        setPackHistory([]);
      }
    } catch (error) {
      console.error("Ошибка загрузки истории:", error);
    }
  };

  const savePackToHistory = async (count) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateString = now.toLocaleDateString("ru-RU");

    const newEntry = {
      id: Date.now().toString(),
      count: count,
      time: timeString,
      date: dateString,
      fullDate: now.toISOString(),
    };

    const updatedHistory = [newEntry, ...packHistory].slice(0, 20);
    setPackHistory(updatedHistory);
    await AsyncStorage.setItem("packHistory", JSON.stringify(updatedHistory));
  };

  const loadQuitDate = async () => {
    try {
      const savedDate = await AsyncStorage.getItem("quitDate");
      if (savedDate) setQuitDate(new Date(savedDate));
    } catch (error) {
      console.error("Ошибка загрузки даты:", error);
    }
  };

  const startQuit = () => {
    Alert.alert(
      "Начать путь к свободе?",
      strategy === "coldTurkey"
        ? "Ты готов полностью отказаться от снюса?"
        : "Ты готов начать снижать количество?",
      [
        { text: "Нет", style: "cancel" },
        {
          text: "ДА!",
          onPress: async () => {
            const now = new Date();
            setQuitDate(now);
            await AsyncStorage.setItem("quitDate", now.toISOString());
            if (strategy === "gradual") {
              const today = new Date().toDateString();
              setTodayPacks(0);
              await AsyncStorage.setItem(`packs_${today}`, "0");
              const initialLimit = getPacketCount(packetsPerDay);
              setDailyLimit(initialLimit);
              await AsyncStorage.setItem("dailyLimit", initialLimit.toString());
            }
          },
        },
      ],
    );
  };

  const updateTime = () => {
    if (!quitDate) return;
    const now = new Date();
    const diff = now - quitDate;
    setTimeElapsed({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    });
  };

  const addPack = async () => {
    const currentLimit = getCurrentWeekLimit();
    if (todayPacks < currentLimit) {
      const newCount = todayPacks + 1;
      setTodayPacks(newCount);
      const today = new Date().toDateString();
      await AsyncStorage.setItem(`packs_${today}`, newCount.toString());
      await savePackToHistory(newCount);

      if (newCount === currentLimit) {
        Alert.alert(
          "🎉 Лимит на сегодня!",
          "Ты использовал все разрешенные пакетики. Завтра будет меньше!",
        );
      } else {
        const remaining = currentLimit - newCount;
        Alert.alert(
          "✅ Отмечено",
          `Осталось ${remaining} пакетиков на сегодня`,
        );
      }
    } else {
      Alert.alert(
        "❌ Лимит исчерпан",
        "Сегодня ты уже использовал все пакетики. Завтра новый день!",
      );
    }
  };

  const resetDailyPacks = async () => {
    Alert.alert("Новый день?", "Сбросить счетчик вкидов?", [
      { text: "Нет", style: "cancel" },
      {
        text: "Да",
        onPress: async () => {
          const today = new Date().toDateString();
          setTodayPacks(0);
          await AsyncStorage.setItem(`packs_${today}`, "0");
        },
      },
    ]);
  };

  const resetAllData = async () => {
    Alert.alert(
      "⚠️ Сброс всех данных",
      "Точно хочешь удалить всю историю и начать заново?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сбросить всё",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setQuitDate(null);
              setTodayPacks(0);
              setDailyLimit(0);
              setStrategy(null);
              setUserAnswers(null);
              setReductionPlan([]);
              setExpectedQuitDate(null);
              setPackHistory([]);
              Alert.alert(
                "✅ Готово",
                "Все данные сброшены. Перезапусти приложение.",
              );
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось сбросить данные");
            }
          },
        },
      ],
    );
  };

  const getMotivationByReason = (reasons) => {
    if (!reasons || reasons.length === 0) return "🌟 Ты большой молодец!";
    const motivations = {
      Здоровье: "❤️ Каждый день без снюса твое сердце работает лучше!",
      Деньги: `💰 Ты уже сэкономил ${exactMoneySaved} ₽!`,
      "Семья/отношения": "👨‍👩‍👧 Твои близкие гордятся тобой!",
      Спорт: "🏃 Скоро заметишь, что дышать стало легче!",
      Надоело: "💪 Ты сильнее своей привычки!",
      Самочувствие: "✨ Твое самочувствие улучшается с каждым днем!",
      Внешность: "🌟 Кожа и зубы скажут тебе спасибо!",
      Будущее: "🌈 Ты инвестируешь в свое будущее!",
    };
    if (reasons.length === 1)
      return motivations[reasons[0]] || "🌟 Ты большой молодец!";
    return "🌟 Ты сильнее своих привычек! Каждая из твоих причин важна!";
  };

  const checkLimitWarning = (limit) => {
    const packetCount = getPacketCount(packetsPerDay);
    const maxReasonable = packetCount * 1.5;
    if (limit > packetCount * 2) {
      return {
        type: "danger",
        message:
          "⚠️ Очень высокий лимит! Ты тратишь в 2 раза больше обычного. Подумай о здоровье!",
      };
    } else if (limit > maxReasonable) {
      return {
        type: "warning",
        message: "⚠️ Лимит выше среднего. Постарайся снижать постепенно!",
      };
    }
    return null;
  };

  useEffect(() => {
    loadUserStrategy();
    loadQuitDate();
    loadDailyLimit();
    loadNotificationSettings();
    loadPackHistory();
  }, []);

  useEffect(() => {
    if (quitDate && strategy === "coldTurkey") {
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }
  }, [quitDate, strategy]);

  useEffect(() => {
    if (quitDate) setExactMoneySaved(calculateExactSavings());
  }, [quitDate, canPrice, cansPerMonth]);

  useEffect(() => {
    if (quitDate && reductionPlan.length > 0) {
      setCurrentWeek(getCurrentWeek());
    }
  }, [quitDate, reductionPlan, timeElapsed.days]);

  useEffect(() => {
    if (strategy === "gradual" && reductionPlan.length > 0) {
      const week = getCurrentWeek();
      if (reductionPlan[week]) {
        setDailyLimit(reductionPlan[week].packetsPerDay);
        setTodaysLimit(reductionPlan[week].packetsPerDay);
      }
    }
  }, [currentWeek, strategy, reductionPlan]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      backgroundColor: theme.header,
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
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    title: {
      fontSize: 28,
      fontFamily: "Montserrat-Bold",
      color: theme.headerText,
      flex: 1,
      textAlign: "center",
    },
    settingsButton: { padding: 10, position: "absolute", right: 0 },
    strategyRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 25,
    },
    strategyText: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.headerText,
      marginLeft: 8,
    },
    startContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
      minHeight: 300,
    },
    startText: {
      fontSize: 20,
      fontFamily: "Montserrat-Regular",
      marginBottom: 30,
      textAlign: "center",
      color: theme.text,
    },
    gradientButton: {
      paddingHorizontal: 50,
      paddingVertical: 18,
      borderRadius: 40,
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    startButtonText: {
      color: "white",
      fontSize: 22,
      fontFamily: "Montserrat-Bold",
    },
    waitingCard: {
      backgroundColor: theme.card,
      padding: 30,
      borderRadius: 15,
      alignItems: "center",
    },
    waitingText: {
      fontSize: 18,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
    },
    counterCard: {
      backgroundColor: theme.card,
      margin: 15,
      padding: 20,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    limitHeader: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    counterTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      color: theme.text,
    },
    timeContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 15,
    },
    timeBlock: {
      alignItems: "center",
      backgroundColor: theme.background,
      padding: 10,
      borderRadius: 15,
      minWidth: 70,
    },
    timeNumber: {
      fontSize: 28,
      fontFamily: "Montserrat-Bold",
      color: theme.accent,
    },
    timeLabel: {
      fontSize: 12,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
      marginTop: 5,
    },
    exactMoneyText: {
      fontSize: 24,
      fontFamily: "Montserrat-Bold",
      textAlign: "center",
      color: theme.warning,
      marginVertical: 10,
    },
    packsCounter: {
      fontSize: 48,
      fontFamily: "Montserrat-Bold",
      color: theme.accent,
      textAlign: "center",
      marginVertical: 15,
    },
    progressBarContainer: {
      height: 20,
      backgroundColor: theme.border,
      borderRadius: 10,
      marginBottom: 20,
      overflow: "hidden",
    },
    progressBar: { height: "100%", backgroundColor: theme.accent },
    addPackButton: {
      backgroundColor: theme.accentSecondary,
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    addPackButtonDisabled: {
      backgroundColor: theme.textSecondary,
      opacity: 0.7,
    },
    addPackButtonText: {
      color: "white",
      fontSize: 16,
      fontFamily: "Montserrat-Bold",
      textAlign: "center",
    },
    resetButton: { padding: 10, marginBottom: 10 },
    resetButtonText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      textAlign: "center",
    },
    tipText: {
      color: theme.accent,
      fontSize: 14,
      fontFamily: "Montserrat-Light",
      textAlign: "center",
      fontStyle: "italic",
      marginTop: 10,
    },
    motivationCard: {
      backgroundColor: theme.card,
      margin: 15,
      marginTop: 0,
      padding: 20,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    motivationTitle: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
      marginBottom: 10,
    },
    reasonChip: {
      backgroundColor: theme.accent + "20",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },
    reasonChipText: {
      color: theme.accent,
      fontFamily: "Montserrat-Bold",
      fontSize: 14,
    },
    reasonsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 10,
    },
    motivationText: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: theme.accent,
      lineHeight: 22,
    },
    daysCount: {
      fontSize: 36,
      fontFamily: "Montserrat-Bold",
      color: theme.accent,
      textAlign: "center",
      marginVertical: 10,
    },
    planCard: {
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
    planTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      color: theme.text,
      marginBottom: 5,
    },
    planSubtitle: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.accentSecondary,
      marginBottom: 15,
    },
    planRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    planWeek: {
      fontSize: 14,
      fontFamily: "Montserrat-Bold",
      color: theme.text,
      width: 70,
    },
    planValue: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.accent,
      flex: 1,
      textAlign: "center",
    },
    planDate: {
      fontSize: 12,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
      width: 80,
      textAlign: "right",
    },
    planMore: {
      textAlign: "center",
      marginTop: 10,
      color: theme.textSecondary,
      fontSize: 16,
    },
    currentWeekBadge: {
      backgroundColor: theme.accent + "20",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginBottom: 10,
    },
    currentWeekText: {
      color: theme.accent,
      fontFamily: "Montserrat-Bold",
      fontSize: 12,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: theme.background,
      padding: 10,
      borderRadius: 15,
      marginHorizontal: 5,
    },
    statValue: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      color: theme.accent,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
      marginTop: 5,
    },
    historyButtonContainer: {
      marginHorizontal: 15,
      marginTop: 15,
      marginBottom: 15,
    },
    historyButton: {
      backgroundColor: theme.accent + "20",
      padding: 12,
      borderRadius: 15,
      alignItems: "center",
    },
    historyButtonText: {
      color: theme.accent,
      fontFamily: "Montserrat-Bold",
      fontSize: 14,
    },
    historyCardContainer: {
      marginHorizontal: 15,
      marginTop: 10,
      marginBottom: 15,
    },
    historyCard: {
      backgroundColor: theme.card,
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
      color: theme.text,
      marginBottom: 15,
    },
    historyItem: {
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    historyItemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    historyItemTime: {
      fontSize: 14,
      fontFamily: "Montserrat-Bold",
      color: theme.accent,
      marginRight: 10,
    },
    historyItemCount: {
      fontSize: 14,
      fontFamily: "Montserrat-Regular",
      color: theme.text,
    },
    historyItemDate: {
      fontSize: 12,
      fontFamily: "Montserrat-Light",
      color: theme.textSecondary,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.modalOverlay,
    },
    modalContent: {
      backgroundColor: theme.card,
      padding: 25,
      borderRadius: 25,
      width: "90%",
      maxHeight: "80%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 24,
      fontFamily: "Montserrat-Bold",
      marginBottom: 20,
      textAlign: "center",
      color: theme.text,
    },
    modalLabel: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      marginBottom: 8,
      color: theme.textSecondary,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 15,
      padding: 12,
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      marginBottom: 20,
      color: theme.text,
      backgroundColor: theme.background,
    },
    modalButton: {
      borderRadius: 15,
      overflow: "hidden",
      marginBottom: 10,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    modalButtonGradient: { padding: 15, alignItems: "center" },
    modalButtonText: {
      color: "white",
      fontSize: 16,
      fontFamily: "Montserrat-Bold",
    },
    modalButtonReset: {
      backgroundColor: theme.danger,
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      alignItems: "center",
      elevation: 3,
    },
    modalButtonResetText: {
      color: "white",
      fontSize: 16,
      fontFamily: "Montserrat-Bold",
    },
    modalCloseIcon: {
      position: "absolute",
      top: 15,
      right: 15,
      zIndex: 1,
      padding: 5,
    },
    modalSectionTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      color: theme.text,
      marginBottom: 15,
    },
    timePickerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    timePicker: { width: "45%", height: 50, color: theme.text },
    notificationIconContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    notificationIcon: { marginRight: 8 },
    achievementsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 10,
    },
    achievementBadge: {
      backgroundColor: theme.accent + "20",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },
    achievementBadgeText: {
      color: theme.accent,
      fontFamily: "Montserrat-Bold",
      fontSize: 12,
    },
  });

  const weekLimit = getCurrentWeekLimit();

  return (
    <ScrollView style={styles.container}>
      <Motion.View
        key={`header-${animationKey}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 120 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>🚫 Бросаю снюс</Text>
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={styles.settingsButton}
          >
            <Ionicons
              name="settings-outline"
              size={28}
              color={theme.headerText}
            />
          </TouchableOpacity>
        </View>
        {userAnswers && (
          <View style={styles.strategyRow}>
            <Ionicons
              name={strategy === "coldTurkey" ? "flame" : "leaf"}
              size={20}
              color={theme.headerText}
            />
            <Text style={styles.strategyText}>
              {strategy === "coldTurkey"
                ? "Резкий отказ"
                : "Постепенное снижение"}
            </Text>
          </View>
        )}
      </Motion.View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Motion.View
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
            style={styles.modalContent}
          >
            <TouchableOpacity
              style={styles.modalCloseIcon}
              onPress={() => setSettingsVisible(false)}
            >
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>⚙️ Настройки</Text>

            <Text style={styles.modalLabel}>Дневной лимит (пакетиков):</Text>
            <TextInput
              style={styles.modalInput}
              value={tempLimit}
              onChangeText={setTempLimit}
              keyboardType="numeric"
              placeholder="Введи число"
              placeholderTextColor={theme.textSecondary}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 15,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: theme.accent + "20",
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
                onPress={() =>
                  setTempLimit(getPacketCount(packetsPerDay).toString())
                }
              >
                <Text
                  style={{ color: theme.accent, fontFamily: "Montserrat-Bold" }}
                >
                  Обычный
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.warning + "20",
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
                onPress={() =>
                  setTempLimit((getPacketCount(packetsPerDay) * 1.5).toString())
                }
              >
                <Text
                  style={{
                    color: theme.warning,
                    fontFamily: "Montserrat-Bold",
                  }}
                >
                  +50%
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveDailyLimit}
            >
              <LinearGradient
                colors={[theme.accent, theme.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Сохранить лимит</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonReset}
              onPress={resetAllData}
            >
              <Text style={styles.modalButtonResetText}>
                🔄 Сбросить все данные
              </Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: theme.border,
                marginVertical: 20,
              }}
            />

            <View style={styles.notificationIconContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons
                  name={
                    notificationsEnabled ? "notifications" : "notifications-off"
                  }
                  size={24}
                  color={
                    notificationsEnabled ? theme.accent : theme.textSecondary
                  }
                />
              </Animated.View>
              <Text style={styles.modalSectionTitle}> Уведомления</Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => toggleNotifications(!notificationsEnabled)}
            >
              <LinearGradient
                colors={
                  notificationsEnabled
                    ? [theme.danger, "#c0392b"]
                    : [theme.accent, "#27ae60"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>
                  {notificationsEnabled
                    ? "🔕 Выключить напоминания"
                    : "🔔 Включить напоминания"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {notificationsEnabled && (
              <Motion.View
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <Text style={styles.modalLabel}>Время напоминания:</Text>
                <View style={styles.timePickerRow}>
                  <Picker
                    selectedValue={reminderTime.hour}
                    style={styles.timePicker}
                    dropdownIconColor={theme.text}
                    onValueChange={(hour) =>
                      changeReminderTime(hour, reminderTime.minute)
                    }
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <Picker.Item key={i} label={`${i}:00`} value={i} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={reminderTime.minute}
                    style={styles.timePicker}
                    dropdownIconColor={theme.text}
                    onValueChange={(minute) =>
                      changeReminderTime(reminderTime.hour, minute)
                    }
                  >
                    <Picker.Item label="00" value={0} />
                    <Picker.Item label="15" value={15} />
                    <Picker.Item label="30" value={30} />
                    <Picker.Item label="45" value={45} />
                  </Picker>
                </View>
              </Motion.View>
            )}

            <View
              style={{
                height: 1,
                backgroundColor: theme.border,
                marginVertical: 20,
              }}
            />

            <Text style={styles.modalSectionTitle}>🎨 Оформление</Text>
            <TouchableOpacity style={styles.modalButton} onPress={toggleTheme}>
              <LinearGradient
                colors={["#9b59b6", "#8e44ad"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>
                  {isDarkMode ? "☀️ Светлая тема" : "🌙 Темная тема"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Motion.View>
        </View>
      </Modal>

      {!quitDate ? (
        <View style={styles.startContainer}>
          {userAnswers ? (
            <>
              <Text style={styles.startText}>
                {strategy === "coldTurkey"
                  ? "Ты готов полностью отказаться?"
                  : "Начнем снижать количество?"}
              </Text>
              <Motion.View
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring" }}
              >
                <TouchableOpacity onPress={startQuit}>
                  <LinearGradient
                    colors={[theme.accent, theme.accentSecondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.startButtonText}>🚀 Начать!</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Motion.View>
            </>
          ) : (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>⏳ Загрузка...</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          {strategy === "coldTurkey" ? (
            <Motion.View
              key={`cold-${animationKey}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
              style={styles.counterCard}
            >
              <Text style={styles.counterTitle}>Время без снюса:</Text>
              <View style={styles.timeContainer}>
                {Object.entries(timeElapsed).map(([unit, value]) => (
                  <View key={unit} style={styles.timeBlock}>
                    <Text style={styles.timeNumber}>{value}</Text>
                    <Text style={styles.timeLabel}>{unit}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.exactMoneyText}>
                💰 Сэкономлено: {exactMoneySaved} ₽
              </Text>
            </Motion.View>
          ) : (
            <Motion.View
              key={`gradual-${animationKey}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
              style={styles.counterCard}
            >
              <View style={styles.limitHeader}>
                <Text style={styles.counterTitle}>Сегодня использовано:</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                  <Ionicons
                    name="pencil"
                    size={24}
                    color={theme.accentSecondary}
                  />
                </TouchableOpacity>
              </View>
              {reductionPlan.length > 0 && (
                <View style={styles.currentWeekBadge}>
                  <Text style={styles.currentWeekText}>
                    Неделя {currentWeek + 1} из {reductionPlan.length}
                  </Text>
                </View>
              )}
              <Text style={styles.packsCounter}>
                {todayPacks} / {weekLimit}
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${(todayPacks / weekLimit) * 100}%` },
                  ]}
                />
              </View>
              {checkLimitWarning(dailyLimit) && (
                <Motion.View
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor:
                      checkLimitWarning(dailyLimit).type === "danger"
                        ? theme.danger + "20"
                        : theme.warning + "20",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 15,
                    borderLeftWidth: 4,
                    borderLeftColor:
                      checkLimitWarning(dailyLimit).type === "danger"
                        ? theme.danger
                        : theme.warning,
                  }}
                >
                  <Text
                    style={{
                      color:
                        checkLimitWarning(dailyLimit).type === "danger"
                          ? theme.danger
                          : theme.warning,
                      fontFamily: "Montserrat-Bold",
                      fontSize: 13,
                    }}
                  >
                    {checkLimitWarning(dailyLimit).message}
                  </Text>
                </Motion.View>
              )}
              <TouchableOpacity
                style={[
                  styles.addPackButton,
                  todayPacks >= weekLimit && styles.addPackButtonDisabled,
                ]}
                onPress={addPack}
                disabled={todayPacks >= weekLimit}
              >
                <Text style={styles.addPackButtonText}>
                  {todayPacks >= weekLimit
                    ? "🚫 Лимит на сегодня"
                    : "➕ Отметить вкид"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetDailyPacks}
              >
                <Text style={styles.resetButtonText}>🔄 Новый день</Text>
              </TouchableOpacity>
              <Text style={styles.tipText}>
                💡 Лимит этой недели: {weekLimit} пакетиков в день
              </Text>
            </Motion.View>
          )}

          {/* Кнопка истории вкидов с увеличенным отступом сверху */}
          <View style={styles.historyButtonContainer}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text style={styles.historyButtonText}>
                {showHistory
                  ? "📋 Скрыть историю"
                  : "📋 Показать историю вкидов"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* История вкидов */}
          {showHistory && packHistory.length > 0 && (
            <View style={styles.historyCardContainer}>
              <Motion.View
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.historyCard}
              >
                <Text style={styles.historyTitle}>📋 История вкидов</Text>
                {packHistory.map((entry) => (
                  <View key={entry.id} style={styles.historyItem}>
                    <View style={styles.historyItemLeft}>
                      <Text style={styles.historyItemTime}>{entry.time}</Text>
                      <Text style={styles.historyItemCount}>
                        {entry.count} пак.
                      </Text>
                    </View>
                    <Text style={styles.historyItemDate}>{entry.date}</Text>
                  </View>
                ))}
              </Motion.View>
            </View>
          )}

          {strategy === "gradual" && reductionPlan.length > 0 && (
            <Motion.View
              key={`plan-${animationKey}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={styles.planCard}
            >
              <Text style={styles.planTitle}>📅 План снижения</Text>
              {expectedQuitDate && (
                <Text style={styles.planSubtitle}>
                  Примерная дата отказа:{" "}
                  {expectedQuitDate.toLocaleDateString("ru-RU")}
                </Text>
              )}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{reductionPlan.length}</Text>
                  <Text style={styles.statLabel}>недель</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round(
                      ((currentWeek + 1) / reductionPlan.length) * 100,
                    )}
                    %
                  </Text>
                  <Text style={styles.statLabel}>прогресс</Text>
                </View>
              </View>
              {reductionPlan.slice(0, 5).map((week, index) => (
                <View
                  key={index}
                  style={[
                    styles.planRow,
                    index === currentWeek && {
                      backgroundColor: theme.accent + "10",
                      borderRadius: 10,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.planWeek,
                      index === currentWeek && { color: theme.accent },
                    ]}
                  >
                    {index === currentWeek ? "🔸" : ""} Нед {week.week}
                  </Text>
                  <Text
                    style={[
                      styles.planValue,
                      index === currentWeek && {
                        color: theme.accent,
                        fontFamily: "Montserrat-Bold",
                      },
                    ]}
                  >
                    {week.packetsPerDay} пак.
                  </Text>
                  <Text style={styles.planDate}>{week.date}</Text>
                </View>
              ))}
              {reductionPlan.length > 5 && (
                <Text style={styles.planMore}>...</Text>
              )}
            </Motion.View>
          )}

          {/* УДАЛЕНО: Достижения из HomeScreen */}

          {userAnswers?.reasons?.length > 0 && (
            <Motion.View
              key={`motivation-${animationKey}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={styles.motivationCard}
            >
              <Text style={styles.motivationTitle}>Твои причины:</Text>
              <View style={styles.reasonsContainer}>
                {userAnswers.reasons.map((reason, index) => (
                  <View key={index} style={styles.reasonChip}>
                    <Text style={styles.reasonChipText}>{reason}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.motivationText}>
                {getMotivationByReason(userAnswers.reasons)}
              </Text>
            </Motion.View>
          )}

          {strategy === "coldTurkey" && quitDate && (
            <Motion.View
              key={`stats-${animationKey}`}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={styles.motivationCard}
            >
              <Text style={styles.motivationTitle}>Ты продержался:</Text>
              <Text style={styles.daysCount}>{timeElapsed.days} дней</Text>
              <Text style={styles.motivationSubtext}>
                {timeElapsed.days === 0 && "Первый день - самый важный!"}
                {timeElapsed.days === 1 && "Один день позади!"}
                {timeElapsed.days === 2 && "Два дня - ты сильнее чем думал!"}
                {timeElapsed.days === 3 && "Три дня - организм очищается!"}
                {timeElapsed.days >= 4 && "Ты супер! Так держать!"}
              </Text>
            </Motion.View>
          )}
        </>
      )}
    </ScrollView>
  );
}
