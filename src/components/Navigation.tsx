import React, { useState, useRef, useEffect } from 'react';
import { Inbox, BarChart2, Filter, Menu, Clock, AlarmClock, MessageSquare, CheckSquare, LogOut } from 'lucide-react';
import { User } from '../types';

export type TabType = 'inbox' | 'stats' | 'filters' | 'rules' | 'snoozed' | 'quickreply';

export const TopBar: React.FC<{ user: User | null; onLogout?: () => void }> = ({ user, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <header className="bg-background fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 border-b border-white/5 backdrop-blur-md bg-background/80">
      <div className="flex items-center gap-4">
        <button className="text-primary hover:bg-surface-container-highest transition-colors p-2 rounded-full">
          <Menu size={24} />
        </button>
        <h1 className="font-headline font-black tracking-tighter text-primary text-2xl uppercase">KINETIC</h1>
      </div>
      <div className="flex items-center gap-3 relative" ref={menuRef}>
        {user ? (
          <>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
            >
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-14 bg-surface-container rounded-2xl shadow-2xl shadow-black/40 border border-white/5 p-2 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="px-3 py-2.5 border-b border-white/5 mb-1">
                  <p className="font-medium text-sm text-on-surface truncate">{user.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { setShowMenu(false); onLogout?.(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-container-highest animate-pulse" />
        )}
      </div>
    </header>
  );
};

export const BottomNav: React.FC<{ activeTab: TabType, onTabChange: (tab: TabType) => void }> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={20} className={activeTab === 'inbox' ? 'fill-current' : ''} /> },
    { id: 'stats', label: 'Stats', icon: <BarChart2 size={20} className={activeTab === 'stats' ? 'fill-current' : ''} /> },
    { id: 'filters', label: 'Filters', icon: <Filter size={20} className={activeTab === 'filters' ? 'fill-current' : ''} /> },
    { id: 'rules', label: 'Rules', icon: <Clock size={20} className={activeTab === 'rules' ? 'fill-current' : ''} /> },
    { id: 'snoozed', label: 'Snooze', icon: <AlarmClock size={20} className={activeTab === 'snoozed' ? 'fill-current' : ''} /> },
    { id: 'quickreply', label: 'Replies', icon: <MessageSquare size={20} className={activeTab === 'quickreply' ? 'fill-current' : ''} /> },
  ];

  return (
    <nav className="bg-background/80 backdrop-blur-xl fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-[0_-8px_30px_rgb(208,149,255,0.08)] px-1 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="grid grid-cols-6 w-full">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors duration-200 min-w-0 ${
              activeTab === id
                ? 'bg-surface-container-highest text-primary'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            {icon}
            <span className="font-label text-[9px] font-medium uppercase leading-tight truncate max-w-full px-0.5">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};
