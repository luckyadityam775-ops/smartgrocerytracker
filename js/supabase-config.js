/**
 * Supabase Client Configuration & Google OAuth Module
 * Smart Grocery & Budget Safety Tracker
 * 
 * Project URL: https://neehtpmqsgdnxijxuswq.supabase.co
 * Callback URL: https://neehtpmqsgdnxijxuswq.supabase.co/auth/v1/callback
 */

const SUPABASE_PROJECT_URL = 'https://neehtpmqsgdnxijxuswq.supabase.co';
const SUPABASE_CALLBACK_URL = 'https://neehtpmqsgdnxijxuswq.supabase.co/auth/v1/callback';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZWh0cG1xc2dkbnhpanh1c3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwMDA2NTMsImV4cCI6MjExMDU3NjY1M30.XWD2aPhNVnlsm2Efs2znCswbhLG-UccsI9tH0iKv4Iw';

// Always make sure anon key is cached in localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('supabase_anon_key', SUPABASE_ANON_KEY);
}

window.SUPABASE_CONFIG = {
  url: SUPABASE_PROJECT_URL,
  callbackUrl: SUPABASE_CALLBACK_URL,
  anonKey: SUPABASE_ANON_KEY,
  getAnonKey() {
    return SUPABASE_ANON_KEY;
  },
  setAnonKey(key) {
    const activeKey = (key && key.trim()) ? key.trim() : SUPABASE_ANON_KEY;
    localStorage.setItem('supabase_anon_key', activeKey);
    return window.initSupabaseClient(activeKey);
  }
};

window.supabaseClient = null;

/**
 * Initialize Supabase Client instance
 */
window.initSupabaseClient = function(anonKey) {
  const key = anonKey || window.SUPABASE_CONFIG.getAnonKey();
  if (!key) {
    console.warn('[Supabase] Anon Key belum tersedia.');
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

// Immediately attempt initialization
if (typeof window !== 'undefined') {
  window.initSupabaseClient();

  // Retry poller in case Supabase CDN script loads asynchronously
  if (!window.supabaseClient) {
    let retries = 0;
    const retryTimer = setInterval(() => {
      retries++;
      const client = window.initSupabaseClient();
      if (client || retries > 30) {
        clearInterval(retryTimer);
        if (client) {
          if (window.SupabaseDB && !window.SupabaseDB.isReady) {
            window.SupabaseDB.init();
          }
          if (window.UI) {
            window.UI.render();
          }
        }
      }
    }, 100);
  }
}

// Check for existing session or auth hash in URL when page loads
function checkSupabaseSession() {
  const client = window.supabaseClient || window.initSupabaseClient();
  if (client && client.auth) {
    client.auth.getSession().then(({ data: { session }, error }) => {
      if (session && session.user && window.Auth && typeof window.Auth.handleGoogleAuthSession === 'function') {
        window.Auth.handleGoogleAuthSession(session);
      }
    }).catch(err => {
      console.warn('[Supabase] getSession error:', err);
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSupabaseSession);
  } else {
    checkSupabaseSession();
  }
}
