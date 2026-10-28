import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import mobileAds, {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AdSaveCategory, getAdUnitId } from '@/config/ads';
import { processAdSave } from '@/utils/ad-save-policy';

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

      // No background retry; the next save can request a fresh preload.
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
 * Unavailable or failed ads are skipped without retaining a pending turn.
 */
export function showInterstitialIfAvailable(onClose?: (displayed: boolean) => void): boolean {
  if (Platform.OS === 'web' || !interstitialInstance || !isInterstitialLoaded || isInterstitialShowing) {
    console.info('[AdMob] Save ad skipped: not ready');
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
    });
    return true;
  } catch (error) {
    console.warn('[AdMob] Gagal memanggil show():', error);
    onDismissCallback = null;
    isInterstitialShowing = false;
    onClose?.(wasInterstitialOpened);
    return false;
  }
}

/** Attempt an interstitial after each created or edited transaction. */
export function handleTransactionSavedWithAd(
  db: SQLite.SQLiteDatabase,
  onFinish: () => void
): Promise<void> {
  return handleSavedWithAd(db, 'transaction', onFinish);
}

/** Serialize shared SDK access. Every category attempts an ad on every successful save. */
export async function handleSavedWithAd(
  _db: SQLite.SQLiteDatabase,
  category: AdSaveCategory,
  onFinish: () => void
): Promise<void> {
  const operation = saveQueue.then(async () => {
    console.info(`[AdMob] Saved ${category} record: attempting interstitial`);
    await processAdSave(
      () => new Promise<boolean>(resolve => { showInterstitialIfAvailable(resolve); }),
    );
  });
  // A failure must not poison subsequent saves.
  saveQueue = operation.catch(() => {});
  try {
    await operation;
  } catch (error) {
    console.warn('[AdMob] Gagal menampilkan iklan setelah simpan:', error);
  } finally {
    onFinish();
  }
}
