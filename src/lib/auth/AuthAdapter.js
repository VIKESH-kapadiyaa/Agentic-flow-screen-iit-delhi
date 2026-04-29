/* eslint-disable no-unused-vars */
/**
 * AuthAdapter — Interface contract for all auth backends.
 * 
 * Every adapter (Supabase, Local Server, etc.) MUST implement
 * these methods and return data in the exact shapes defined below.
 * 
 * ─── Normalized User Shape ───
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string|null} company
 * @property {string|null} avatarUrl
 * @property {string|null} createdAt
 * 
 * ─── Normalized Session Shape ───
 * @typedef {Object} AuthSession
 * @property {AuthUser} user
 * @property {string} accessToken
 * 
 * ─── Standard Return Shapes ───
 * @typedef {{ user: AuthUser|null, error: string|null }} AuthResult
 * @typedef {{ session: AuthSession|null, error: string|null }} SessionResult
 * @typedef {{ profile: Object|null, error: string|null }} ProfileResult
 * @typedef {{ error: string|null }} VoidResult
 * @typedef {{ unsubscribe: Function }} Subscription
 */

export class AuthAdapter {
  /**
   * Register a new user.
   * @param {{ email: string, password: string, name: string, company?: string }} _data
   * @returns {Promise<AuthResult>}
   */
  async signUp(_data) {
    throw new Error('AuthAdapter.signUp() not implemented');
  }

  /**
   * Sign in an existing user.
   * @param {{ email: string, password: string }} _credentials
   * @returns {Promise<AuthResult>}
   */
  async signIn(_credentials) {
    throw new Error('AuthAdapter.signIn() not implemented');
  }

  /**
   * Sign in with a third-party provider (e.g., 'google').
   * @param {string} _provider
   * @returns {Promise<VoidResult>} (Usually triggers a redirect)
   */
  async signInWithProvider(_provider) {
    throw new Error('AuthAdapter.signInWithProvider() not implemented');
  }

  /**
   * Sign out the current user.
   * @returns {Promise<VoidResult>}
   */
  async signOut() {
    throw new Error('AuthAdapter.signOut() not implemented');
  }

  /**
   * Get the current active session (if any).
   * @returns {Promise<SessionResult>}
   */
  async getSession() {
    throw new Error('AuthAdapter.getSession() not implemented');
  }

  /**
   * Get the current access token for API calls.
   * @returns {Promise<string|null>}
   */
  async getAccessToken() {
    throw new Error('AuthAdapter.getAccessToken() not implemented');
  }

  /**
   * Fetch extended profile data for a user.
   * @param {string} _userId
   * @returns {Promise<ProfileResult>}
   */
  async getProfile(_userId) {
    throw new Error('AuthAdapter.getProfile() not implemented');
  }

  /**
   * Update profile data for a user.
   * @param {string} _userId
   * @param {Object} _data
   * @returns {Promise<VoidResult>}
   */
  async updateProfile(_userId, _data) {
    throw new Error('AuthAdapter.updateProfile() not implemented');
  }

  /**
   * Listen for auth state changes (login, logout, token refresh).
   * Callback receives (event: string, session: AuthSession|null).
   * @param {Function} _callback
   * @returns {Subscription}
   */
  onAuthStateChange(_callback) {
    throw new Error('AuthAdapter.onAuthStateChange() not implemented');
  }
}
