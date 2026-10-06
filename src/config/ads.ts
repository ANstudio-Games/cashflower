export const AD_CONFIG = {
  appId: 'ca-app-pub-2354120872211211~1163007966',
  production: {
    interstitialId: 'ca-app-pub-2354120872211211/3632011796',
  },
  // Official Google Test IDs (Aman untuk testing & dev)
  test: {
    interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  },
};

// Counter terpisah; transaksi lama tetap memakai key yang sama.
export const AD_COUNTER_KEYS = {
  transaction: 'ad_tx_save_count',
  debt: 'ad_debt_save_count',
  trading: 'ad_trading_save_count',
} as const;

export type AdSaveCategory = keyof typeof AD_COUNTER_KEYS;

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

export function getAdUnitId(type: 'interstitial' = 'interstitial', isProd?: boolean): string {
  const isProduction =
    isProd !== undefined ? isProd : typeof __DEV__ !== 'undefined' ? !__DEV__ : false;

  if (isProduction) {
    const prodId = AD_CONFIG.production.interstitialId;
    if (prodId && prodId.trim() !== '') {
      return prodId;
    }
  }

  return AD_CONFIG.test.interstitialId;
}
