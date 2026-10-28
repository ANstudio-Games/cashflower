const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configureAndroid } = require('../scripts/configure-ci-android.cjs');
const { readFileSync } = require('node:fs');

test('2.1.0 release versions are synchronized with Android build 15', () => {
  const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  for (const version of [app.version, pkg.version, lock.version, lock.packages[''].version]) {
    assert.equal(version, '2.1.0');
  }
  assert.equal(app.android.versionCode, 15);
  const gradle = readFileSync('android/app/build.gradle', 'utf8');
  assert.match(gradle, /versionName "2\.1\.0"/);
  assert.match(gradle, /versionCode 15\b/);
});

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

test('release signing accepts Expo template comments before signingConfig', () => {
  const source = `android {
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, generate your own keystore.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
        }
    }
}`;
  const result = configureAndroid(source);
  assert.match(result, /signingConfig signingConfigs.ciRelease/);
  assert.match(result, /debug\s*\{\s*signingConfig signingConfigs.debug/);
});

test('Android setup does not request the obsolete tools package', () => {
  const workflow = readFileSync('.github/workflows/android-release.yml', 'utf8');
  assert.match(workflow, /uses: android-actions\/setup-android@v3\s+with:[\s\S]*?packages: platform-tools/);
});

test('signing key path is initialized at step runtime before restoring the key', () => {
  const workflow = readFileSync('.github/workflows/android-release.yml', 'utf8');
  assert.doesNotMatch(workflow, /ANDROID_KEYSTORE_PATH:.*runner\.temp/);
  assert.match(workflow, /ANDROID_KEYSTORE_PATH=\$RUNNER_TEMP\/cashflower-release\.keystore/);
  assert.ok(workflow.indexOf('name: Set signing key path') < workflow.indexOf('name: Restore signing key'));
});

test('CI builds compressed ARM64 and universal APKs and preserves updater asset naming', () => {
  const workflow = readFileSync('.github/workflows/android-release.yml', 'utf8');
  assert.match(workflow, /-PreactNativeArchitectures=arm64-v8a\s+-Pexpo\.useLegacyPackaging=true/);
  assert.match(workflow, /-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64\s+-Pexpo\.useLegacyPackaging=true/);
  assert.match(workflow, /cashflower-\$\{VERSION\}\.apk/);
  assert.match(workflow, /cashflower-\$\{VERSION\}-arm64\.apk/);
  assert.match(workflow, /for APK in release\/\*\.apk/);
  assert.match(workflow, /sha256sum \*\.apk > SHA256SUMS\.txt/);
  assert.match(workflow, /release\/\*\.apk release\/SHA256SUMS\.txt/);
  const primary = workflow.indexOf('"../release/cashflower-${VERSION}-arm64.apk"');
  const universal = workflow.indexOf('-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64');
  assert.ok(primary > 0 && primary < universal, 'copy ARM64 artifact before the universal build overwrites it');
});

test('CI fails rather than silently using unexpected signing configuration', () => {
  assert.throws(() => configureAndroid(''), /buildTypes/);
  assert.throws(() => configureAndroid('    buildTypes { release {} }'), /signing/);
});
