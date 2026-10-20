import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { Transaction } from '@/types';
import { useI18n } from '@/i18n';
import { colors } from '@/theme/colors';
import { formatCurrency, formatCurrencyShort } from '@/utils/format-currency';
import { buildComparison, ComparisonMode, ComparisonMetric } from '@/utils/comparison-chart';

const PALETTE = ['#0F766E', '#1D4ED8', '#B91C1C', '#7E22CE', '#92400E', '#0369A1', '#BE185D', '#3F6212', '#4338CA', '#C2410C', '#475569', '#047857'];

export function ComparisonLineChart({ transactions }: { transactions: Transaction[] }) {
  const { t, language, getMonthNames } = useI18n();
  const now = new Date();
  const [mode, setMode] = useState<ComparisonMode>('year');
  const [metric, setMetric] = useState<ComparisonMetric>('expense');
  const [year, setYear] = useState(now.getFullYear());
  const [range, setRange] = useState(5);
  const [hidden, setHidden] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const months = getMonthNames();
  const data = useMemo(() => buildComparison(transactions, mode, year, range, metric), [transactions, mode, year, range, metric]);
  const visible = data.series.filter(series => !hidden.includes(series.id));
  const values = visible.flatMap(series => series.values.filter((value): value is number => value !== null));
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const count = mode === 'year' ? 12 : 31;
  const step = 48;
  const width = count * step;
  const height = 200;
  const y = (value: number) => 12 + (max - value) / span * (height - 24);
  const label = (id: number) => mode === 'year' ? String(id) : months[id - 1];
  const resetSelection = () => { setHidden([]); setSelected(null); };
  const chip = (text: string, active: boolean, onPress: () => void, key: string | number = text) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }}
      onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.active, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.chipText, active && styles.activeText]}>{text}</Text>
    </Pressable>
  );
  const peak = (item: typeof data.highestIncome) => item
    ? `${months[item.month - 1]} ${item.year} · ${formatCurrency(item.amount, language)}` : t('compare_no_data');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {chip(t('compare_year_mode'), mode === 'year', () => { setMode('year'); resetSelection(); })}
        {chip(t('compare_month_mode'), mode === 'month', () => { setMode('month'); resetSelection(); })}
      </View>
      <Text style={styles.help}>{t(mode === 'year' ? 'compare_year_help' : 'compare_month_help')}</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('compare_previous_year')} disabled={year <= 10}
          onPress={() => { setYear(year - 1); resetSelection(); }} style={styles.chip}>
          <Text style={styles.activeText}>−</Text>
        </Pressable>
        <Text style={styles.year}>{year}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('compare_next_year')} disabled={year >= now.getFullYear()}
          onPress={() => { setYear(year + 1); resetSelection(); }} style={[styles.chip, year >= now.getFullYear() && { opacity: 0.35 }]}>
          <Text style={styles.activeText}>+</Text>
        </Pressable>
        {year !== now.getFullYear() && chip(t('compare_current_year'), false, () => { setYear(now.getFullYear()); resetSelection(); })}
      </View>
      {mode === 'year' && <View style={styles.row}>
        {[1, 5, 10].map(value => chip(t('compare_years', { count: value }), range === value, () => { setRange(value); resetSelection(); }, value))}
      </View>}
      <View style={styles.row}>
        {(['income', 'expense', 'net'] as const).map(value => chip(t(value === 'net' ? 'compare_net' : `common_${value}`), metric === value, () => setMetric(value), value))}
      </View>
      {visible.length === 0 && <Text style={styles.help}>{t('compare_all_hidden')}</Text>}
      {!data.hasData ? <Text style={styles.empty}>{t('compare_no_data')}</Text> : <>
        <Text style={styles.help}>{formatCurrencyShort(min, language)} — {formatCurrencyShort(max, language)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
          <View>
            <Svg width={width} height={height} accessibilityLabel={t('compare_title')}>
              {[0, 0.5, 1].map(ratio => <Line key={ratio} x1={24} x2={width - 24} y1={12 + ratio * 176} y2={12 + ratio * 176} stroke={colors.border} />)}
              <Line x1={24} x2={width - 24} y1={y(0)} y2={y(0)} stroke={colors.textSecondary} strokeDasharray="4 4" />
              {visible.map(series => {
                const colorIndex = data.series.indexOf(series);
                const color = PALETTE[colorIndex];
                const points = series.values.flatMap((value, i) => value === null ? [] : [`${24 + i * step},${y(value)}`]).join(' ');
                const lastIndex = series.values.findLastIndex(value => value !== null);
                return <React.Fragment key={series.id}>
                  <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeDasharray={colorIndex >= 6 ? '6 3' : undefined} />
                  {lastIndex >= 0 && <SvgText x={24 + lastIndex * step} y={Math.max(12, y(series.values[lastIndex]!) - 8)} fill={color} fontSize={11} fontWeight="bold" textAnchor="middle">{colorIndex + 1}</SvgText>}
                  {series.values.map((value, i) => value === null ? null : <Circle key={i} cx={24 + i * step} cy={y(value)} r={selected === i ? 5 : 3} fill={color} onPress={() => setSelected(i)} />)}
                </React.Fragment>;
              })}
              {selected !== null && <Line x1={24 + selected * step} x2={24 + selected * step} y1={12} y2={188} stroke={colors.textSecondary} strokeDasharray="2 4" />}
            </Svg>
            <View style={{ flexDirection: 'row' }}>
              {Array.from({ length: count }, (_, i) => <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: selected === i }}
                accessibilityLabel={mode === 'year' ? months[i] : `${t('compare_day')} ${i + 1}`}
                onPress={() => setSelected(i)} style={[styles.axisButton, selected === i && styles.active]}>
                <Text style={styles.axisText}>{mode === 'year' ? months[i].slice(0, 3) : i + 1}</Text>
              </Pressable>)}
            </View>
          </View>
        </ScrollView>
        <Text style={styles.help}>{t('compare_tap_hint')}</Text>
        {selected !== null && <View style={styles.details}>
          <Text style={styles.year}>{mode === 'year' ? months[selected] : `${t('compare_day')} ${selected + 1}`}</Text>
          {visible.map(series => <Text key={series.id} style={styles.detailText}>
            {label(series.id)}: {series.values[selected] === null ? '—' : formatCurrency(series.values[selected]!, language)}
            {series.partial ? ` · ${t('compare_partial')}` : ''}
          </Text>)}
        </View>}
      </>}
      <View style={styles.legend}>
        {data.series.map((series, index) => <Pressable key={series.id} accessibilityRole="button"
          accessibilityLabel={`${label(series.id)}${series.partial ? `, ${t('compare_partial')}` : ''}`}
          accessibilityState={{ selected: !hidden.includes(series.id) }}
          onPress={() => setHidden(current => current.includes(series.id) ? current.filter(id => id !== series.id) : [...current, series.id])}
          style={[styles.legendItem, hidden.includes(series.id) && { opacity: 0.4 }]}>
          <Text style={[styles.seriesNumber, { color: PALETTE[index] }]}>{index + 1}</Text>
          <Text style={styles.chipText}>{label(series.id)}{series.partial ? ' *' : ''}</Text>
        </Pressable>)}
      </View>
      <Text style={styles.help}>{t('compare_legend_hint')}</Text>
      <View style={styles.peaks}>
        <Text style={styles.peakLabel}>{t('compare_peak_income')}</Text>
        <Text style={styles.peakValue}>{peak(data.highestIncome)}</Text>
        <Text style={styles.peakLabel}>{t('compare_peak_expense')}</Text>
        <Text style={styles.peakValue}>{peak(data.highestExpense)}</Text>
      </View>
      <Text style={styles.help}>{t('compare_partial_hint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chip: { minWidth: 48, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  active: { backgroundColor: colors.primaryLight },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  activeText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  help: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  year: { fontSize: 16, fontWeight: '700', color: colors.text },
  axisButton: { width: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  axisText: { fontSize: 12, color: colors.textSecondary },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 8 },
  seriesNumber: { fontSize: 14, fontWeight: '800' },
  details: { backgroundColor: colors.background, borderRadius: 12, padding: 12, gap: 6 },
  detailText: { fontSize: 13, color: colors.text, fontVariant: ['tabular-nums'] },
  peaks: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 12, gap: 6 },
  peakLabel: { fontSize: 12, color: colors.textSecondary },
  peakValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
  empty: { paddingVertical: 32, textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
});
