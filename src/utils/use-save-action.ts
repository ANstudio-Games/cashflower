import { useRef, useState } from 'react';
import { createSaveGuard } from './save-guard';

export function useSaveAction() {
  const guard = useRef(createSaveGuard()).current;
  const [isSaving, setIsSaving] = useState(false);
  const runSave = (task: () => Promise<void>) => guard(async () => {
    setIsSaving(true);
    try {
      await task();
    } finally {
      setIsSaving(false);
    }
  });
  return { isSaving, runSave };
}
