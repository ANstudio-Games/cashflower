import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import mobileAds, {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AD_COUNTER_KEYS, AdSaveCategory, getAdUnitId } from '@/config/ads';
import { processAdSave } from '@/utils/ad-save-policy';
import { getSetting, setSetting } from '@/db';

let isInitialized = false;
let interstitialInstance: InterstitialAd | null = null;
let isInterstitialLoaded = false;
let isInterstitialLoading = false;
let onDismissCallback: ((displayed: boolean) => void) | null = null;
let isInterstitialShowing = false;
let wasInterstitialOpened = false;
let saveQueue: Promise<void> = Promise.resolve();

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
  if (isInterstitialLoading || isInterstitialLoaded || isInterstitialShowing) return;

  const adUnitId = getAdUnitId('interstitial');

  if (!interstitialInstance) {
    interstitialInstance = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
      isInterstitialLoading = false;
      console.info('[AdMob] Interstitial ready');
    });

    interstitialInstance.addAdEventListener(AdEventType.OPENED, () => {
      wasInterstitialOpened = true;
      console.info('[AdMob] Interstitial opened');
    });

    interstitialInstance.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      isInterstitialLoading = false;

      isInterstitialShowing = false;
      const cb = onDismissCallback;
      onDismissCallback = null;
      cb?.(wasInterstitialOpened);

      // Preload iklan berikutnya
      preloadInterstitial();
    });

    interstitialInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      isInterstitialLoaded = false;
      isInterstitialLoading = false;
      console.warn('[AdMob] Interstitial Error:', error);
      isInterstitialShowing = false;
      const cb = onDismissCallback;
      onDismissCallback = null;
      cb?.(wasInterstitialOpened);

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
 * Returns true when show is requested; onClose reports whether OPENED was received.
 * Unavailable or failed ads report false so their due turn can be retried.
 */
export function showInterstitialIfAvailable(onClose?: (displayed: boolean) => void): boolean {
  if (Platform.OS === 'web' || !interstitialInstance || !isInterstitialLoaded || isInterstitialShowing) {
    console.info('[AdMob] Due ad deferred: not ready');
    onClose?.(false);
    preloadInterstitial();
    return false;
  }

  onDismissCallback = onClose || null;
  wasInterstitialOpened = false;
  isInterstitialShowing = true;

  try {
    isInterstitialLoaded = false;
    void interstitialInstance.show().catch(error => {
      console.warn('[AdMob] Gagal menampilkan interstitial:', error);
      const cb = onDismissCallback;
      onDismissCallback = null;
      isInterstitialShowing = false;
      cb?.(wasInterstitialOpened);
      preloadInterstitial();
    });
    return true;
  } catch (error) {
    console.warn('[AdMob] Gagal memanggil show():', error);
    onDismissCallback = null;
    isInterstitialShowing = false;
    onClose?.(wasInterstitialOpened);
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
 * Jika belum siap/gagal tampil, giliran tetap tertunda sampai simpan berikutnya.
 */
export function handleTransactionSavedWithAd(
  db: SQLite.SQLiteDatabase,
  onFinish: () => void
): Promise<void> {
  return handleSavedWithAd(db, 'transaction', onFinish);
}

/** Serialize shared SDK access and counter writes; retain each category's cadence. */
export async function handleSavedWithAd(
  db: SQLite.SQLiteDatabase,
  category: AdSaveCategory,
  onFinish: () => void
): Promise<void> {
  const operation = saveQueue.then(async () => {
    const counterKey = AD_COUNTER_KEYS[category];
    const stored = Number(await getSetting(db, counterKey, '0'));
    const currentCount = Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
    await processAdSave(
      currentCount,
      () => new Promise<boolean>(resolve => { showInterstitialIfAvailable(resolve); }),
      nextCount => setSetting(db, counterKey, String(nextCount)),
    );
  });
  // A failure must not poison subsequent saves.
  saveQueue = operation.catch(() => {});
  try {
    await operation;
  } catch (error) {
    console.warn('[AdMob] Gagal memproses counter iklan:', error);
  } finally {
    onFinish();
  }
}
