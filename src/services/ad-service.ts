import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import mobileAds, {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AD_COUNTER_KEYS, AdSaveCategory, getAdUnitId, shouldShowAd } from '@/config/ads';
import { getSetting, setSetting } from '@/db';

let isInitialized = false;
let interstitialInstance: InterstitialAd | null = null;
let isInterstitialLoaded = false;
let isInterstitialLoading = false;
let onDismissCallback: (() => void) | null = null;

/**
 * Inisialisasi Mobile Ads SDK sekali saat aplikasi terbuka.
 */
export async function initializeAds(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isInitialized) return;

  try {
    await mobileAds().initialize();
    isInitialized = true;
    preloadInterstitial();
  } catch (error) {
    console.warn('[AdMob] Inisialisasi error:', error);
  }
}

/**
 * Preload interstitial ad di background agar instan saat mau ditampilkan.
 */
export function preloadInterstitial(): void {
  if (Platform.OS === 'web') return;
  if (isInterstitialLoading || isInterstitialLoaded) return;

  const adUnitId = getAdUnitId('interstitial');

  if (!interstitialInstance) {
    interstitialInstance = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
      isInterstitialLoading = false;
    });

    interstitialInstance.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      isInterstitialLoading = false;

      // Jalankan callback penutupan jika ada
      if (onDismissCallback) {
        const cb = onDismissCallback;
        onDismissCallback = null;
        cb();
      }

      // Preload iklan berikutnya
      preloadInterstitial();
    });

    interstitialInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      isInterstitialLoaded = false;
      isInterstitialLoading = false;
      console.warn('[AdMob] Interstitial Error:', error);
      const cb = onDismissCallback;
      onDismissCallback = null;
      cb?.();

      // Coba load ulang setelah 20 detik
      setTimeout(() => {
        preloadInterstitial();
      }, 20000);
    });
  }

  try {
    isInterstitialLoading = true;
    interstitialInstance.load();
  } catch (e) {
    isInterstitialLoading = false;
    console.warn('[AdMob] Gagal memuat interstitial:', e);
  }
}

/**
 * Tampilkan interstitial jika sudah siap muat.
 * Mengembalikan true jika iklan berhasil ditampilkan, false jika belum siap/offline.
 */
export function showInterstitialIfAvailable(onClose?: () => void): boolean {
  if (Platform.OS === 'web' || !interstitialInstance || !isInterstitialLoaded) {
    onClose?.();
    preloadInterstitial();
    return false;
  }

  onDismissCallback = onClose || null;

  try {
    isInterstitialLoaded = false;
    void interstitialInstance.show().catch(error => {
      console.warn('[AdMob] Gagal menampilkan interstitial:', error);
      const cb = onDismissCallback;
      onDismissCallback = null;
      cb?.();
      preloadInterstitial();
    });
    return true;
  } catch (error) {
    console.warn('[AdMob] Gagal memanggil show():', error);
    onDismissCallback = null;
    onClose?.();
    preloadInterstitial();
    return false;
  }
}

/**
 * Menangani penambahan counter transaksi dan memunculkan iklan sesuai pola:
 * - Transaksi #1: Iklan
 * - Transaksi #2 & #3: Jeda
 * - Transaksi #4: Iklan
 * - Transaksi #5 & #6: Jeda
 * - Transaksi #7: Iklan
 */
export function handleTransactionSavedWithAd(
  db: SQLite.SQLiteDatabase,
  onFinish: () => void
): Promise<void> {
  return handleSavedWithAd(db, 'transaction', onFinish);
}

/** Satu preloader bersama, tetapi setiap kategori punya counter sendiri. */
export async function handleSavedWithAd(
  db: SQLite.SQLiteDatabase,
  category: AdSaveCategory,
  onFinish: () => void
): Promise<void> {
  let finished = false;
  let resolveFinished!: () => void;
  const completion = new Promise<void>(resolve => { resolveFinished = resolve; });
  const safeFinish = () => {
    if (!finished) {
      finished = true;
      try { onFinish(); } finally { resolveFinished(); }
    }
  };

  try {
    // Ambil riwayat jumlah simpan transaksi
    const counterKey = AD_COUNTER_KEYS[category];
    const currentCountStr = await getSetting(db, counterKey, '0');
    const currentCount = parseInt(currentCountStr, 10) || 0;
    const nextCount = currentCount + 1;

    // Simpan hitungan terbaru
    await setSetting(db, counterKey, nextCount.toString());

    // Periksa apakah transaksi ini waktunya muncul iklan
    const isAdTurn = shouldShowAd(nextCount);

    if (isAdTurn) {
      const shown = showInterstitialIfAvailable(safeFinish);
      if (!shown) {
        // Jika iklan belum ready atau offline, langsung lanjutkan tanpa delay
        safeFinish();
      }
      await completion;
    } else {
      safeFinish();
    }
  } catch (error) {
    console.warn('[AdMob] Gagal memproses counter iklan:', error);
    safeFinish();
  }
}
