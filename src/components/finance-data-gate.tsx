import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useFinance } from '@/context/finance-context';
import { useI18n } from '@/i18n';
import { colors } from '@/theme/colors';

export function FinanceDataGate({ children }: { children: React.ReactNode }) {
  const { isLoading, loadError, refreshAll } = useFinance();
  const { t } = useI18n();
  const [retrying, setRetrying] = useState(false);
  if (!isLoading && !loadError) return children;
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background }}>
      {(isLoading || retrying) ? <ActivityIndicator color={colors.primaryDark} accessibilityLabel={t('safety_loading')} /> : (
        <>
          <Text accessibilityRole="alert" style={{ color: colors.text, fontSize: 16 }}>{t('safety_load_error')}</Text>
          <Pressable accessibilityRole="button" disabled={retrying} onPress={async () => {
            setRetrying(true);
            try { await refreshAll(); } finally { setRetrying(false); }
          }} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: colors.primaryDark }}>
            <Text style={{ color: colors.surface, fontSize: 16, fontWeight: '600' }}>{t('safety_retry')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
