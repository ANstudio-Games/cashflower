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

export type AdSaveCategory = 'transaction' | 'debt' | 'trading';

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
