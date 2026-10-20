import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n';
import { colors } from '@/theme/colors';
import { dateToISO, isoToDate } from '@/utils/transaction-filters';

/** A date-only field shared by transaction forms and filters. Native picker owns its Host. */
export function DateField({ value, onChange, label, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}) {
  const { t, language, formatDateFull } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const picker = (
    <DateTimePicker
      value={isoToDate(draft)}
      mode="date"
      display={Platform.OS === 'ios' ? 'inline' : 'default'}
      locale={language === 'zh' ? 'zh_CN' : language === 'id' ? 'id_ID' : 'en_US'}
      accentColor={colors.primary}
      onDismiss={() => setOpen(false)}
      onValueChange={(_, date) => {
        const next = dateToISO(date);
        setDraft(next);
        if (Platform.OS !== 'ios') {
          onChange(next);
          setOpen(false);
        }
      }}
    />
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDateFull(value) : placeholder || label}`}
        accessibilityState={{ expanded: open }}
        onPress={() => { setDraft(value || dateToISO(new Date())); setOpen(true); }}
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.7 }]}>
        <Ionicons name="calendar-outline" size={20} color={colors.primaryDark} />
        <Text style={[styles.value, !value && { color: colors.textMuted }]}>
          {value ? formatDateFull(value) : placeholder || label}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>
      {open && Platform.OS !== 'ios' && picker}
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <View style={styles.dialog} accessibilityViewIsModal>
              <Text style={styles.title}>{label}</Text>
              {open && picker}
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" style={styles.action} onPress={() => setOpen(false)}>
                  <Text style={styles.actionText}>{t('common_cancel')}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={styles.action} onPress={() => { onChange(draft); setOpen(false); }}>
                  <Text style={styles.actionText}>{t('common_save')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  field: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
  value: { flex: 1, fontSize: 14, color: colors.text },
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
  dialog: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, width: '100%', maxWidth: 420, alignSelf: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 },
  actionText: { color: colors.primaryDark, fontWeight: '600' },
});
