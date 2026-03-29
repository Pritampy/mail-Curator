import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar, BottomNav, TabType } from './components/Navigation';
import { CardStack } from './components/CardStack';
import { StatsDashboard } from './components/StatsDashboard';
import { FilterList } from './components/FilterList';
import { FilterEditor } from './components/FilterEditor';
import { RulesList } from './components/RulesList';
import { RuleEditor } from './components/RuleEditor';
import { SnoozeList } from './components/SnoozeList';
import { QuickReplyList } from './components/QuickReplyList';
import { QuickReplyEditor } from './components/QuickReplyEditor';
import { BulkSelectMode } from './components/BulkSelectMode';
import { DeferredDeleteQueue } from './components/DeferredDelete';
import { Email, Stats, User, Filter, Rule, SnoozeDuration, QuickReply } from './types';
import { apiFetch, getSessionToken, setSessionToken, clearSessionToken } from './lib/apiFetch';
import { LogIn, RefreshCw, Trash2, X, Mail, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ emailId: string, action: 'delete' | 'skip', data: Email } | null>(null);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [showFilterEditor, setShowFilterEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<Email[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const refetchGuardRef = useRef(false);
  const batchDeleteModeRef = useRef(batchDeleteMode);
  useEffect(() => { batchDeleteModeRef.current = batchDeleteMode; }, [batchDeleteMode]);

  const fetchUser = async () => {
    try {
      const res = await apiFetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  const fetchEmails = async (append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await apiFetch('/api/emails?maxResults=100');
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setEmails(prev => {
            const existingIds = new Set(prev.map(e => e.id));
            const newEmails = data.filter((e: Email) => !existingIds.has(e.id));
            return [...prev, ...newEmails];
          });
        } else {
          setEmails(data);
        }
      } else if (res.status === 401) {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch emails", err);
      setError("Failed to load emails");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (emails.length > 0 && emails.length <= 5 && !loadingMore && !refetchGuardRef.current) {
      refetchGuardRef.current = true;
      fetchEmails(true).finally(() => {
        refetchGuardRef.current = false;
      });
    }
  }, [emails.length]);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setProcessedCount(data.totalProcessed || 0);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Check for session token in URL hash (redirect flow from OAuth callback)
      const hash = window.location.hash;
      if (hash.startsWith('#token=')) {
        const token = hash.slice(7);
        setSessionToken(token);
        // Clean the hash from the URL without triggering a reload
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      // If we have a token, try to fetch the user
      if (getSessionToken()) {
        await fetchUser();
      }
      await fetchStats();
      setLoading(false);
    };
    init();
  }, []);

  // Pre-fetch auth URL so it's available immediately on button click (fixes iOS Safari)
  const fetchAuthUrl = async () => {
    try {
      const res = await apiFetch('/api/auth/url');
      if (res.ok) {
        const { url } = await res.json();
        setAuthUrl(url);
      }
    } catch (err) {
      console.error("Failed to pre-fetch auth URL", err);
    }
  };

  useEffect(() => {
    if (!user && !loading) {
      fetchAuthUrl();
    }
  }, [user, loading]);

  useEffect(() => {
    if (user && activeTab === 'inbox') {
      fetchEmails();
    }
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [user, activeTab]);

  const handleLogin = () => {
    setShowAuthModal(true);
    if (!authUrl) fetchAuthUrl();
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed', err);
    }
    clearSessionToken();
    setUser(null);
    setEmails([]);
    setStats(null);
  };

  // Called from the modal's "Continue with Google" button - runs synchronously
  // from a direct user tap, which avoids iOS Safari's popup blocker.
  const handleAuthProceed = () => {
    if (!authUrl) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS || window.innerWidth < 768) {
      // Full-page redirect for iOS / mobile (synchronous from user tap)
      window.location.href = authUrl;
    } else {
      // Popup for desktop - opened synchronously from user click
      const authWindow = window.open(authUrl, 'oauth_popup', 'width=600,height=700');

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.token) {
          setSessionToken(event.data.token);
          fetchUser();
          setShowAuthModal(false);
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);

      // Fallback: poll for popup close (user may complete auth and popup auto-closes)
      const pollTimer = setInterval(() => {
        if (authWindow && authWindow.closed) {
          clearInterval(pollTimer);
          // If token was already set via postMessage, fetchUser is already called
          if (getSessionToken()) {
            fetchUser();
          }
          setShowAuthModal(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 500);
    }
  };

  const handleAction = useCallback(async (emailId: string, action: 'delete' | 'skip', emailData: Email) => {
    // Batch delete mode: accumulate deletes locally, skip still works normally
    if (batchDeleteModeRef.current && action === 'delete') {
      setEmails(prev => prev.filter(e => e.id !== emailId));
      setPendingDeletes(prev => [...prev, emailData]);
      return;
    }

    const endpoint = action === 'delete' ? '/api/delete' : '/api/skip';
    
    // Optimistic UI
    setEmails(prev => prev.filter(e => e.id !== emailId));
    setLastAction({ emailId, action, data: emailData });

    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ 
          emailId, 
          sender: emailData.from, 
          subject: emailData.subject 
        })
      });
      
      if (!res.ok) {
        throw new Error(`Failed to ${action} email`);
      }
      
      fetchStats();
    } catch (err) {
      console.error(`Failed to ${action} email`, err);
      // Rollback
      setEmails(prev => [emailData, ...prev]);
      setError(`Failed to ${action} email. Please try again.`);
      setTimeout(() => setError(null), 3000);
    }
  }, []);

  const handleBatchDeleteExecute = async () => {
    if (pendingDeletes.length === 0 || batchDeleting) return;
    setBatchDeleting(true);

    try {
      const res = await apiFetch('/api/bulk/delete-batch', {
        method: 'POST',
        body: JSON.stringify({
          emailIds: pendingDeletes.map(e => e.id),
          senders: pendingDeletes.map(e => e.from),
          subjects: pendingDeletes.map(e => e.subject),
        })
      });

      if (!res.ok) throw new Error('Failed to batch delete');

      setPendingDeletes([]);
      fetchStats();
    } catch (err) {
      console.error('Batch delete failed', err);
      setEmails(prev => [...pendingDeletes, ...prev]);
      setPendingDeletes([]);
      setError('Batch delete failed. Emails restored.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleRemoveFromPending = (emailId: string) => {
    const email = pendingDeletes.find(e => e.id === emailId);
    if (email) {
      setPendingDeletes(prev => prev.filter(e => e.id !== emailId));
      setEmails(prev => [email, ...prev]);
    }
  };

  const handleClearPending = () => {
    setEmails(prev => [...pendingDeletes, ...prev]);
    setPendingDeletes([]);
  };

  const handleUndo = async () => {
    if (!lastAction) return;
    
    if (lastAction.action === 'delete') {
      try {
        await apiFetch('/api/undo', {
          method: 'POST',
          body: JSON.stringify({ emailId: lastAction.emailId })
        });
      } catch (err) {
        console.error("Failed to undo delete", err);
      }
    }
    
    setEmails(prev => [lastAction.data, ...prev]);
    setLastAction(null);
    fetchStats();
  };

  const handleSaveFilter = async (filter: Partial<Filter>) => {
    try {
      const method = editingFilter ? 'PATCH' : 'POST';
      const path = editingFilter ? `/api/filters/${editingFilter._id}` : '/api/filters';
      
      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(filter)
      });
      
      if (!res.ok) throw new Error('Failed to save filter');
      
      setShowFilterEditor(false);
      setEditingFilter(null);
    } catch (err) {
      console.error('Failed to save filter', err);
      setError('Failed to save filter');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      const res = await apiFetch(`/api/filters/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete filter');
    } catch (err) {
      console.error('Failed to delete filter', err);
      setError('Failed to delete filter');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleFilter = async (id: string, enabled: boolean) => {
    try {
      const res = await apiFetch(`/api/filters/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) throw new Error('Failed to toggle filter');
    } catch (err) {
      console.error('Failed to toggle filter', err);
    }
  };

  const handleSaveRule = async (rule: Partial<Rule>) => {
    try {
      const method = editingRule ? 'PATCH' : 'POST';
      const path = editingRule ? `/api/rules/${editingRule._id}` : '/api/rules';
      
      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(rule)
      });
      
      if (!res.ok) throw new Error('Failed to save rule');
      
      setShowRuleEditor(false);
      setEditingRule(null);
    } catch (err) {
      console.error('Failed to save rule', err);
      setError('Failed to save rule');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await apiFetch(`/api/rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete rule');
    } catch (err) {
      console.error('Failed to delete rule', err);
      setError('Failed to delete rule');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      const res = await apiFetch(`/api/rules/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) throw new Error('Failed to toggle rule');
    } catch (err) {
      console.error('Failed to toggle rule', err);
    }
  };

  const handleRunRule = async (id: string) => {
    try {
      const res = await apiFetch(`/api/rules/${id}/execute`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to execute rule');
    } catch (err) {
      console.error('Failed to execute rule', err);
      setError('Failed to execute rule');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSnooze = async (emailId: string, emailData: Email, duration: SnoozeDuration, customDate?: Date) => {
    let snoozedUntil: Date;
    const now = new Date();
    
    switch (duration) {
      case 'later_today':
        snoozedUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        break;
      case 'tomorrow':
        snoozedUntil = new Date(now);
        snoozedUntil.setDate(snoozedUntil.getDate() + 1);
        snoozedUntil.setHours(9, 0, 0, 0);
        break;
      case 'next_week':
        snoozedUntil = new Date(now);
        snoozedUntil.setDate(snoozedUntil.getDate() + 7);
        snoozedUntil.setHours(9, 0, 0, 0);
        break;
      case 'custom':
        snoozedUntil = customDate || now;
        break;
      default:
        snoozedUntil = now;
    }

    try {
      const res = await apiFetch('/api/snooze', {
        method: 'POST',
        body: JSON.stringify({
          emailId,
          sender: emailData.from,
          subject: emailData.subject,
          snoozedUntil: snoozedUntil.toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to snooze email');
    } catch (err) {
      console.error('Failed to snooze email', err);
      setError('Failed to snooze email');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUnsnooze = async (id: string) => {
    try {
      const res = await apiFetch(`/api/snooze/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unsnooze');
    } catch (err) {
      console.error('Failed to unsnooze', err);
    }
  };

  const handleExtendSnooze = async (id: string, newDate: Date) => {
    try {
      const res = await apiFetch(`/api/snooze/${id}/extend`, {
        method: 'POST',
        body: JSON.stringify({ snoozedUntil: newDate.toISOString() })
      });
      if (!res.ok) throw new Error('Failed to extend snooze');
    } catch (err) {
      console.error('Failed to extend snooze', err);
    }
  };

  const handleSaveReply = async (name: string, template: string) => {
    try {
      const method = editingReply ? 'PATCH' : 'POST';
      const path = editingReply ? `/api/quickreplies/${editingReply._id}` : '/api/quickreplies';
      const res = await apiFetch(path, {
        method,
        body: JSON.stringify({ name, template })
      });
      if (!res.ok) throw new Error('Failed to save reply');
      setShowReplyEditor(false);
      setEditingReply(null);
    } catch (err) {
      console.error('Failed to save reply', err);
    }
  };

  const handleDeleteReply = async (id: string) => {
    try {
      const res = await apiFetch(`/api/quickreplies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete reply');
    } catch (err) {
      console.error('Failed to delete reply', err);
    }
  };

  const handleSwipeLeft = useCallback((email: Email) => {
    handleAction(email.id, 'skip', email);
  }, [handleAction]);

  const handleSwipeRight = useCallback((email: Email) => {
    handleAction(email.id, 'delete', email);
  }, [handleAction]);

  const handleBulkAction = async (action: 'delete' | 'archive' | 'skip' | 'label', emailIds: string[]) => {
    try {
      const res = await apiFetch(`/api/bulk/${action}`, {
        method: 'POST',
        body: JSON.stringify({ emailIds })
      });
      if (!res.ok) throw new Error(`Failed to bulk ${action}`);
      setSelectedEmails(new Set());
      setBulkMode(false);
      fetchEmails();
      fetchStats();
    } catch (err) {
      console.error(`Failed to bulk ${action}`, err);
      setError(`Failed to bulk ${action}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-12 relative">
          <div className="w-32 h-32 editorial-gradient rounded-full blur-3xl absolute -inset-4 opacity-20 animate-pulse"></div>
          <h1 className="font-headline font-black text-6xl tracking-tighter text-primary relative z-10">KINETIC</h1>
        </div>
        <h2 className="font-headline text-3xl font-extrabold mb-4">Clean your inbox with a swipe.</h2>
        <p className="text-on-surface-variant mb-8 max-w-xs">Connect your Gmail to start reaching Inbox Zero in record time.</p>
        
        <button 
          onClick={handleLogin}
          className="editorial-gradient px-8 py-4 rounded-full font-headline font-bold text-on-primary-fixed shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <LogIn size={20} /> CONNECT GMAIL
        </button>

        {/* In-page Google Auth Modal */}
        {showAuthModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}
          >
            <div className="relative bg-surface-container rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
              {/* Close button */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-surface-container-highest flex items-center justify-center">
                  <Mail size={28} className="text-primary" />
                </div>

                <h3 className="font-headline text-2xl font-extrabold mb-2 text-on-surface">Connect Your Gmail</h3>
                <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
                  Sign in with your Google account to start cleaning your inbox. You'll choose which account to use on the next screen.
                </p>

                {/* Google Sign-In Button */}
                <button
                  onClick={handleAuthProceed}
                  disabled={!authUrl}
                  className="w-full bg-white text-neutral-800 px-6 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-3 hover:bg-neutral-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                  {/* Google "G" logo */}
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  {authUrl ? 'Continue with Google' : 'Loading...'}
                </button>

                {/* Cancel link */}
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="mt-4 text-on-surface-variant text-sm hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>

                {/* Permissions info */}
                <div className="mt-6 pt-5 border-t border-surface-container-highest">
                  <div className="flex items-start gap-2.5 text-left">
                    <Shield size={14} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                      Kinetic will request permission to read and manage your Gmail. Your credentials are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-32">
      <TopBar user={user} onLogout={handleLogout} />
      
      <main className="pt-24 px-6 max-w-lg mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Syncing your inbox...</p>
          </div>
        ) : activeTab === 'inbox' ? (
          <div className="animate-in fade-in duration-500">
            <section className="mt-4 mb-10">
              <p className="font-label text-[10px] font-medium tracking-widest uppercase text-primary mb-2">Inbox Health</p>
              <div className="flex justify-between items-end mb-4">
                <h2 className="font-headline text-4xl font-extrabold tracking-tighter leading-none">Curating<br/>Queue</h2>
                <div className="text-right">
                  <span className="text-primary font-black text-3xl">
                    {processedCount > 0 ? Math.round((processedCount / (processedCount + emails.length)) * 100) : 0}%
                  </span>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant font-label font-bold">Processed</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#d095ff] to-[#ff96bb] transition-all duration-500" 
                  style={{ width: `${processedCount > 0 ? Math.round((processedCount / (processedCount + emails.length)) * 100) : 0}%` }}
                ></div>
              </div>
            </section>

            {/* Batch Delete Toggle */}
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-on-surface-variant" />
                <span className="text-sm font-medium text-on-surface-variant">Batch Delete</span>
                {batchDeleteMode && pendingDeletes.length > 0 && (
                  <span className="text-xs bg-error/20 text-error px-2 py-0.5 rounded-full font-bold">
                    {pendingDeletes.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={batchDeleteMode}
                onClick={() => {
                  if (batchDeleteMode && pendingDeletes.length > 0) {
                    handleClearPending();
                  }
                  setBatchDeleteMode(prev => !prev);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  batchDeleteMode ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                    batchDeleteMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <CardStack 
              emails={emails}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />

            {/* Batch Delete Floating Queue */}
            {batchDeleteMode && (
              <DeferredDeleteQueue
                selectedEmails={pendingDeletes}
                onRemove={handleRemoveFromPending}
                onClearAll={handleClearPending}
                onFinalDelete={handleBatchDeleteExecute}
              />
            )}
          </div>
        ) : activeTab === 'stats' ? (
          stats && <StatsDashboard stats={stats} onStartSession={() => setActiveTab('inbox')} />
        ) : activeTab === 'filters' ? (
          <FilterList 
            onEditFilter={(filter) => { setEditingFilter(filter); setShowFilterEditor(true); }}
            onDeleteFilter={handleDeleteFilter}
            onToggleFilter={handleToggleFilter}
          />
        ) : activeTab === 'rules' ? (
          <RulesList 
            onEditRule={(rule) => { setEditingRule(rule); setShowRuleEditor(true); }}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
            onRunRule={handleRunRule}
          />
        ) : activeTab === 'snoozed' ? (
          <SnoozeList 
            onUnsnooze={handleUnsnooze}
            onExtend={handleExtendSnooze}
          />
        ) : activeTab === 'quickreply' ? (
          <QuickReplyList 
            onEditReply={(reply) => { setEditingReply(reply); setShowReplyEditor(true); }}
            onDeleteReply={handleDeleteReply}
            onNewReply={() => { setEditingReply(null); setShowReplyEditor(true); }}
          />
        ) : null}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {showFilterEditor && (
        <FilterEditor
          filter={editingFilter}
          onSave={handleSaveFilter}
          onClose={() => { setShowFilterEditor(false); setEditingFilter(null); }}
        />
      )}
      
      {showRuleEditor && (
        <RuleEditor
          rule={editingRule}
          onSave={handleSaveRule}
          onClose={() => { setShowRuleEditor(false); setEditingRule(null); }}
        />
      )}

      {showReplyEditor && (
        <QuickReplyEditor
          reply={editingReply}
          onSave={handleSaveReply}
          onClose={() => { setShowReplyEditor(false); setEditingReply(null); }}
        />
      )}
    </div>
  );
}
