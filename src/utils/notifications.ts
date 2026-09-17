import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Debt } from '@/types';
import { formatCurrency } from './format-currency';

// Configure notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Pengingat Cashflower',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0D9488',
      });
    }

    return true;
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return false;
  }
}

export async function scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    // Cancel existing daily reminders
    await cancelDailyReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_finance_reminder',
      content: {
        title: '🌸 Catat Belanjaan Hari Ini',
        body: 'Luangkan 1 menit untuk mencatat pengeluaran Anda hari ini agar cashflow tetap rapi!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (err) {
    console.warn('Error scheduling daily reminder:', err);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('daily_finance_reminder');
  } catch (err) {
    console.warn('Error canceling daily reminder:', err);
  }
}

export async function scheduleDebtReminder(debt: Debt): Promise<void> {
  try {
    if (!debt.due_date || debt.is_paid === 1) return;

    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const dueDateObj = new Date(debt.due_date + 'T09:00:00');
    if (isNaN(dueDateObj.getTime()) || dueDateObj.getTime() <= Date.now()) return;

    const identifier = `debt_reminder_${debt.id}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);

    const isReceivable = debt.type === 'receivable';
    const title = isReceivable ? '⏰ Jatuh Tempo Tagihan Piutang' : '⏰ Jatuh Tempo Pembayaran Hutang';
    const body = isReceivable
      ? `Hari ini batas waktu penagihan ke ${debt.person_name} sebesar ${formatCurrency(debt.amount)}!`
      : `Hari ini batas waktu pembayaran hutang ke ${debt.person_name} sebesar ${formatCurrency(debt.amount)}.`;

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDateObj,
      },
    });
  } catch (err) {
    console.warn('Error scheduling debt reminder:', err);
  }
}
