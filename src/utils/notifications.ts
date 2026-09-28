import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Debt } from '@/types';
import { translate } from '@/i18n';
import type { Language } from '@/i18n/types';
import { formatCurrency } from './format-currency';

export type NotifLang = Language;

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

export async function requestNotificationPermissions(lang: NotifLang = 'en'): Promise<boolean> {
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
        name: translate(lang, 'notif_channel_name'),
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
    const granted = await requestNotificationPermissions(lang);
    if (!granted) return;

    // Cancel existing daily reminders
    await cancelDailyReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_finance_reminder',
      content: {
        title: translate(lang, 'notif_daily_title'),
        body: translate(lang, 'notif_daily_body'),
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

    const granted = await requestNotificationPermissions(lang);
    if (!granted) return;

    const dueDateObj = new Date(debt.due_date + 'T09:00:00');
    if (isNaN(dueDateObj.getTime()) || dueDateObj.getTime() <= Date.now()) return;

    const identifier = `debt_reminder_${debt.id}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);

    const isReceivable = debt.type === 'receivable';
    const amount = formatCurrency(debt.amount, lang);
    const title = translate(
      lang,
      isReceivable ? 'notif_debt_receivable_title' : 'notif_debt_payable_title'
    );
    const body = translate(
      lang,
      isReceivable ? 'notif_debt_receivable_body' : 'notif_debt_payable_body',
      { person: debt.person_name, amount }
    );

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

export async function cancelDebtReminder(debtId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`debt_reminder_${debtId}`);
  } catch (err) {
    console.warn('Error canceling debt reminder:', err);
  }
}
