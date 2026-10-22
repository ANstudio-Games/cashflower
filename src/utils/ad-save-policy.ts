/** One display attempt per new record. No cooldown, persisted turns, or retries. */
export async function processAdSave(show: () => Promise<boolean>): Promise<void> {
  await show();
}
