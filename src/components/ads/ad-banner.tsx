import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '@/config/ads';
import { colors } from '@/theme/colors';

interface AdBannerProps {
  size?: BannerAdSize;
  style?: any;
}

export default function AdBanner({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style,
}: AdBannerProps) {
  const insets = useSafeAreaInsets();
  const [hasError, setHasError] = useState(false);

  // Jangan render di Web atau jika terjadi error pemuatan
  if (Platform.OS === 'web' || hasError) {
    return null;
  }

  const adUnitId = getAdUnitId('banner');
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 4 : 2);

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdFailedToLoad={(error) => {
          console.warn('[AdMob] Banner gagal dimuat:', error);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    overflow: 'hidden',
  },
});
