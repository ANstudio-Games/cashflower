import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Debt } from '@/types';
import { formatCurrency } from './format-currency';

export type NotifLang = 'en' | 'id' | 'zh';

const NOTIF_TEXTS: Record<NotifLang, {
  dailyTitle: string;
  dailyBody: string;
  recTitle: string;
  recBody: (person: string, amount: string) => string;
  payTitle: string;
  payBody: (person: string, amount: string) => string;
}> = {
  en: {
    dailyTitle: "🌸 Record Today's Expenses",
    dailyBody: 'Take 1 minute to log your expenses today and keep your cash flow clear!',
    recTitle: '⏰ Loan Collection Due Today',
    recBody: (person, amount) => `Today is the due date to collect ${amount} from ${person}!`,
    payTitle: '⏰ Debt Payment Due Today',
    payBody: (person, amount) => `Today is the due date to pay ${amount} to ${person}.`,
  },
  id: {
    dailyTitle: '🌸 Catat Belanjaan Hari Ini',
    dailyBody: 'Luangkan 1 menit untuk mencatat pengeluaran Anda hari ini agar cashflow tetap rapi!',
    recTitle: '⏰ Jatuh Tempo Tagihan Piutang',
    recBody: (person, amount) => `Hari ini batas waktu penagihan ke ${person} sebesar ${amount}!`,
    payTitle: '⏰ Jatuh Tempo Pembayaran Hutang',
    payBody: (person, amount) => `Hari ini batas waktu pembayaran hutang ke ${person} sebesar ${amount}.`,
  },
  zh: {
    dailyTitle: '🌸 记录今天的开支',
    dailyBody: '花1分钟记录今天的收支，保持财务清爽有序！',
    recTitle: '⏰ 应收账款到期提醒',
    recBody: (person, amount) => `今天是向 ${person} 收回款项 ${amount} 的约定到期日！`,
    payTitle: '⏰ 还款到期提醒',
    payBody: (person, amount) => `今天是向 ${person} 偿还欠款 ${amount} 的约定到期日。`,
  },
};

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
        name: 'Cashflower Reminder',
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

export async function scheduleDailyReminder(
  hour: number = 20,
  minute: number = 0,
  lang: NotifLang = 'en'
): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    // Cancel existing daily reminders
    await cancelDailyReminder();

    const texts = NOTIF_TEXTS[lang] || NOTIF_TEXTS.en;

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_finance_reminder',
      content: {
        title: texts.dailyTitle,
        body: texts.dailyBody,
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

export async function scheduleDebtReminder(debt: Debt, lang: NotifLang = 'en'): Promise<void> {
  try {
    if (!debt.due_date || debt.is_paid === 1) return;

    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const dueDateObj = new Date(debt.due_date + 'T09:00:00');
    if (isNaN(dueDateObj.getTime()) || dueDateObj.getTime() <= Date.now()) return;

    const identifier = `debt_reminder_${debt.id}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);

    const texts = NOTIF_TEXTS[lang] || NOTIF_TEXTS.en;
    const isReceivable = debt.type === 'receivable';
    const title = isReceivable ? texts.recTitle : texts.payTitle;
    const body = isReceivable
      ? texts.recBody(debt.person_name, formatCurrency(debt.amount))
      : texts.payBody(debt.person_name, formatCurrency(debt.amount));

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
