import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DB_NAME, initDatabase } from '@/db';
import { I18nProvider } from '@/i18n';
import { FinanceProvider } from '@/context/finance-context';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName={DB_NAME} onInit={initDatabase}>
        <I18nProvider>
          <FinanceProvider>
            <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal/add-transaction"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/add-debt"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/add-investment"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/add-category"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/settings"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/budget"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/export-report"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/plans"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/add-plan"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/wallets"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/add-wallet"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/transfer-funds"
              options={{ presentation: 'modal', headerShown: false }}
            />
          </Stack>
        </FinanceProvider>
      </I18nProvider>
    </SQLiteProvider>
    </SafeAreaProvider>
  );
}
