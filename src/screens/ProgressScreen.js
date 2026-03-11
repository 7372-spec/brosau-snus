// src/screens/ProgressScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart, BarChart } from "react-native-chart-kit";
import { useTheme } from "../context/ThemeContext";
import { Motion } from "@legendapp/motion";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

export default function ProgressScreen() {
  const { theme } = useTheme();
  const [animationKey, setAnimationKey] = useState(0);
  const isFocused = useIsFocused();
  const [cravingData, setCravingData] = useState([]);
  const [packData, setPackData] = useState([]);
  const [quitDate, setQuitDate] = useState(null);
  const [chartType, setChartType] = useState("line");
  const [strategy, setStrategy] = useState(null);
  const [packetsPerDay, setPacketsPerDay] = useState("1-3");
  const [reductionPlan, setReductionPlan] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(0);

  // Список ВСЕХ возможных достижений для каждой стратегии
  const allAchievements = {
    coldTurkey: [
      { id: 1, name: "🌱 Первый день", condition: (days) => days >= 1 },
      { id: 2, name: "🌿 3 дня", condition: (days) => days >= 3 },
      { id: 3, name: "🌳 Неделя", condition: (days) => days >= 7 },
      { id: 4, name: "🎯 2 недели", condition: (days) => days >= 14 },
      { id: 5, name: "🏆 Месяц", condition: (days) => days >= 30 },
      { id: 6, name: "💪 3 месяца", condition: (days) => days >= 90 },
      { id: 7, name: "⭐ Полгода", condition: (days) => days >= 180 },
      { id: 8, name: "🎉 Год", condition: (days) => days >= 365 },
    ],
    gradual: [
      { id: 101, name: "📉 Первая неделя", condition: (week) => week >= 1 },
      { id: 102, name: "📊 2 недели", condition: (week) => week >= 2 },
      { id: 103, name: "📈 Месяц пути", condition: (week) => week >= 4 },
      { id: 104, name: "🔽 -25%", condition: (percent) => percent >= 25 },
      { id: 105, name: "⬇️ -50%", condition: (percent) => percent >= 50 },
      { id: 106, name: "⬇️⬇️ -75%", condition: (percent) => percent >= 75 },
      { id: 107, name: "🎯 Полный отказ!", condition: (count) => count === 0 },
      { id: 108, name: "📅 30 дней пути", condition: (days) => days >= 30 },
      { id: 109, name: "💫 3 месяца пути", condition: (days) => days >= 90 },
    ],
  };

  useEffect(() => {
    if (isFocused) {
      setAnimationKey((prev) => prev + 1);
      loadStrategy();
      loadUserData();
    }
  }, [isFocused]);

  useEffect(() => {
    loadData();
  }, []);

  const loadStrategy = async () => {
    const savedStrategy = await AsyncStorage.getItem("quitStrategy");
    setStrategy(savedStrategy);
  };

  const loadUserData = async () => {
    try {
      const savedAnswers = await AsyncStorage.getItem("userAnswers");
      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers);
        setPacketsPerDay(answers.packetsPerDay || "1-3");
      }

      const savedStrategy = await AsyncStorage.getItem("quitStrategy");
      if (savedStrategy === "gradual") {
        const savedDate = await AsyncStorage.getItem("quitDate");
        if (savedDate) {
          setQuitDate(new Date(savedDate));
          const savedAnswers = await AsyncStorage.getItem("userAnswers");
          if (savedAnswers) {
            const answers = JSON.parse(savedAnswers);
            if (answers.quitStyle === "Постепенно - снижать количество") {
              const plan = createReductionPlan(answers.packetsPerDay);
              setReductionPlan(plan);
            }
          }
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
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

  const loadData = async () => {
    try {
      const history = await AsyncStorage.getItem("cravingHistory");
      if (history) {
        setCravingData(JSON.parse(history));
      }

      const packs = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        const packsCount = await AsyncStorage.getItem(`packs_${dateString}`);
        packs.push({
          date: `${date.getDate()}.${date.getMonth() + 1}`,
          count: packsCount ? parseInt(packsCount) : 0,
        });
      }
      setPackData(packs);

      const date = await AsyncStorage.getItem("quitDate");
      if (date) {
        setQuitDate(new Date(date));
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  };

  const daysPassed = quitDate
    ? Math.floor((new Date() - quitDate) / (1000 * 60 * 60 * 24))
    : 0;

  // ========== СТАТИСТИКА ПО ПАЧКАМ ==========
  const packStats = {
    total: packData.reduce((sum, d) => sum + d.count, 0),
    average:
      packData.length > 0
        ? (
            packData.reduce((sum, d) => sum + d.count, 0) / packData.length
          ).toFixed(1)
        : "0.0",
    trend:
      packData.length >= 2 && packData[0].count !== 0
        ? Math.round(
            ((packData[packData.length - 1].count - packData[0].count) /
              packData[0].count) *
              100,
          )
        : 0,
  };

  // ========== СТАТИСТИКА ПО ТЯГЕ ==========
  const cravingStats = {
    total: cravingData.length,
    conquered: cravingData.filter((r) => r.conquered).length,
    average:
      cravingData.length > 0
        ? (
            cravingData.reduce((sum, r) => sum + r.level, 0) /
            cravingData.length
          ).toFixed(1)
        : "0.0",
  };
  // ========================================

  // ========== ПОЛУЧЕНИЕ ДОСТИЖЕНИЙ ==========
  const getAchievements = () => {
    const currentWeekIndex = getCurrentWeek();
    const initialCount = getPacketCount(packetsPerDay);
    const currentCount =
      reductionPlan[currentWeekIndex]?.packetsPerDay || initialCount;
    const totalReduction = initialCount - currentCount;
    const percentReduction = Math.round((totalReduction / initialCount) * 100);

    const achievementsList =
      strategy === "coldTurkey"
        ? allAchievements.coldTurkey
        : allAchievements.gradual;

    return achievementsList.map((achievement) => {
      let achieved = false;

      if (strategy === "coldTurkey") {
        achieved = achievement.condition(daysPassed);
      } else {
        if (achievement.id <= 103) {
          // По неделям
          achieved = achievement.condition(currentWeekIndex);
        } else if (achievement.id <= 106) {
          // По процентам
          achieved = achievement.condition(percentReduction);
        } else if (achievement.id === 107) {
          // Полный отказ
          achieved = achievement.condition(currentCount);
        } else {
          // По дням
          achieved = achievement.condition(daysPassed);
        }
      }

      return {
        ...achievement,
        achieved,
      };
    });
  };
  // ================================

  const achievements = getAchievements();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.accentSecondary,
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
    subtitle: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: "#ecf0f1",
      marginTop: 5,
    },
    cardTitle: {
      fontSize: 20,
      fontFamily: "Montserrat-Bold",
      marginBottom: 15,
      color: theme.text,
    },
    achievementsCard: {
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
    achievementsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    achievementItem: {
      width: "48%",
      backgroundColor: theme.background,
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.border,
      opacity: 0.4, // ⬅️ УМЕНЬШИЛ НЕПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ (было 0.5, стало 0.4)
    },
    achievementAchieved: {
      backgroundColor: theme.accent + "20",
      borderColor: theme.accent,
      opacity: 1, // Полученные - яркие
    },
    achievementIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    achievementName: {
      fontSize: 13,
      fontFamily: "Montserrat-Bold",
      textAlign: "center",
      color: theme.text,
    },
    achievementAchievedName: {
      color: theme.accent,
    },
    achievementCheck: {
      fontSize: 20,
      color: theme.accent,
      marginTop: 5,
      fontFamily: "Montserrat-Bold",
    },
    chartControls: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 10,
    },
    controlButton: {
      paddingHorizontal: 25,
      paddingVertical: 12,
      marginHorizontal: 5,
      borderRadius: 25,
      backgroundColor: theme.border,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    controlButtonActive: {
      backgroundColor: theme.accentSecondary,
    },
    controlText: {
      fontSize: 15,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
    },
    controlTextActive: {
      color: "white",
      fontFamily: "Montserrat-Bold",
    },
    chartCard: {
      backgroundColor: theme.card,
      margin: 15,
      marginTop: 0,
      padding: 15,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    chartTitle: {
      fontSize: 18,
      fontFamily: "Montserrat-Bold",
      marginBottom: 15,
      textAlign: "center",
      color: theme.text,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    statsCard: {
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
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    statLabel: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
    },
    statValue: {
      fontSize: 16,
      fontFamily: "Montserrat-Bold",
      color: theme.accentSecondary,
    },
    trendUp: {
      color: theme.accent,
    },
    trendDown: {
      color: theme.danger,
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    trendIcon: {
      marginRight: 5,
    },
    emptyAchievements: {
      fontSize: 16,
      fontFamily: "Montserrat-Regular",
      color: theme.textSecondary,
      textAlign: "center",
      padding: 20,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Motion.View
        key={`header-${animationKey}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 120 }}
        style={styles.header}
      >
        <Text style={styles.title}>📈 Мой прогресс</Text>
        <Text style={styles.subtitle}>
          {daysPassed} {getDaysWord(daysPassed)} без снюса
        </Text>
      </Motion.View>

      {/* Достижения - все видны, полученные подсвечены */}
      <Motion.View
        key={`achievements-${animationKey}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={styles.achievementsCard}
      >
        <Text style={styles.cardTitle}>
          🏅 Достижения {strategy === "gradual" ? "(постепенный отказ)" : ""}
        </Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((a, index) => (
            <Motion.View
              key={a.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              style={[
                styles.achievementItem,
                a.achieved && styles.achievementAchieved,
              ]}
            >
              <Text style={styles.achievementIcon}>{a.name.split(" ")[0]}</Text>
              <Text
                style={[
                  styles.achievementName,
                  a.achieved && styles.achievementAchievedName,
                ]}
              >
                {a.name}
              </Text>
              {a.achieved && <Text style={styles.achievementCheck}>✓</Text>}
            </Motion.View>
          ))}
        </View>
      </Motion.View>

      <View style={styles.chartControls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            chartType === "line" && styles.controlButtonActive,
          ]}
          onPress={() => setChartType("line")}
        >
          <Text
            style={[
              styles.controlText,
              chartType === "line" && styles.controlTextActive,
            ]}
          >
            Линейный
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.controlButton,
            chartType === "bar" && styles.controlButtonActive,
          ]}
          onPress={() => setChartType("bar")}
        >
          <Text
            style={[
              styles.controlText,
              chartType === "bar" && styles.controlTextActive,
            ]}
          >
            Столбцы
          </Text>
        </TouchableOpacity>
      </View>

      {packData.length > 0 && (
        <Motion.View
          key={`chart-${animationKey}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={styles.chartCard}
        >
          <Text style={styles.chartTitle}>📊 Потребление по дням</Text>
          {chartType === "line" ? (
            <LineChart
              data={{
                labels: packData.map((d) => d.date),
                datasets: [
                  {
                    data: packData.map((d) => d.count),
                    color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={Dimensions.get("window").width - 40}
              height={220}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                labelColor: (opacity = 1) => theme.text,
                style: { borderRadius: 16 },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <BarChart
              data={{
                labels: packData.map((d) => d.date),
                datasets: [
                  {
                    data: packData.map((d) => d.count),
                  },
                ],
              }}
              width={Dimensions.get("window").width - 40}
              height={220}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
                labelColor: (opacity = 1) => theme.text,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          )}
        </Motion.View>
      )}

      <Motion.View
        key={`stats-${animationKey}`}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={styles.statsCard}
      >
        <Text style={styles.cardTitle}>📊 Статистика</Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Всего дней:</Text>
          <Text style={styles.statValue}>{daysPassed}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Среднее потребление:</Text>
          <Text style={styles.statValue}>{packStats.average} пак./день</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Тренд:</Text>
          <View style={styles.trendContainer}>
            <Ionicons
              name={
                packStats.trend > 0
                  ? "trending-up"
                  : packStats.trend < 0
                    ? "trending-down"
                    : "remove"
              }
              size={20}
              color={
                packStats.trend > 0
                  ? theme.accent
                  : packStats.trend < 0
                    ? theme.danger
                    : theme.textSecondary
              }
              style={styles.trendIcon}
            />
            <Text
              style={[
                styles.statValue,
                packStats.trend > 0
                  ? styles.trendUp
                  : packStats.trend < 0
                    ? styles.trendDown
                    : null,
              ]}
            >
              {Math.abs(packStats.trend)}%
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Всего вкидов:</Text>
          <Text style={styles.statValue}>{packStats.total}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Эпизодов тяги:</Text>
          <Text style={styles.statValue}>{cravingStats.total}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Преодолено тяг:</Text>
          <Text style={styles.statValue}>{cravingStats.conquered}</Text>
        </View>
      </Motion.View>
    </ScrollView>
  );
}

function getDaysWord(days) {
  if (days % 10 === 1 && days % 100 !== 11) return "день";
  if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100))
    return "дня";
  return "дней";
}
