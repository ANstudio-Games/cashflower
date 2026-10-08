const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configureAndroid } = require('../scripts/configure-ci-android.cjs');
const { readFileSync } = require('node:fs');

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

test('signing key path is initialized at step runtime before restoring the key', () => {
  const workflow = readFileSync('.github/workflows/android-release.yml', 'utf8');
  assert.doesNotMatch(workflow, /ANDROID_KEYSTORE_PATH:.*runner\.temp/);
  assert.match(workflow, /ANDROID_KEYSTORE_PATH=\$RUNNER_TEMP\/cashflower-release\.keystore/);
  assert.ok(workflow.indexOf('name: Set signing key path') < workflow.indexOf('name: Restore signing key'));
});

test('CI fails rather than silently using unexpected signing configuration', () => {
  assert.throws(() => configureAndroid(''), /buildTypes/);
  assert.throws(() => configureAndroid('    buildTypes { release {} }'), /signing/);
});
