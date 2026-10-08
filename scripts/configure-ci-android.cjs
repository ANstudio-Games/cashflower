const fs = require('node:fs');

function configureAndroid(source) {
  const marker = '    buildTypes {';
  if (!source.includes(marker)) throw new Error('Android buildTypes block not found');
  const releasePattern = /(release\s*\{\s*)signingConfig signingConfigs\.debug/;
  if (!releasePattern.test(source)) throw new Error('Expected Expo release signing configuration not found');
  const signing = `    signingConfigs {
        ciRelease {
            storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
    }
`;
  return source.replace(marker, signing + marker)
    .replace(releasePattern, '$1signingConfig signingConfigs.ciRelease');
}

module.exports = { configureAndroid };
if (require.main === module) {
  const file = 'android/app/build.gradle';
  fs.writeFileSync(file, configureAndroid(fs.readFileSync(file, 'utf8')));
}
