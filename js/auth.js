/**
 * Authentication & Multi-Account Management Module
 * Manages user accounts, login, registration, and active account switching.
 * Every user account has an isolated data scope.
 */

const Auth = {
  KEYS: {
    USERS: 'smartgrocery_users_v2',
    ACTIVE_USER: 'smartgrocery_active_user_v2'
  },

  listeners: [],

  /**
   * Initialize accounts from seed data if not present
   */
  init() {
    let users = this.getAllUsers();
    if (!users || users.length === 0) {
      users = window.SEED_DATA && window.SEED_DATA.users ? [...window.SEED_DATA.users] : [];
      this.saveUsers(users);
    }

    // Ensure seed data exists for demo users in localStorage
    if (window.SEED_DATA) {
      const seedUsers = window.SEED_DATA.users || [];
      seedUsers.forEach(u => {
        const seedKey = `userData_${u.id}`;
        if (window.SEED_DATA[seedKey]) {
          const uData = window.SEED_DATA[seedKey];
          if (!localStorage.getItem(`smartgrocery_${u.id}_budget`)) {
            localStorage.setItem(`smartgrocery_${u.id}_budget`, JSON.stringify(uData.budgetSettings));
          }
          if (!localStorage.getItem(`smartgrocery_${u.id}_cart`)) {
            localStorage.setItem(`smartgrocery_${u.id}_cart`, JSON.stringify(uData.activeCart));
          }
          if (!localStorage.getItem(`smartgrocery_${u.id}_catalog`)) {
            localStorage.setItem(`smartgrocery_${u.id}_catalog`, JSON.stringify(uData.catalog));
          }
          if (!localStorage.getItem(`smartgrocery_${u.id}_history`)) {
            localStorage.setItem(`smartgrocery_${u.id}_history`, JSON.stringify(uData.history));
          }
          if (!localStorage.getItem(`smartgrocery_${u.id}_cart_discount`)) {
            localStorage.setItem(`smartgrocery_${u.id}_cart_discount`, JSON.stringify(uData.cartDiscount));
          }
        }
      });
    }

    // Check if explicitly logged out or requesting login page via URL parameter (?login=1)
    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const explicitlyLoggedOut = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('smartgrocery_logged_out') === '1') || 
                                (urlParams && (urlParams.get('auth') === 'login' || urlParams.get('login') === '1'));

    if (explicitlyLoggedOut) {
      this.setActiveUser(null);
    }

    // Clean up any legacy localStorage active user key so it never bypasses login across sessions
    try {
      localStorage.removeItem(this.KEYS.ACTIVE_USER);
    } catch (e) {}

    // Asynchronously synchronize with server database file /api/users
    this.syncWithServerDatabase();
  },

  async syncWithServerDatabase() {
    try {
      const resp = await fetch('./api/users');
      if (resp.ok) {
        const serverUsers = await resp.json();
        if (Array.isArray(serverUsers) && serverUsers.length > 0) {
          const localUsers = this.getAllUsers();
          const merged = [...localUsers];
          serverUsers.forEach(su => {
            if (!merged.some(lu => lu.email && lu.email.toLowerCase() === su.email.toLowerCase())) {
              merged.push(su);
            }
          });
          this.saveUsers(merged);
          if (window.UI) window.UI.render();
        }
      }
    } catch (e) {
      // Standalone / offline mode
    }
  },

  getAllUsers() {
    try {
      const data = localStorage.getItem(this.KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser() {
    try {
      let data = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem(this.KEYS.ACTIVE_USER) : null;
      if (!data && typeof localStorage !== 'undefined') {
        data = localStorage.getItem(this.KEYS.ACTIVE_USER);
      }
      if (!data) return null;
      let user = JSON.parse(data);

      // Auto-migrate Google users to unified deterministic ID across all devices
      if (user && user.email && (user.role === 'Google User' || user.email.includes('@'))) {
        const stableId = 'user_google_' + user.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (user.id !== stableId && !user.id.startsWith('user_rian') && !user.id.startsWith('user_aditya')) {
          const oldId = user.id;
          ['cart', 'budget', 'catalog', 'history', 'cart_discount'].forEach(k => {
            const oldVal = localStorage.getItem(`smartgrocery_${oldId}_${k}`);
            if (oldVal && !localStorage.getItem(`smartgrocery_${stableId}_${k}`)) {
              localStorage.setItem(`smartgrocery_${stableId}_${k}`, oldVal);
            }
          });
          user.id = stableId;
          this.setActiveUser(user);
        }
      }
      return user;
    } catch (e) {
      return null;
    }
  },

  setActiveUser(user) {
    if (user) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('smartgrocery_logged_out');
      }
      // Don't store plain password in active user session object
      const safeUser = {
        id: user.id,
        name: user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        role: user.role || 'Pengguna',
        avatarBg: user.avatarBg || 'bg-emerald-600',
        avatarLetter: (user.name || 'U').charAt(0).toUpperCase()
      };
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.KEYS.ACTIVE_USER, JSON.stringify(safeUser));
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.KEYS.ACTIVE_USER, JSON.stringify(safeUser));
      }
    } else {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(this.KEYS.ACTIVE_USER);
        sessionStorage.setItem('smartgrocery_logged_out', '1');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.KEYS.ACTIVE_USER);
      }
    }
    this.notifyAuthChange(user);
  },

  /**
   * Formal Login with strict validation:
   * 1. Requires existing account (must sign up first if not registered).
   * 2. Checks password match.
   */
  login(identifier, password = '') {
    if (!identifier || !identifier.trim()) {
      return { success: false, code: 'EMPTY_IDENTIFIER', message: 'Silakan ketik email atau nama akun Anda!' };
    }
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password ? String(password).trim() : '';

    let users = this.getAllUsers();
    if (!users || users.length === 0) {
      if (window.SEED_DATA && window.SEED_DATA.users) {
        users = [...window.SEED_DATA.users];
        this.saveUsers(users);
      } else {
        users = [];
      }
    }

    // 1. Exact match attempt
    let user = users.find(u => 
      (u.email && u.email.trim().toLowerCase() === cleanId) || 
      (u.name && u.name.trim().toLowerCase() === cleanId) ||
      (u.fullName && u.fullName.trim().toLowerCase() === cleanId) ||
      (u.id && u.id.trim().toLowerCase() === cleanId)
    );

    // 2. Partial match fallback (e.g. "Rian" in "Rian (Anak Rantau)")
    if (!user) {
      user = users.find(u => 
        (u.email && u.email.toLowerCase().includes(cleanId)) ||
        (u.name && u.name.toLowerCase().includes(cleanId)) ||
        (u.fullName && u.fullName.toLowerCase().includes(cleanId))
      );
    }

    // 3. Known Demo Alias Mapping
    if (!user) {
      if (cleanId === 'rian' || cleanId === 'rian@kost.id' || cleanId === 'user@grocerysafe.id' || cleanId === 'user_rian' || cleanId === 'pengguna' || cleanId === 'user') {
        user = users.find(u => u.id === 'user_rian');
      } else if (cleanId === 'aditya' || cleanId === 'aditya@kampus.id' || cleanId === 'aditya@grocerysafe.id' || cleanId === 'user_aditya') {
        user = users.find(u => u.id === 'user_aditya');
      }
    }

    // If account not found, REQUIRE sign up first!
    if (!user) {
      return { 
        success: false, 
        code: 'USER_NOT_FOUND', 
        message: 'Akun dengan email/nama ini belum terdaftar! Silakan klik tab "Daftar Akun Baru" terlebih dahulu untuk membuat akun.' 
      };
    }

    // Check password if set (Support user password or demo password 123)
    if (user.password && cleanPass) {
      const isDemoPass = cleanPass === '123' && (user.id === 'user_rian' || user.id === 'user_aditya' || user.password === '123');
      if (String(user.password).trim() !== cleanPass && !isDemoPass) {
        return { 
          success: false, 
          code: 'WRONG_PASSWORD', 
          message: 'Password salah! Periksa kembali password Anda atau gunakan akun demo (Password: 123).' 
        };
      }
    } else if (user.password && !cleanPass) {
      return {
        success: false,
        code: 'EMPTY_PASSWORD',
        message: 'Silakan masukkan password akun Anda!'
      };
    }

    this.setActiveUser(user);
    return { success: true, user, message: `Selamat datang kembali, ${user.name}!` };
  },

  /**
   * Register a new user with dedicated isolated storage
   */
  register({ id = null, name, email, password, role = 'Anak Kost', monthlyLimit = 500000, emergencyReserve = 50000, avatarUrl = '' }) {
    if (!name || !name.trim()) {
      return { success: false, message: 'Nama lengkap wajib diisi!' };
    }
    if (!email || !email.trim()) {
      return { success: false, message: 'Email wajib diisi!' };
    }
    if (!password || password.trim().length < 3) {
      return { success: false, message: 'Password minimal 3 karakter!' };
    }
    const users = this.getAllUsers();
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already taken
    if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.' };
    }

    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const userId = id || ('user_' + Date.now());

    const newUser = {
      id: userId,
      name: name.trim(),
      fullName: `${name.trim()} (${role.trim()})`,
      email: cleanEmail,
      password: password,
      role: role.trim(),
      avatarBg: randomColor,
      avatarLetter: name.trim().charAt(0).toUpperCase(),
      avatarUrl: avatarUrl || ''
    };

    users.push(newUser);
    this.saveUsers(users);

    // Persist newly registered user to server database
    try {
      fetch('./api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(() => {});
    } catch (e) {}

    // Initialize completely isolated data scope for this new user
    const userBudget = {
      monthlyLimit: parseFloat(monthlyLimit) || 500000,
      emergencyReserve: parseFloat(emergencyReserve) || 50000,
      userName: newUser.fullName
    };

    localStorage.setItem(`smartgrocery_${userId}_budget`, JSON.stringify(userBudget));
    localStorage.setItem(`smartgrocery_${userId}_cart`, JSON.stringify([]));
    localStorage.setItem(`smartgrocery_${userId}_catalog`, JSON.stringify([]));
    localStorage.setItem(`smartgrocery_${userId}_history`, JSON.stringify([]));
    localStorage.setItem(`smartgrocery_${userId}_cart_discount`, JSON.stringify({ type: 'none', value: 0 }));

    // Automatically set as active user
    this.setActiveUser(newUser);

    return { success: true, user: newUser, message: `Pendaftaran berhasil! Akun ${newUser.name} siap digunakan.` };
  },

  /**
   * Google OAuth Integration via Supabase
   */
  async loginWithGoogle() {
    if (!window.supabaseClient) {
      if (typeof window.initSupabaseClient === 'function') {
        window.initSupabaseClient();
      }
    }

    if (window.supabaseClient) {
      try {
        const redirectUri = window.location.origin + window.location.pathname;
        const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUri
          }
        });
        if (error) {
          console.warn('[Supabase Google OAuth]', error.message);
          return this.loginWithGoogleDemo();
        }
        return { success: true, data };
      } catch (e) {
        console.warn('[Supabase Google OAuth Exception]', e);
        return this.loginWithGoogleDemo();
      }
    }

    return this.loginWithGoogleDemo();
  },

  /**
   * Handle session returned from Supabase OAuth redirect
   */
  handleGoogleAuthSession(session) {
    if (!session || !session.user) return;
    const gUser = session.user;
    const email = gUser.email;
    if (!email) return;

    const fullName = (gUser.user_metadata && (gUser.user_metadata.full_name || gUser.user_metadata.name)) || email.split('@')[0];
    const avatarUrl = (gUser.user_metadata && gUser.user_metadata.avatar_url) || '';

    // Create a stable, deterministic user ID from Google account so it is IDENTICAL across all devices!
    const stableUserId = 'user_google_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    let users = this.getAllUsers();
    let existing = users.find(u => (u.email && u.email.toLowerCase() === email.toLowerCase()) || u.id === stableUserId);

    if (existing) {
      if (existing.id !== stableUserId) {
        const oldId = existing.id;
        ['cart', 'budget', 'catalog', 'history', 'cart_discount'].forEach(k => {
          const oldVal = localStorage.getItem(`smartgrocery_${oldId}_${k}`);
          if (oldVal && !localStorage.getItem(`smartgrocery_${stableUserId}_${k}`)) {
            localStorage.setItem(`smartgrocery_${stableUserId}_${k}`, oldVal);
          }
        });
        existing.id = stableUserId;
        this.saveUsers(users);
      }
    } else {
      // Auto-register user from verified Google OAuth with deterministic stable ID
      const res = this.register({
        id: stableUserId,
        name: fullName,
        email: email,
        password: 'google_oauth_verified_' + gUser.id,
        role: 'Google User',
        monthlyLimit: 500000,
        avatarUrl: avatarUrl
      });
      if (res.success) {
        existing = res.user;
      }
    }

    if (existing) {
      this.setActiveUser(existing);

      // Connect and sync with Supabase Cloud Realtime Database immediately
      if (window.SupabaseDB) {
        window.SupabaseDB.init();
        window.SupabaseDB.pullUserData(existing.id).then(() => {
          const currentCart = window.Store ? window.Store.getActiveCart() : [];
          if (!currentCart || currentCart.length === 0) {
            const starter = (typeof SEED_DATA !== 'undefined' && SEED_DATA.userData_user_rian)
              ? SEED_DATA.userData_user_rian.activeCart.map(item => ({ ...item }))
              : [];
            if (starter.length > 0 && window.Store) {
              window.Store.saveActiveCart(starter);
            }
          }
        });
      }

      if (window.UI) {
        window.UI.showToast(`✨ Berhasil masuk via Google: ${fullName}`);
        window.UI.render();
      }

      // Clean up OAuth tokens from URL hash
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  },

  /**
   * Quick simulated Google login for testing without waiting for cloud credentials
   */
  loginWithGoogleDemo() {
    const demoGoogleEmail = 'google.user@gmail.com';
    const demoName = 'Pengguna Google (Demo)';
    let users = this.getAllUsers();
    let existing = users.find(u => u.email && u.email.toLowerCase() === demoGoogleEmail);
    if (!existing) {
      const res = this.register({
        name: demoName,
        email: demoGoogleEmail,
        password: 'demo_google_pass',
        role: 'Akun Google Uji Lab',
        monthlyLimit: 500000
      });
      existing = res.user;
    }
    this.setActiveUser(existing);
    if (window.UI) {
      window.UI.showToast(`✨ Berhasil masuk via Google (Simulasi Lab): ${demoName}`);
      window.UI.render();
    }
    return { success: true, user: existing };
  },

  /**
   * Switch active account directly
   */
  switchAccount(userId) {
    let users = this.getAllUsers();
    let user = users.find(u => u.id === userId);
    if (!user && window.SEED_DATA && window.SEED_DATA.users) {
      user = window.SEED_DATA.users.find(u => u.id === userId);
      if (user) {
        users.push(user);
        this.saveUsers(users);
      }
    }
    if (user) {
      this.setActiveUser(user);
      return true;
    }
    return false;
  },

  /**
   * Logout user and return to login screen
   */
  logout() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('smartgrocery_logged_out', '1');
    }
    this.setActiveUser(null);
  },

  onAuthChange(fn) {
    this.listeners.push(fn);
  },

  notifyAuthChange(user) {
    this.listeners.forEach(fn => fn(user));
  }
};

window.Auth = Auth;
