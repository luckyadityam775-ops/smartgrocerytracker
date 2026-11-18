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

      // Seed data for each initial user
      users.forEach(user => {
        const seedKey = `userData_${user.id}`;
        if (window.SEED_DATA && window.SEED_DATA[seedKey]) {
          const uData = window.SEED_DATA[seedKey];
          localStorage.setItem(`smartgrocery_${user.id}_budget`, JSON.stringify(uData.budgetSettings));
          localStorage.setItem(`smartgrocery_${user.id}_cart`, JSON.stringify(uData.activeCart));
          localStorage.setItem(`smartgrocery_${user.id}_catalog`, JSON.stringify(uData.catalog));
          localStorage.setItem(`smartgrocery_${user.id}_history`, JSON.stringify(uData.history));
          localStorage.setItem(`smartgrocery_${user.id}_cart_discount`, JSON.stringify(uData.cartDiscount));
        }
      });
    }

    // Default to Rian so that on opening Live Server, the entire app is immediately visible and functional!
    // But if user explicitly logged out or wants login gatekeeper (?login=1), respect that!
    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const explicitlyLoggedOut = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('smartgrocery_logged_out') === '1') || 
                                (urlParams && (urlParams.get('auth') === 'login' || urlParams.get('login') === '1'));

    if (explicitlyLoggedOut) {
      this.setActiveUser(null);
    } else if (!this.getCurrentUser() && users.length > 0) {
      this.setActiveUser(users[0]);
    }

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
      const data = localStorage.getItem(this.KEYS.ACTIVE_USER);
      return data ? JSON.parse(data) : null;
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
      localStorage.setItem(this.KEYS.ACTIVE_USER, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(this.KEYS.ACTIVE_USER);
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

    // If account not found, REQUIRE sign up first!
    if (!user) {
      return { 
        success: false, 
        code: 'USER_NOT_FOUND', 
        message: 'Akun dengan email/nama ini belum terdaftar! Silakan klik tab "Daftar Akun Baru" terlebih dahulu untuk membuat akun.' 
      };
    }

    // Check password if set
    if (user.password && cleanPass) {
      if (String(user.password).trim() !== cleanPass) {
        return { 
          success: false, 
          code: 'WRONG_PASSWORD', 
          message: 'Password salah! Periksa kembali password Anda atau gunakan akun demo.' 
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
  register({ name, email, password, role = 'Anak Kost', monthlyLimit = 500000, emergencyReserve = 50000, avatarUrl = '' }) {
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
    const userId = 'user_' + Date.now();

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

    let users = this.getAllUsers();
    let existing = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!existing) {
      // Auto-register user from verified Google OAuth
      const res = this.register({
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
      // Make sure cart has the benchmark starter items so it's not empty!
      const currentCart = localStorage.getItem(`smartgrocery_${existing.id}_cart`);
      if (!currentCart || currentCart === '[]') {
        const starter = (typeof SEED_DATA !== 'undefined' && SEED_DATA.userData_user_rian)
          ? SEED_DATA.userData_user_rian.activeCart.map(item => ({ ...item }))
          : [];
        localStorage.setItem(`smartgrocery_${existing.id}_cart`, JSON.stringify(starter));
      }

      this.setActiveUser(existing);
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
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
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
