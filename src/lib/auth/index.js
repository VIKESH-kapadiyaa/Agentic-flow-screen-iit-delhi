/**
 * Auth Module — Public API
 * 
 * Usage:
 *   import { AuthProvider, useAuth, ProtectedRoute, SupabaseAuthAdapter } from './lib/auth';
 * 
 * To switch backends, change the adapter:
 *   import { LocalServerAuthAdapter } from './lib/auth';
 *   const adapter = new LocalServerAuthAdapter('http://localhost:3001');
 */

export { AuthProvider, useAuth, ProtectedRoute } from './AuthContext';
export { SupabaseAuthAdapter } from './SupabaseAuthAdapter';
export { LocalServerAuthAdapter } from './LocalServerAuthAdapter';
export { AuthAdapter } from './AuthAdapter';
