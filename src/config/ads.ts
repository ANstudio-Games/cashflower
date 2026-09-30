export const AD_CONFIG = {
  appId: 'ca-app-pub-2354120872211211~1163007966',
  // Masukkan Unit ID asli kamu saat sudah dibuat di dashboard AdMob
  production: {
    bannerId: '', // Contoh: 'ca-app-pub-2354120872211211/1234567890'
    interstitialId: '', // Contoh: 'ca-app-pub-2354120872211211/0987654321'
  },
  // Official Google Test IDs (Aman untuk testing & dev)
  test: {
    bannerId: 'ca-app-pub-3940256099942544/6300978111',
    interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  },
};

/**
 * Aturan kemunculan iklan:
 * - Transaksi #1 (pertama kali): Muncul iklan
 * - Transaksi #2 & #3: Jeda (2x transaksi)
 * - Transaksi #4: Muncul iklan
 * - Transaksi #5 & #6: Jeda
 * - Transaksi #7: Muncul iklan
 */
export function shouldShowAd(saveCount: number): boolean {
  if (saveCount <= 0) return false;
  if (saveCount === 1) return true;
  return (saveCount - 1) % 3 === 0;
}

export function getAdUnitId(type: 'banner' | 'interstitial', isProd?: boolean): string {
  const isProduction =
    isProd !== undefined ? isProd : typeof __DEV__ !== 'undefined' ? !__DEV__ : false;

  if (isProduction) {
    const prodId =
      type === 'banner'
        ? AD_CONFIG.production.bannerId
        : AD_CONFIG.production.interstitialId;
    if (prodId && prodId.trim() !== '') {
      return prodId;
    }
  }

  return type === 'banner' ? AD_CONFIG.test.bannerId : AD_CONFIG.test.interstitialId;
}
