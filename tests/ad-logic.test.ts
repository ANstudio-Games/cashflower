import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAdUnitId,
  AD_CONFIG,
} from '../src/config/ads';

describe('AdMob Configuration and Frequency Logic', () => {
  describe('getAdUnitId', () => {
    it('returns test interstitial ID when in development or test mode', () => {
      const interstitialId = getAdUnitId('interstitial', false);
      assert.ok(interstitialId);
      assert.match(interstitialId, /ca-app-pub-3940256099942544/);
    });

    it('uses configured production ID when isProd is true and prod ID is available', () => {
      const id = getAdUnitId('interstitial', true);
      assert.equal(id, 'ca-app-pub-2354120872211211/3632011796');
    });
  });

  describe('AD_CONFIG', () => {
    it('has valid App ID', () => {
      assert.equal(AD_CONFIG.appId, 'ca-app-pub-2354120872211211~1163007966');
    });
  });
});
