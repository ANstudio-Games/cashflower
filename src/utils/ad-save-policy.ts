import { shouldShowAd } from '../config/ads';

/** Keep a due turn pending until the SDK confirms an ad was actually displayed. */
export async function processAdSave(
  currentCount: number,
  show: () => Promise<boolean>,
  persist: (nextCount: number) => Promise<void>,
): Promise<void> {
  const nextCount = currentCount + 1;
  if (!shouldShowAd(nextCount) || await show()) {
    await persist(nextCount);
  }
}
