import React from 'react';
import { View } from 'react-native';
import { colors } from '@/theme/colors';
import { isValidISODate } from '@/utils/validate-date';

// @expo/ui's web datetime picker is currently a no-op; use the browser calendar.
export function DateField({ value, onChange, label }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <input
        type="date"
        aria-label={label}
        value={value}
        onChange={event => {
          const next = event.target.value;
          if (!next || isValidISODate(next)) onChange(next);
        }}
        style={{ minHeight: 48, width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.surface, color: colors.text, fontFamily: 'inherit', fontSize: 14 }}
      />
    </View>
  );
}
