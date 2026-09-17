import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DB_NAME, initDatabase } from '@/db';
import { FinanceProvider } from '@/context/finance-context';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName={DB_NAME} onInit={initDatabase}>
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
          </Stack>
        </FinanceProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
