import type * as SQLite from 'expo-sqlite';
import type { AdSaveCategory } from '@/config/ads';

export async function initializeAds(): Promise<void> {
  // No-op di web
}

export function preloadInterstitial(): void {
  // No-op di web
}

export function showInterstitialIfAvailable(onClose?: () => void): boolean {
  onClose?.();
  return false;
}

export async function handleTransactionSavedWithAd(
  _db: SQLite.SQLiteDatabase,
  onFinish: () => void
): Promise<void> {
  onFinish();
}

export async function handleSavedWithAd(
  _db: SQLite.SQLiteDatabase,
  _category: AdSaveCategory,
  onFinish: () => void
): Promise<void> {
  onFinish();
}
