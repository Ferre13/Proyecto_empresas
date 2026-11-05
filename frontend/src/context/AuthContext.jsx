import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión inicial
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setToken(session.access_token);
            setUser({
              id: session.user.id,
              email: session.user.email,
              company_name: session.user.user_metadata?.company_name || 'Mi Empresa'
            });
            localStorage.setItem('supabase_token', session.access_token);
          }
          
          // Escuchar cambios de estado en Supabase
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              setToken(session.access_token);
              setUser({
                id: session.user.id,
                email: session.user.email,
                company_name: session.user.user_metadata?.company_name || 'Mi Empresa'
              });
              localStorage.setItem('supabase_token', session.access_token);
            } else {
              setToken(null);
              setUser(null);
              localStorage.removeItem('supabase_token');
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Modo local/desarrollo: comprobar sesión guardada
          const savedToken = localStorage.getItem('supabase_token');
          const savedUser = localStorage.getItem('docuflow_user');
          if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (err) {
        console.error("Error al inicializar sesión:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Consultar el estado de facturación cuando el usuario está logueado
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
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const session = data.session;
      setToken(session.access_token);
      const userData = {
        id: session.user.id,
        email: session.user.email,
        company_name: session.user.user_metadata?.company_name || 'Mi Empresa'
      };
      setUser(userData);
      localStorage.setItem('supabase_token', session.access_token);
      localStorage.setItem('docuflow_user', JSON.stringify(userData));
      return data;
    } else {
      throw new Error("El servicio de autenticación de Supabase no está disponible.");
    }
  };

  const register = async (email, password, companyName) => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { company_name: companyName }
        }
      });
      if (error) throw error;
      if (data.session) {
        setToken(data.session.access_token);
        const userData = {
          id: data.user.id,
          email: data.user.email,
          company_name: companyName
        };
        setUser(userData);
        localStorage.setItem('supabase_token', data.session.access_token);
        localStorage.setItem('docuflow_user', JSON.stringify(userData));
      }
      return data;
    } else {
      throw new Error("El servicio de autenticación de Supabase no está disponible.");
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
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
