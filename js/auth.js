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
      users = window.SEED_DATA.users;
      this.saveUsers(users);

      // Seed data for each initial user
      users.forEach(user => {
        const seedKey = `userData_${user.id}`;
        if (window.SEED_DATA[seedKey]) {
          const uData = window.SEED_DATA[seedKey];
          localStorage.setItem(`smartgrocery_${user.id}_budget`, JSON.stringify(uData.budgetSettings));
          localStorage.setItem(`smartgrocery_${user.id}_cart`, JSON.stringify(uData.activeCart));
          localStorage.setItem(`smartgrocery_${user.id}_catalog`, JSON.stringify(uData.catalog));
          localStorage.setItem(`smartgrocery_${user.id}_history`, JSON.stringify(uData.history));
          localStorage.setItem(`smartgrocery_${user.id}_cart_discount`, JSON.stringify(uData.cartDiscount));
        }
      });
    }

    // Default to first user (Rian) if no active user session
    if (!this.getCurrentUser()) {
      this.setActiveUser(users[0]);
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
   * Login user with email/name and password
   */
  login(identifier, password) {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Email atau nama pengguna wajib diisi!' };
    }
    if (!password) {
      return { success: false, message: 'Password wajib diisi!' };
    }
    const users = this.getAllUsers();
    const cleanId = identifier.trim().toLowerCase();
    
    const user = users.find(u => 
      (u.email.toLowerCase() === cleanId || u.name.toLowerCase() === cleanId) &&
      u.password === password.trim()
    );

    if (user) {
      this.setActiveUser(user);
      return { success: true, user };
    }
    return { success: false, message: 'Email atau password salah! Coba akun demo: rian@kost.id (pass: 123)' };
  },

  /**
   * Register a new user with dedicated isolated storage
   */
  register({ name, email, password, role = 'Anak Kost', monthlyLimit = 500000, emergencyReserve = 50000 }) {
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
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' };
    }

    const colors = ['bg-purple-600', 'bg-blue-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600'];
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
      avatarLetter: name.trim().charAt(0).toUpperCase()
    };

    users.push(newUser);
    this.saveUsers(users);

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

    return { success: true, user: newUser };
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
   * Logout user
   */
  logout() {
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
