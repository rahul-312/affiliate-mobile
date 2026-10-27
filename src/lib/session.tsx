import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, setAuthToken, setUnauthorizedHandler } from './api';
import type { AuthResponse, PromotionChannel, User } from './types';

// The JWT lives in the Android Keystore-backed SecureStore, never in plain AsyncStorage.
const TOKEN_KEY = 'affiliate-hub.token';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  promotionChannel: PromotionChannel;
  promotionUrl?: string;
}

interface SessionValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

async function persistToken(token: string | null) {
  setAuthToken(token);
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    setUser(null);
    await persistToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    let cancelled = false;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return;
        setAuthToken(token);
        const me = await apiRequest<User>('/me');
        if (!cancelled) setUser(me);
      } catch {
        // Invalid/expired token or offline at launch: start signed out rather than hang.
        if (!cancelled) await persistToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  const startSession = useCallback(async ({ token, user: next }: AuthResponse) => {
    if (next.role !== 'affiliate') {
      throw new Error('This app is for affiliates. Ops and finance should use the dashboard.');
    }
    await persistToken(token);
    setUser(next);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) =>
      startSession(await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
    [startSession],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => startSession(await apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body: input })),
    [startSession],
  );

  const refreshUser = useCallback(async () => {
    setUser(await apiRequest<User>('/me'));
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut, refreshUser, setUser }),
    [user, isLoading, signIn, signUp, signOut, refreshUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

/** For screens inside the signed-in stack, where a user is guaranteed by the route guard. */
export function useUser(): User {
  const { user } = useSession();
  if (!user) throw new Error('useUser called outside the signed-in area');
  return user;
}
