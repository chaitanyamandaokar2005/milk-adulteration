const USER_KEY = 'milkwise_user';
const TOKEN_KEY = 'milkwise_token';
const LEGACY_TOKEN_KEY = 'puremilk_token';

const Auth = {
  currentUser: null,

  readStoredUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (err) {
      return null;
    }
  },

  storeUser(user) {
    this.currentUser = user || null;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  clearSession() {
    this.currentUser = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  isSignedIn() {
    return !!this.currentUser;
  },

  init() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    this.currentUser = this.readStoredUser();
    this.bindEvents();
    this.renderNav();
    this.updateAuthGate();
    this.checkSession();
  },

  nextPath() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return '/test';
  },

  bindEvents() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));
  },

  async checkSession() {
    const paintedUserId = this.currentUser && this.currentUser.id;
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        this.storeUser(data.user);
        if (paintedUserId !== data.user.id) this.renderNav();
      } else {
        this.clearSession();
        this.renderNav();
      }
    } catch (err) {
      console.warn('Could not verify session:', err);
    }
    this.updateAuthGate();
  },

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Login failed', 'error');
        return;
      }

      this.storeUser(data.user);
      showToast(`Welcome back, ${data.user.fullName || data.user.username}!`, 'success');
      window.location.href = this.nextPath();
    } catch (err) {
      showToast('Network error during login.', 'error');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Registration failed', 'error');
        return;
      }

      this.storeUser(data.user);
      showToast('Account registered successfully!', 'success');
      window.location.href = this.nextPath();
    } catch (err) {
      showToast('Network error during registration.', 'error');
    }
  },

  logout() {
    this.clearSession();
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    showToast('You have been logged out.', 'info');
    window.location.href = '/';
  },

  updateAuthGate() {
    const authGateOverlay = document.getElementById('authGateOverlay');
    const uploadFormArea = document.getElementById('uploadFormArea');
    const dashLoggedIn = document.getElementById('dashboardLoggedIn');
    const dashLoggedOut = document.getElementById('dashboardLoggedOut');
    const isLoggedIn = this.isSignedIn();

    if (authGateOverlay) authGateOverlay.style.display = isLoggedIn ? 'none' : 'flex';
    if (uploadFormArea) uploadFormArea.style.display = isLoggedIn ? 'block' : 'none';
    if (dashLoggedIn) dashLoggedIn.style.display = isLoggedIn ? 'block' : 'none';
    if (dashLoggedOut) dashLoggedOut.style.display = isLoggedIn ? 'none' : 'block';
  },

  renderNav() {
    const container = document.getElementById('authContainer');
    if (!container) return;

    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    if (this.currentUser) {
      const label = escapeHtml(this.currentUser.fullName || this.currentUser.username);
      const initial = (this.currentUser.fullName || this.currentUser.username || 'U')[0].toUpperCase();
      container.innerHTML = `
        <div class="user-badge">
          <div class="user-avatar">${escapeHtml(initial)}</div>
          <span class="user-name">${label}</span>
          <button class="btn btn-ghost btn-sm" id="logoutBtn" title="Logout" type="button">Exit</button>
        </div>
      `;
      document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    } else {
      container.innerHTML = `
        <a class="btn btn-outline btn-sm" href="/login">Login</a>
        <a class="btn btn-primary btn-sm" href="/register">Sign Up</a>
      `;
    }
  }
};

window.Auth = Auth;
