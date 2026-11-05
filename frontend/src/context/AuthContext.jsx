import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import api from '../services/api';

const AuthContext = createContext(null);

function withTimeout(promise, ms = 4000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), ms)
    )
  ]);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Restaurar sesión local guardada al instante (evita bloqueos si Supabase está Unhealthy)
        const savedToken = localStorage.getItem('supabase_token');
        const savedUser = localStorage.getItem('docuflow_user');
        if (savedToken && savedUser) {
          try {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          } catch (e) {}
        }

        // 2. Sincronizar con Supabase con timeout de seguridad (4s)
        if (isSupabaseConfigured() && supabase) {
          try {
            const { data: { session } } = await withTimeout(supabase.auth.getSession(), 4000);
            if (session) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                company_name: session.user.user_metadata?.company_name || 'Mi Empresa'
              };
              setToken(session.access_token);
              setUser(userData);
              localStorage.setItem('supabase_token', session.access_token);
              localStorage.setItem('docuflow_user', JSON.stringify(userData));
            }
          } catch (e) {
            console.warn("Supabase getSession timeout/unhealthy, usando sesión de respaldo:", e.message);
          }

          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                company_name: session.user.user_metadata?.company_name || 'Mi Empresa'
              };
              setToken(session.access_token);
              setUser(userData);
              localStorage.setItem('supabase_token', session.access_token);
              localStorage.setItem('docuflow_user', JSON.stringify(userData));
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error("Error al inicializar sesión:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const refreshBilling = async () => {
    try {
      const res = await api.get('/billing/status');
      setBillingStatus(res.data);
      return res.data;
    } catch (err) {
      console.warn("No se pudo obtener el estado de facturación:", err);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      refreshBilling();
    } else {
      setBillingStatus(null);
    }
  }, [user]);

  const login = async (email, password) => {
    // 1. Intentar con Supabase Cloud (con timeout rápido de 4.5s por si está Unhealthy)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          4500
        );
        if (!error && data?.session) {
          const session = data.session;
          const userData = {
            id: session.user.id,
            email: session.user.email,
            company_name: session.user.user_metadata?.company_name || 'Mi Empresa'
          };
          setToken(session.access_token);
          setUser(userData);
          localStorage.setItem('supabase_token', session.access_token);
          localStorage.setItem('docuflow_user', JSON.stringify(userData));
          return data;
        }
      } catch (supaErr) {
        console.warn("Supabase Auth no disponible o lento, activando fallback local:", supaErr.message);
      }
    }

    // 2. Fallback automático contra el Backend PostgreSQL (/auth/login)
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('supabase_token', access_token);
    localStorage.setItem('docuflow_user', JSON.stringify(userData));
    return { session: { access_token }, user: userData };
  };

  const register = async (email, password, companyName) => {
    // 1. Intentar con Supabase Cloud (con timeout de 4.5s)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: { company_name: companyName }
            }
          }),
          4500
        );
        if (!error && data?.session) {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            company_name: companyName
          };
          setToken(data.session.access_token);
          setUser(userData);
          localStorage.setItem('supabase_token', data.session.access_token);
          localStorage.setItem('docuflow_user', JSON.stringify(userData));
          return data;
        }
      } catch (supaErr) {
        console.warn("Supabase SignUp timeout/unhealthy, usando registro local:", supaErr.message);
      }
    }

    // 2. Fallback automático contra el Backend PostgreSQL (/auth/register)
    const res = await api.post('/auth/register', {
      email,
      password,
      company_name: companyName
    });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('supabase_token', access_token);
    localStorage.setItem('docuflow_user', JSON.stringify(userData));
    return { session: { access_token }, user: userData };
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await withTimeout(supabase.auth.signOut(), 2000);
      } catch (e) {}
    }
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('docuflow_user');
    setUser(null);
    setToken(null);
    setBillingStatus(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      billingStatus,
      refreshBilling,
      login,
      register,
      logout,
      loading,
      isAuthenticated: Boolean(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
