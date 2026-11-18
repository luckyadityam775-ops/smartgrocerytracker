/**
 * Supabase Client Configuration & Google OAuth Module
 * Smart Grocery & Budget Safety Tracker
 * 
 * Project URL: https://pynraezkvnqtidmljdkk.supabase.co
 * Callback URL: https://pynraezkvnqtidmljdkk.supabase.co/auth/v1/callback
 */

const SUPABASE_PROJECT_URL = 'https://pynraezkvnqtidmljdkk.supabase.co';
const SUPABASE_CALLBACK_URL = 'https://pynraezkvnqtidmljdkk.supabase.co/auth/v1/callback';

window.SUPABASE_CONFIG = {
  url: SUPABASE_PROJECT_URL,
  callbackUrl: SUPABASE_CALLBACK_URL,
  getAnonKey() {
    return localStorage.getItem('supabase_anon_key') || window.__SUPABASE_ANON_KEY__ || '';
  },
  setAnonKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('supabase_anon_key', key.trim());
      return window.initSupabaseClient(key.trim());
    }
    return null;
  }
};

window.supabaseClient = null;

/**
 * Initialize Supabase Client instance
 */
window.initSupabaseClient = function(anonKey) {
  const key = anonKey || window.SUPABASE_CONFIG.getAnonKey();
  if (!key) {
    console.info('[Supabase] Anon Key belum diisi. Google OAuth dapat dikonfigurasi melalui modal pengaturan.');
    return null;
  }

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      window.supabaseClient = window.supabase.createClient(SUPABASE_PROJECT_URL, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log('[Supabase] Client berhasil diinisialisasi untuk project:', SUPABASE_PROJECT_URL);

      // Listen for OAuth redirect state changes
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('[Supabase Auth Event]', event, session);
        if (session && session.user && window.Auth && typeof window.Auth.handleGoogleAuthSession === 'function') {
          window.Auth.handleGoogleAuthSession(session);
        }
      });

      return window.supabaseClient;
    } catch (e) {
      console.warn('[Supabase] Gagal inisialisasi client:', e);
      return null;
    }
  }
  return null;
};

// Check for existing session or auth hash in URL when page loads
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', () => {
    const client = window.initSupabaseClient();
    if (client) {
      client.auth.getSession().then(({ data: { session }, error }) => {
        if (session && session.user && window.Auth && typeof window.Auth.handleGoogleAuthSession === 'function') {
          window.Auth.handleGoogleAuthSession(session);
        }
      }).catch(err => {
        console.warn('[Supabase] getSession error:', err);
      });
    }
  });
}
