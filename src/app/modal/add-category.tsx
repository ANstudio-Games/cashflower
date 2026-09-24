import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/finance-context';
import { colors } from '@/theme/colors';
import { useI18n } from '@/i18n';

const AVAILABLE_ICONS = [
  'cart-outline',
  'restaurant-outline',
  'car-outline',
  'gift-outline',
  'fitness-outline',
  'film-outline',
  'airplane-outline',
  'school-outline',
  'shirt-outline',
  'medical-outline',
  'phone-portrait-outline',
  'cafe-outline',
  'paw-outline',
  'bulb-outline',
  'beer-outline',
  'wallet-outline',
];

const AVAILABLE_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
];

export default function AddCategoryModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16) + 10;
  const { createCategory } = useFinance();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedIcon, setSelectedIcon] = useState('cart-outline');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common_attention'), t('cat_err_name'));
      return;
    }

    try {
      await createCategory({
        name: name.trim(),
        type,
        icon: selectedIcon,
        color: selectedColor,
      });
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert(t('common_error'), t('cat_err_save'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('cat_modal_title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Type Toggle */}
        <View style={styles.typeSwitcher}>
          <Pressable
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
            onPress={() => setType('expense')}>
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
              {t('common_expense')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
            onPress={() => setType('income')}>
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
              {t('common_income')}
            </Text>
          </Pressable>
        </View>

        {/* Category Preview */}
        <View style={styles.previewCard}>
          <View style={[styles.previewIconWrap, { backgroundColor: `${selectedColor}20` }]}>
            <Ionicons name={selectedIcon as any} size={28} color={selectedColor} />
          </View>
          <Text style={styles.previewName}>{name ? name : t('cat_preview_default')}</Text>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cat_input_name')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('cat_input_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Color Palette */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cat_choose_color')}</Text>
          <View style={styles.colorsGrid}>
            {AVAILABLE_COLORS.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <Pressable
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }]}
                  onPress={() => setSelectedColor(color)}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Icon Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('cat_choose_icon')}</Text>
          <View style={styles.iconsGrid}>
            {AVAILABLE_ICONS.map((icon) => {
              const isSelected = selectedIcon === icon;
              return (
                <Pressable
                  key={icon}
                  style={[
                    styles.iconBox,
                    isSelected && { borderColor: selectedColor, backgroundColor: `${selectedColor}15` },
                  ]}
                  onPress={() => setSelectedIcon(icon)}>
                  <Ionicons
                    name={icon as any}
                    size={22}
                    color={isSelected ? selectedColor : colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t('cat_save_btn')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: colors.surfaceHover,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeTextActive: {
    fontWeight: '700',
    color: colors.text,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  previewIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
