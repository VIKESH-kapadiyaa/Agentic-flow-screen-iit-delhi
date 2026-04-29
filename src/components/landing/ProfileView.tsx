import React, { useState, useEffect, useCallback } from 'react';
import { User, LogOut, Workflow, ArrowLeft, Key, Eye, EyeOff, Shield, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabaseClient';

const API_BASE = 'http://localhost:3001';

export const ProfileView = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate();
  const { user: authUser, signOut, getProfile } = useAuth();
  const [workflowCount, setWorkflowCount] = useState(0);
  
  const [user, setUser] = useState(propUser || {
    name: 'Loading...',
    email: '...'
  });

  // ── API Key Management State ──────────────────────────────
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [lastFour, setLastFour] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null); // { type: 'success' | 'error', text }

  // ── Fetch user profile and stats ──────────────────────────
  useEffect(() => {
    const fetchUserAndStats = async () => {
      if (authUser) {
        const { profile } = await getProfile(authUser.id);
        
        setUser({
           name: profile?.name || authUser.name || 'Agentic User',
           email: authUser.email
        });

        // Fetch workflow count
        const { count, error } = await supabase
          .from('sequences')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);
        
        if (!error) setWorkflowCount(count || 0);
      } else {
        navigate('/');
      }
    };
    fetchUserAndStats();
  }, [navigate, authUser, getProfile]);

  // ── Fetch API key status from server ──────────────────────
  const fetchKeyStatus = useCallback(async () => {
    if (!authUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/keys/status/${authUser.id}`);
      const data = await res.json();
      setHasKey(data.hasKey);
      setLastFour(data.lastFour || '');
      setSavedAt(data.savedAt || '');
    } catch {
      // Server might not be running
    }
  }, [authUser]);

  useEffect(() => {
    fetchKeyStatus();
  }, [fetchKeyStatus]);

  // ── Listen for global key error events ────────────────────
  useEffect(() => {
    const handler = () => {
      setSaveMessage({ type: 'error', text: 'Your API key was rejected. Please update it below.' });
    };
    window.addEventListener('agentic:key-error', handler);
    return () => window.removeEventListener('agentic:key-error', handler);
  }, []);

  // ── Save API key (encrypted on server) ────────────────────
  const handleSaveKey = async () => {
    if (!keyInput.trim() || !authUser) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/keys/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id, apiKey: keyInput.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setHasKey(true);
        setLastFour(data.lastFour);
        setKeyInput('');
        setIsEditing(false);
        setSaveMessage({ type: 'success', text: 'API key encrypted and saved securely.' });
        setTimeout(() => setSaveMessage(null), 4000);
        await fetchKeyStatus();
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save key.' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Server unreachable. Is the backend running?' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete stored key ─────────────────────────────────────
  const handleDeleteKey = async () => {
    if (!authUser) return;
    setIsDeleting(true);
    try {
      await fetch(`${API_BASE}/api/keys/${authUser.id}`, { method: 'DELETE' });
      setHasKey(false);
      setLastFour('');
      setKeyInput('');
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'API key removed.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to delete key.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  };

  const maskedKey = hasKey ? `${'•'.repeat(20)}${lastFour}` : '';

  return (
    <div 
      className="min-h-screen pt-32 px-6 pb-24 relative overflow-hidden bg-[#030303] cursor-pointer"
      onClick={() => navigate('/dashboard')}
    >
      <div 
        className="max-w-4xl mx-auto relative z-10 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-4xl font-bold text-zinc-100 tracking-tight">Agentic Profile</h2>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5">
            <LogOut className="w-4 h-4" /> <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* User Card */}
          <div className="md:col-span-1 bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-zinc-800 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
              <User className="w-12 h-12 text-zinc-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100 mb-1">{user.name}</h3>
            <p className="text-zinc-500 font-light">{user.email}</p>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-6">

            {/* ── API KEY MANAGEMENT CARD ── */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#A259FF]/10 border border-[#A259FF]/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-[#A259FF]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-100">API Key Management</h4>
                    <p className="text-xs text-zinc-500">Used globally across all engine operations</p>
                  </div>
                </div>
                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  hasKey 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-zinc-800/50 border-white/5 text-zinc-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                  {hasKey ? 'Active' : 'Not Set'}
                </div>
              </div>

              {/* Key Display / Input */}
              {hasKey && !isEditing ? (
                /* ── Existing key: show masked version ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[#111] border border-white/5 rounded-xl px-4 py-3.5 font-mono text-sm text-zinc-400 tracking-wider overflow-hidden">
                      {maskedKey}
                    </div>
                  </div>
                  {savedAt && (
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                      Last updated: {new Date(savedAt).toLocaleDateString()} at {new Date(savedAt).toLocaleTimeString()}
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => { setIsEditing(true); setKeyInput(''); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A259FF]/10 border border-[#A259FF]/20 text-[#A259FF] text-xs font-bold uppercase tracking-widest hover:bg-[#A259FF]/20 transition-all"
                    >
                      <Key className="w-3.5 h-3.5" /> Replace Key
                    </button>
                    <button
                      onClick={handleDeleteKey}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete Key
                    </button>
                  </div>
                </div>
              ) : (
                /* ── No key or editing: show input ── */
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="Enter your API key (e.g., sk-or-v1-...)"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-sm text-zinc-200 font-mono outline-none focus:border-[#A259FF]/50 transition-all placeholder:text-zinc-600"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveKey}
                      disabled={!keyInput.trim() || isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A259FF] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#8B3FE0] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#A259FF]/20"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                      {isSaving ? 'Encrypting...' : 'Save Key'}
                    </button>
                    {isEditing && (
                      <button
                        onClick={() => { setIsEditing(false); setKeyInput(''); }}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {saveMessage && (
                <div className={`flex items-center gap-2 mt-4 px-4 py-3 rounded-xl text-sm ${
                  saveMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {saveMessage.type === 'success' 
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> 
                    : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  }
                  {saveMessage.text}
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-3 mt-6 pt-5 border-t border-white/5">
                <Shield className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Your key is encrypted with <span className="text-zinc-500 font-medium">AES-256-GCM</span> and stored on the server. 
                  It is never exposed to the browser or stored in localStorage. All API calls are proxied through the backend.
                </p>
              </div>
            </div>

            {/* Active Workflows Card */}
            <div className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Workflow className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-4xl font-bold text-zinc-100 mb-1">{workflowCount}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Active Workflows</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
