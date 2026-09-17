import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/format-currency';

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
  if (data.length === 0 || totalExpense === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kategori Pengeluaran</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyText}>Belum ada pengeluaran yang dicatat</Text>
        </View>
      </View>
    );
  }

  // Calculate SVG stroke segments for donut chart
  const radius = 55;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kategori Pengeluaran</Text>

      <View style={styles.chartAndCenter}>
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {/* Background ring */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.border}
                strokeWidth={strokeWidth}
                fill="transparent"
              />

              {/* Segments */}
              {data.map((item, index) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += item.percentage;

                return (
                  <Circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={item.color || colors.expense}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                );
              })}
            </G>
          </Svg>

          {/* Center text */}
          <View style={styles.donutCenter}>
            <Text style={styles.centerLabel}>Total</Text>
            <Text style={styles.centerValue} numberOfLines={1}>
              {data.length} Kategori
            </Text>
          </View>
        </View>
      </View>

      {/* Category breakdown list */}
      <View style={styles.categoryList}>
        {data.slice(0, 5).map((item) => (
          <View key={item.categoryId} style={styles.categoryRow}>
            <View style={[styles.catIconWrap, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={(item.icon || 'grid-outline') as any} size={16} color={item.color} />
            </View>

            <View style={styles.catInfo}>
              <View style={styles.catHeader}>
                <Text style={styles.catName}>{item.name}</Text>
                <Text style={styles.catPercent}>{item.percentage.toFixed(1)}%</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.max(4, item.percentage))}%`, backgroundColor: item.color },
                  ]}
                />
              </View>

              <Text style={styles.catTotal}>{formatCurrency(item.total)}</Text>
            </View>
          </View>
        ))}
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
  categoryList: {
    marginTop: 16,
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
