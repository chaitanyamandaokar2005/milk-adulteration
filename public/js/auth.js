const Auth = {
  currentUser: null,
  token: localStorage.getItem('puremilk_token') || null,

  init() {
    this.bindEvents();
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
    if (!this.token) {
      this.renderNav();
      this.updateAuthGate();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
      } else {
        this.token = null;
        localStorage.removeItem('puremilk_token');
        this.currentUser = null;
      }
    } catch (err) {
      console.warn('Could not verify session:', err);
    }
    this.renderNav();
    this.updateAuthGate();
  },

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Login failed', 'error');
        return;
      }

      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('puremilk_token', data.token);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Registration failed', 'error');
        return;
      }

      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('puremilk_token', data.token);
      showToast('Account registered successfully!', 'success');
      window.location.href = this.nextPath();
    } catch (err) {
      showToast('Network error during registration.', 'error');
    }
  },

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('puremilk_token');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    showToast('You have been logged out.', 'info');
    window.location.href = '/';
  },

  updateAuthGate() {
    const authGateOverlay = document.getElementById('authGateOverlay');
    const uploadFormArea = document.getElementById('uploadFormArea');
    const dashLoggedIn = document.getElementById('dashboardLoggedIn');
    const dashLoggedOut = document.getElementById('dashboardLoggedOut');
    const isLoggedIn = !!this.currentUser;

    if (authGateOverlay) authGateOverlay.style.display = isLoggedIn ? 'none' : 'flex';
    if (uploadFormArea) uploadFormArea.style.display = isLoggedIn ? 'block' : 'none';
    if (dashLoggedIn) dashLoggedIn.style.display = isLoggedIn ? 'block' : 'none';
    if (dashLoggedOut) dashLoggedOut.style.display = isLoggedIn ? 'none' : 'block';
  },

  renderNav() {
    const container = document.getElementById('authContainer');
    if (!container) return;

    if (this.currentUser) {
      const initial = (this.currentUser.fullName || this.currentUser.username || 'U')[0].toUpperCase();
      container.innerHTML = `
        <div class="user-badge">
          <div class="user-avatar">${initial}</div>
          <span class="user-name">${this.currentUser.fullName || this.currentUser.username}</span>
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
