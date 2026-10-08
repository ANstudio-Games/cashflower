export const RELEASES_URL = 'https://github.com/ANstudio-Games/CashFlower/releases';
export const RELEASES_API = 'https://api.github.com/repos/ANstudio-Games/CashFlower/releases/latest';

export interface AppRelease { version: string; url: string; size: number }

export function isNewerVersion(candidate: string, installed: string): boolean {
  const parse = (value: string) => {
    if (!/^v?\d+\.\d+\.\d+$/.test(value)) throw new Error('Invalid version');
    return value.replace(/^v/, '').split('.').map(Number);
  };
  const a = parse(candidate);
  const b = parse(installed);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

export function parseRelease(data: any, installed: string): AppRelease | null {
  if (data.draft || data.prerelease || !isNewerVersion(data.tag_name, installed)) return null;
  const version = data.tag_name.replace(/^v/, '');
  const asset = data.assets?.find((item: any) => item.name === `cashflower-${version}.apk`);
  const prefix = `${RELEASES_URL}/download/${data.tag_name}/`;
  if (!asset || typeof asset.browser_download_url !== 'string' ||
      !asset.browser_download_url.startsWith(prefix) || !Number.isSafeInteger(asset.size) || asset.size <= 0) {
    throw new Error('Release has no supported APK');
  }
  return { version, url: asset.browser_download_url, size: asset.size };
}
