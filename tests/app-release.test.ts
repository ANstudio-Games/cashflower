import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNewerVersion, parseRelease, RELEASES_URL } from '../src/utils/app-release';

const release = (version: string) => ({
  tag_name: `v${version}`, draft: false, prerelease: false,
  assets: [{ name: `cashflower-${version}.apk`, size: 100,
    browser_download_url: `${RELEASES_URL}/download/v${version}/cashflower-${version}.apk` }],
});

test('compares numeric app versions rather than strings', () => {
  assert.ok(isNewerVersion('v1.10.0', '1.9.0'));
  assert.ok(!isNewerVersion('1.8.0', '1.8.0'));
  assert.ok(!isNewerVersion('1.7.9', '1.8.0'));
  assert.throws(() => isNewerVersion('1.9.0-beta', '1.8.0'));
});
test('only offers newer stable releases with the expected APK', () => {
  assert.equal(parseRelease(release('1.8.0'), '1.8.0'), null);
  assert.equal(parseRelease({ ...release('1.9.0'), prerelease: true }, '1.8.0'), null);
  assert.equal(parseRelease(release('1.9.0'), '1.8.0')?.version, '1.9.0');
  assert.throws(() => parseRelease({ ...release('1.9.0'), assets: [] }, '1.8.0'));
  const bad = release('1.9.0');
  bad.assets[0].browser_download_url = 'https://evil.example/app.apk';
  assert.throws(() => parseRelease(bad, '1.8.0'));
});
