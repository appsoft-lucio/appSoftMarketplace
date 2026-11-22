import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { authConfigured, getAuthClient } from "./client";

interface AuthState {
  session: Session | null;
  loading: boolean;
  recovery: boolean;
  linkError: boolean;
  finishRecovery: () => void;
}
const Context = createContext<AuthState | null>(null);
const recoveryKey = "appsoft.recovery-user";
function rememberRecovery(userId: string | null) {
  try {
    if (userId) sessionStorage.setItem(recoveryKey, userId);
    else sessionStorage.removeItem(recoveryKey);
  } catch { /* A navegação funciona mesmo sem armazenamento da aba. */ }
}
function isRecoverySession(session: Session | null) {
  try { return Boolean(session && sessionStorage.getItem(recoveryKey) === session.user.id); }
  catch { return false; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authConfigured);
  const [recovery, setRecovery] = useState(false);
  const [linkError, setLinkError] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    return query.has("error") || hash.has("error");
  });
  useEffect(() => {
    if (!authConfigured) return;
    let active = true;
    let observedEvent = false;
    let initialized = false;
    const client = getAuthClient();
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      observedEvent = true;
      if (event === "PASSWORD_RECOVERY" && next) {
        rememberRecovery(next.user.id);
        setRecovery(true);
        setLinkError(false);
      } else if (event === "SIGNED_OUT") {
        rememberRecovery(null);
        setRecovery(false);
      } else {
        setRecovery(isRecoverySession(next));
      }
      setSession(next);
      if (initialized) setLoading(false);
    });
    void client.auth.initialize().then(async (initialization) => {
      if (initialization.error && active) setLinkError(true);
      return client.auth.getSession();
    }).then(({ data, error }) => {
      initialized = true;
      if (!active) return;
      if (error) setLinkError(true);
      if (!observedEvent) {
        setSession(data.session);
        setRecovery(isRecoverySession(data.session));
      }
      setLoading(false);
    }).catch(() => { if (active) { setLinkError(true); setLoading(false); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  const finishRecovery = () => { rememberRecovery(null); setRecovery(false); };
  return <Context.Provider value={{ session, loading, recovery, linkError, finishRecovery }}>{children}</Context.Provider>;
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider ausente.");
  return context;
}