import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldShowAd,
  getAdUnitId,
  AD_CONFIG,
} from '../src/config/ads';

describe('AdMob Configuration and Frequency Logic', () => {
  describe('shouldShowAd', () => {
    it('shows ad on the very first transaction save (#1)', () => {
      assert.equal(shouldShowAd(1), true);
    });

    it('skips the next 2 transactions (#2 and #3)', () => {
      assert.equal(shouldShowAd(2), false);
      assert.equal(shouldShowAd(3), false);
    });

    it('shows ad on transaction #4', () => {
      assert.equal(shouldShowAd(4), true);
    });

    it('skips transactions #5 and #6', () => {
      assert.equal(shouldShowAd(5), false);
      assert.equal(shouldShowAd(6), false);
    });

    it('shows ad on transaction #7 and #10', () => {
      assert.equal(shouldShowAd(7), true);
      assert.equal(shouldShowAd(10), true);
    });

    it('returns false for non-positive numbers', () => {
      assert.equal(shouldShowAd(0), false);
      assert.equal(shouldShowAd(-1), false);
    });
  });

  describe('getAdUnitId', () => {
    it('returns test interstitial ID when in development or test mode', () => {
      const interstitialId = getAdUnitId('interstitial', false);
      assert.ok(interstitialId);
      assert.match(interstitialId, /ca-app-pub-3940256099942544/);
    });

    it('uses configured production ID when isProd is true and prod ID is available', () => {
      const id = getAdUnitId('interstitial', true);
      assert.ok(id);
    });
  });

  describe('AD_CONFIG', () => {
    it('has valid App ID', () => {
      assert.equal(AD_CONFIG.appId, 'ca-app-pub-2354120872211211~1163007966');
    });
  });
});
