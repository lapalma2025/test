/**
 * useAuth.ts — hook do śledzenia stanu sesji Supabase Auth.
 */

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

export interface AuthState {
  session: Session | null;
  user: Session['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isLoading,
    isAuthenticated: Boolean(session),
  };
}
