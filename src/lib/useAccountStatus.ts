import { useCallback, useRef, useState } from 'react';
import { ApiError, apiRequest, errorMessage } from './api';
import { useSession } from './session';
import type { User } from './types';

/**
 * Pause and resume your own account. Shared by Home and Account so both behave
 * the same: one request at a time, and if the server refuses because the status
 * changed elsewhere (e.g. the team paused the account), the user is reloaded so
 * the screen shows the real state.
 */
export function useAccountStatus(onChanged?: () => Promise<unknown> | void) {
  const { setUser, refreshUser } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const change = useCallback(
    async (action: 'pause' | 'resume') => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(true);
      setError(null);
      try {
        setUser(await apiRequest<User>(`/me/${action}`, { method: 'POST', body: {} }));
        await onChanged?.();
      } catch (err) {
        if (err instanceof ApiError && (err.code === 'INVALID_TRANSITION' || err.status === 403)) {
          await refreshUser().catch(() => undefined);
          setError(err.status === 403 ? err.message : 'Your account status changed in the meantime, so we’ve refreshed it.');
        } else {
          setError(errorMessage(err));
        }
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [setUser, refreshUser, onChanged],
  );

  return { busy, error, pause: () => change('pause'), resume: () => change('resume') };
}
