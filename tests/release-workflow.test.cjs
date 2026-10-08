const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configureAndroid } = require('../scripts/configure-ci-android.cjs');

test('CI signs release builds with secrets without changing debug signing', () => {
  const source = `android {
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
        }
    }
}`;
  const result = configureAndroid(source);
  assert.match(result, /debug\s*\{\s*signingConfig signingConfigs\.debug/);
  assert.match(result, /release\s*\{\s*signingConfig signingConfigs\.ciRelease/);
  for (const key of ['ANDROID_KEYSTORE_PATH', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD']) {
    assert.ok(result.includes(key));
  }
});

test('CI fails rather than silently using unexpected signing configuration', () => {
  assert.throws(() => configureAndroid(''), /buildTypes/);
  assert.throws(() => configureAndroid('    buildTypes { release {} }'), /signing/);
});
