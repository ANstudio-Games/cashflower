import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { AppRelease, parseRelease, RELEASES_API } from '@/utils/app-release';

export const installedVersion = Application.nativeApplicationVersion || Constants.expoConfig?.version || '0.0.0';

export async function checkAppUpdate(): Promise<AppRelease | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (response.status === 404) throw new Error('No public release available');
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    return parseRelease(await response.json(), installedVersion);
  } finally { clearTimeout(timeout); }
}

export async function downloadAndInstallUpdate(release: AppRelease, onProgress: (percent: number) => void): Promise<void> {
  if (Platform.OS !== 'android') throw new Error('Android only');
  const file = `${FileSystem.cacheDirectory}cashflower-update-${release.version}.apk`;
  await FileSystem.deleteAsync(file, { idempotent: true });
  const download = FileSystem.createDownloadResumable(release.url, file, {}, progress => {
    if (progress.totalBytesExpectedToWrite > 0) {
      onProgress(Math.min(100, Math.round(progress.totalBytesWritten / progress.totalBytesExpectedToWrite * 100)));
    }
  });
  try {
    const result = await download.downloadAsync();
    const info = await FileSystem.getInfoAsync(file);
    if (!result || result.status !== 200 || !info.exists || info.size !== release.size) {
      throw new Error('Incomplete APK download');
    }
    const uri = await FileSystem.getContentUriAsync(file);
    // Android validates the package signature and asks the user to approve installation.
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: uri,
      type: 'application/vnd.android.package-archive',
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    });
  } catch (error) {
    await FileSystem.deleteAsync(file, { idempotent: true });
    throw error;
  }
}
