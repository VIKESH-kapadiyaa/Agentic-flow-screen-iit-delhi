import { AuthAdapter } from './AuthAdapter';

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  LOCAL SERVER AUTH ADAPTER — Placeholder for Migration   ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  When you're ready to move off Supabase:                 ║
 * ║  1. Implement each method below with fetch() calls       ║
 * ║  2. Handle token storage in localStorage                 ║
 * ║  3. Change one line in main.jsx to use this adapter      ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export class LocalServerAuthAdapter extends AuthAdapter {
  constructor(baseUrl = 'http://localhost:3001') {
    super();
    this.baseUrl = baseUrl;
    this.TOKEN_KEY = 'agentic_auth_token';
    this.USER_KEY = 'agentic_auth_user';
    this._listeners = new Set();
  }

  /**
   * Helper: make authenticated requests to your local API.
   */
  async _fetch(endpoint, options = {}) {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return { data: null, error: data.message || `Request failed (${res.status})` };
    }
    return { data, error: null };
  }

  /**
   * Helper: persist auth state and notify listeners.
   */
  _setAuth(user, token) {
    if (user && token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    const session = user ? { user, accessToken: token } : null;
    this._listeners.forEach(cb => cb(user ? 'SIGNED_IN' : 'SIGNED_OUT', session));
  }

  async signUp({ email, password, name, company }) {
    const { data, error } = await this._fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, company }),
    });

    if (error) return { user: null, error };

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      company: data.user.company || null,
      avatarUrl: data.user.avatarUrl || null,
      createdAt: data.user.createdAt || new Date().toISOString(),
    };

    this._setAuth(user, data.token);
    return { user, error: null };
  }

  async signIn({ email, password }) {
    const { data, error } = await this._fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (error) return { user: null, error };

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      company: data.user.company || null,
      avatarUrl: data.user.avatarUrl || null,
      createdAt: data.user.createdAt || null,
    };

    this._setAuth(user, data.token);
    return { user, error: null };
  }

  async signInWithProvider(provider) {
    // For local server, this typically redirects to a passport.js /auth/google endpoint
    window.location.href = `${this.baseUrl}/auth/${provider}`;
    return { error: null }; // Redirects
  }

  async signOut() {
    try {
      await this._fetch('/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort server logout; always clear local state
    }
    this._setAuth(null, null);
    return { error: null };
  }

  async getSession() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (!token || !userStr) {
      return { session: null, error: null };
    }

    try {
      const user = JSON.parse(userStr);
      return {
        session: { user, accessToken: token },
        error: null,
      };
    } catch {
      return { session: null, error: 'Corrupted session data' };
    }
  }

  async getAccessToken() {
    return localStorage.getItem(this.TOKEN_KEY) || null;
  }

  async getProfile(userId) {
    const { data, error } = await this._fetch(`/auth/profile/${userId}`);
    if (error) return { profile: null, error };

    return {
      profile: {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company || null,
        avatarUrl: data.avatarUrl || null,
        createdAt: data.createdAt || null,
      },
      error: null,
    };
  }

  async updateProfile(userId, profileData) {
    const { error } = await this._fetch(`/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return { error };
  }

  onAuthStateChange(callback) {
    this._listeners.add(callback);
    return {
      unsubscribe: () => this._listeners.delete(callback),
    };
  }
}
