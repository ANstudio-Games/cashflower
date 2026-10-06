// Acquire synchronously: React state alone cannot stop two taps in one render.
export function createSaveGuard() {
  let busy = false;
  return async (task: () => Promise<void>): Promise<void> => {
    if (busy) return;
    busy = true;
    try {
      await task();
    } finally {
      busy = false;
    }
  };
}
