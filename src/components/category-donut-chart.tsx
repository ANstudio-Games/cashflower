import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';
import { useI18n } from '@/i18n';

interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

interface CategoryDonutChartProps {
  data: CategoryBreakdownItem[];
  totalExpense: number;
}

export function CategoryDonutChart({ data, totalExpense }: CategoryDonutChartProps) {
  const { t, language } = useI18n();

  // Defensive checks
  const safeData = Array.isArray(data) ? data : [];
  const safeTotal = typeof totalExpense === 'number' && !isNaN(totalExpense) ? totalExpense : 0;

  if (safeData.length === 0 || safeTotal <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('analytics_category_title')}</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('chart_no_expense')}</Text>
        </View>
      </View>
    );
  }

  // Calculate SVG stroke segments for donut chart safely
  const radius = 50;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius; // ~314.159
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('analytics_category_title')}</Text>

      {/* Donut Chart Visualizer with safe numbers & RN transform */}
      <View style={styles.chartAndCenter}>
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Category segments */}
            {safeData.map((item, index) => {
              const itemPct = typeof item.percentage === 'number' && !isNaN(item.percentage) ? item.percentage : 0;
              const dashLength = Math.max(0, (itemPct / 100) * circumference);
              const dashGap = circumference;
              const offset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += itemPct;

              // Pass numbers array [dashLength, dashGap] to avoid string parsing bugs on Android
              return (
                <Circle
                  key={item.categoryId || index}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={item.color || colors.expense}
                  strokeWidth={strokeWidth}
                  strokeDasharray={[Math.round(dashLength), Math.round(dashGap)]}
                  strokeDashoffset={Math.round(offset)}
                  fill="transparent"
                />
              );
            })}
          </Svg>

          {/* Center text overlay */}
          <View style={styles.donutCenter}>
            <Text style={styles.centerLabel}>{t('common_all')}</Text>
            <Text style={styles.centerValue} numberOfLines={1}>
              {t('chart_category_count', { count: safeData.length })}
            </Text>
          </View>
        </View>
      </View>

      {/* Multi-segment distribution bar */}
      <View style={styles.distributionBar}>
        {safeData.map((item, index) => {
          const itemPct = typeof item.percentage === 'number' && !isNaN(item.percentage) ? item.percentage : 0;
          if (itemPct <= 0) return null;
          return (
            <View
              key={item.categoryId || index}
              style={[
                styles.distributionSegment,
                {
                  flex: Math.max(1, Math.round(itemPct)),
                  backgroundColor: item.color || colors.expense,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Category breakdown list */}
      <View style={styles.categoryList}>
        {safeData.slice(0, 6).map((item, index) => {
          const itemPct = typeof item.percentage === 'number' && !isNaN(item.percentage) ? item.percentage : 0;
          return (
            <View key={item.categoryId || index} style={styles.categoryRow}>
              <View style={[styles.catIconWrap, { backgroundColor: `${item.color || colors.expense}15` }]}>
                <Ionicons
                  name={(item.icon || 'grid-outline') as any}
                  size={16}
                  color={item.color || colors.expense}
                />
              </View>

              <View style={styles.catInfo}>
                <View style={styles.catHeader}>
                  <Text style={styles.catName} numberOfLines={1}>
                    {item.name || t('common_others')}
                  </Text>
                  <Text style={styles.catPercent}>{itemPct.toFixed(1)}%</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, Math.max(3, itemPct))}%`,
                        backgroundColor: item.color || colors.expense,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.catTotal}>{formatCurrency(item.total || 0, language)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  chartAndCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  centerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.border,
    gap: 2,
  },
  distributionSegment: {
    height: '100%',
    borderRadius: 2,
  },
  categoryList: {
    marginTop: 12,
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  catPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  catTotal: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
