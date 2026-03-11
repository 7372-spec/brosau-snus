// src/utils/notifications.js
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
  });
}

export async function scheduleDailyReminder(hour = 20, minute = 0) {
  await cancelAllReminders();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ Напоминание",
      body: "Не забудь отметить, сколько пакетиков ты использовал сегодня!",
      data: { type: "daily_reminder" },
      sound: true,
    },
    trigger: { hour, minute, repeats: true },
  });
  await AsyncStorage.setItem("reminderId", notificationId);
  await AsyncStorage.setItem("reminderTime", JSON.stringify({ hour, minute }));
  return notificationId;
}

export async function cancelAllReminders() {
  const reminderId = await AsyncStorage.getItem("reminderId");
  if (reminderId)
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  await AsyncStorage.removeItem("reminderId");
}

export async function getReminderTime() {
  const time = await AsyncStorage.getItem("reminderTime");
  return time ? JSON.parse(time) : null;
}

export async function areNotificationsEnabled() {
  const reminderId = await AsyncStorage.getItem("reminderId");
  return !!reminderId;
}
