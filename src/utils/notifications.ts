import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Debt } from '@/types';
import { translate } from '@/i18n';
import type { Language } from '@/i18n/types';
import { formatCurrency } from './format-currency';
import { debtReminderIsEligible, ReminderStatus } from './reminder-policy';

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
    await ensureChannel(lang);
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    await ensureChannel(lang);

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
): Promise<boolean> {
  try {
    const granted = await requestNotificationPermissions(lang);
    if (!granted) return false;

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
    return false;
  }
  return true;
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
    if (!debtReminderIsEligible(debt)) {
      await cancelDebtReminder(debt.id);
      return;
    }

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

async function ensureChannel(lang: NotifLang): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: translate(lang, 'notif_channel_name'),
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D9488',
    });
  }
}

/** Reconcile only this app's finance reminders. Never touches unrelated notifications. */
export async function reconcileReminders(
  daily: boolean, debtEnabled: boolean, debts: Debt[], lang: NotifLang,
  requestPermission = false
): Promise<{ daily: ReminderStatus; debt: ReminderStatus }> {
  try {
    if (Platform.OS === 'web') return { daily: daily ? 'permission-denied' : 'off', debt: debtEnabled ? 'permission-denied' : 'off' };
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of pending) {
      if (item.identifier === 'daily_finance_reminder' || item.identifier.startsWith('debt_reminder_')) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
    if (!daily && !debtEnabled) return { daily: 'off', debt: 'off' };
    const granted = requestPermission
      ? await requestNotificationPermissions(lang)
      : (await Notifications.getPermissionsAsync()).status === 'granted';
    if (!granted) return { daily: daily ? 'permission-denied' : 'off', debt: debtEnabled ? 'permission-denied' : 'off' };
    await ensureChannel(lang);
    if (daily) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily_finance_reminder',
        content: { title: translate(lang, 'notif_daily_title'), body: translate(lang, 'notif_daily_body'), sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
      });
    }
    for (const debt of debtEnabled ? debts : []) {
      if (!debtReminderIsEligible(debt)) continue;
      const isReceivable = debt.type === 'receivable';
      await Notifications.scheduleNotificationAsync({
        identifier: `debt_reminder_${debt.id}`,
        content: {
          title: translate(lang, isReceivable ? 'notif_debt_receivable_title' : 'notif_debt_payable_title'),
          body: translate(lang, isReceivable ? 'notif_debt_receivable_body' : 'notif_debt_payable_body', { person: debt.person_name, amount: formatCurrency(debt.amount, lang) }),
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(`${debt.due_date}T09:00:00`) },
      });
    }
    const scheduled = new Set((await Notifications.getAllScheduledNotificationsAsync()).map(item => item.identifier));
    const debtIds = debtEnabled ? debts.filter(debt => debtReminderIsEligible(debt)).map(debt => `debt_reminder_${debt.id}`) : [];
    return {
      daily: daily ? (scheduled.has('daily_finance_reminder') ? 'active' : 'error') : 'off',
      debt: debtEnabled ? (debtIds.every(id => scheduled.has(id)) ? 'active' : 'error') : 'off',
    };
  } catch (error) {
    console.warn('Error reconciling reminders:', error);
    // Do not claim off when cancellation itself may have failed.
    return { daily: 'error', debt: 'error' };
  }
}
