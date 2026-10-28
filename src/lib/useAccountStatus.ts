import { useCallback, useRef, useState } from 'react';
import { ApiError, apiRequest, errorMessage } from './api';
import { useSession, useUser } from './session';
import type { User } from './types';

const statusKeyOf = (user: User) => `${user.status}:${user.deactivatedBy ?? ''}`;

/**
 * Pause and resume your own account. Shared by Home and Account so both behave
 * the same: one request at a time, and if the server refuses because the status
 * changed elsewhere (e.g. the team paused the account), the user is reloaded so
 * the screen shows the real state.
 */
export function useAccountStatus(onChanged?: () => Promise<unknown> | void) {
  const { setUser } = useSession();
  const user = useUser();
  const [busy, setBusy] = useState(false);
  // Each message is tied to the account status it describes and is only shown while that status holds,
  // so it disappears if the status moves on (e.g. the team later reactivates the account).
  const [error, setError] = useState<{ message: string; statusKey: string } | null>(null);
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
          // The status changed elsewhere: reload the user and anything derived from it (e.g. the summary).
          let statusKey = statusKeyOf(user);
          try {
            const fresh = await apiRequest<User>('/me');
            setUser(fresh);
            statusKey = statusKeyOf(fresh);
          } catch {
            // Keep the current state; pull-to-refresh will catch up.
          }
          await onChanged?.();
          const message = err.status === 403 ? err.message : 'Your account status changed in the meantime, so we’ve refreshed it.';
          setError({ message, statusKey });
        } else {
          setError({ message: errorMessage(err), statusKey: statusKeyOf(user) });
        }
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [setUser, user, onChanged],
  );

  const visibleError = error && error.statusKey === statusKeyOf(user) ? error.message : null;
  return { busy, error: visibleError, pause: () => change('pause'), resume: () => change('resume') };
}
